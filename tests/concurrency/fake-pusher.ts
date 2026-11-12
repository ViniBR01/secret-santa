/**
 * In-memory stand-in for Pusher.
 *
 * Server side: `trigger()` resolves after a (simulated) round-trip to Pusher.
 * Client side: each subscriber receives every event after its *own* random
 * delivery delay. Because the delay is drawn per-event, two events sent in
 * order can arrive out of order on a jittery connection - exactly what
 * happens on real mobile networks / websockets that reconnect.
 */
export type Rng = () => number;

/** Deterministic PRNG (mulberry32) so failures are reproducible from a seed. */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export interface LatencyProfile {
  /** Fixed one-way latency in ms */
  base: number;
  /** Extra random latency in [0, jitter) ms, drawn per message */
  jitter: number;
}

export const delayFor = (p: LatencyProfile, rng: Rng) => p.base + rng() * p.jitter;

type Handler = (data: any) => void;

export class FakeChannel {
  private handlers = new Map<string, Handler[]>();
  /** Websocket delivery is FIFO per connection: never deliver before the previous event. */
  private lastDeliveryAt = 0;
  private offlineUntil = 0;
  private closed = false;
  dropped = 0;

  constructor(
    readonly profile: LatencyProfile,
    private rng: Rng,
    readonly name: string,
    /** If true, events may overtake each other (models multiple connections / proxies). */
    private allowReorder = false
  ) {}

  bind(event: string, cb: Handler) {
    const list = this.handlers.get(event) ?? [];
    list.push(cb);
    this.handlers.set(event, list);
  }

  get connected() {
    return !this.closed && Date.now() >= this.offlineUntil;
  }

  /**
   * Simulate the phone going to sleep / losing signal for `ms`.
   * Pusher does NOT replay events missed while disconnected; on reconnect
   * pusher-js re-subscribes and fires `pusher:subscription_succeeded` again.
   */
  goOffline(ms: number) {
    this.offlineUntil = Date.now() + ms;
    setTimeout(() => {
      if (!this.closed) this.emitLocal("pusher:subscription_succeeded");
    }, ms + delayFor(this.profile, this.rng));
  }

  close() {
    this.closed = true;
  }

  /** Called by the hub; schedules delivery after this subscriber's latency. */
  deliver(event: string, data: unknown): Promise<void> {
    if (!this.connected) {
      this.dropped++;
      return Promise.resolve();
    }
    // Deep copy: real clients get their own JSON-decoded copy.
    const payload = JSON.parse(JSON.stringify(data ?? null));
    const now = Date.now();
    let at = now + delayFor(this.profile, this.rng);
    if (!this.allowReorder) at = Math.max(at, this.lastDeliveryAt);
    this.lastDeliveryAt = at;
    return new Promise((resolve) => {
      setTimeout(() => {
        if (!this.closed) {
          for (const cb of this.handlers.get(event) ?? []) cb(payload);
        }
        resolve();
      }, at - now);
    });
  }

  emitLocal(event: string, data?: unknown) {
    for (const cb of this.handlers.get(event) ?? []) cb(data);
  }
}

export class FakePusherHub {
  private channels: FakeChannel[] = [];
  private inflight = new Set<Promise<void>>();
  readonly log: { event: string; data: any }[] = [];

  constructor(private rng: Rng, private serverToPusherMs = 5) {}

  subscribe(profile: LatencyProfile, name: string, allowReorder = false): FakeChannel {
    const ch = new FakeChannel(profile, this.rng, name, allowReorder);
    this.channels.push(ch);
    // Subscription completes asynchronously, like the real thing.
    setTimeout(() => ch.emitLocal("pusher:subscription_succeeded"), delayFor(profile, this.rng));
    return ch;
  }

  /** Mirrors `pusherServer.trigger(channel, event, data)` */
  trigger = async (_channel: string, event: string, data: unknown) => {
    this.log.push({ event, data: JSON.parse(JSON.stringify(data ?? null)) });
    await sleep(this.serverToPusherMs);
    for (const ch of this.channels) {
      const p = ch.deliver(event, data);
      this.inflight.add(p);
      p.finally(() => this.inflight.delete(p));
    }
    return {};
  };

  /** Wait until every scheduled event has been delivered to every client. */
  async drain() {
    while (this.inflight.size > 0) {
      await Promise.all([...this.inflight]);
    }
  }
}
