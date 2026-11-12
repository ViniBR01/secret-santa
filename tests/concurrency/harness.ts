import { NextRequest } from "next/server";
import { createStore, StoreApi } from "zustand/vanilla";
import { createGameStoreState, GameStore } from "@/lib/store";
import { attachRealtime } from "@/lib/pusher-events";
import { instanceScope, InstanceMemory } from "@/lib/instance-memory";
import {
  FakeChannel,
  FakePusherHub,
  LatencyProfile,
  Rng,
  delayFor,
  seededRng,
  sleep,
} from "./fake-pusher";
import { FakeRedis, FAKE_REDIS_TOKEN, FAKE_REDIS_URL } from "./fake-redis";
import { requestContext } from "./next-headers-mock";
import { setHub } from "./pusher-mock";

import * as stateRoute from "@/app/api/state/route";
import * as drawRoute from "@/app/api/draw/route";
import * as optionsRoute from "@/app/api/draw/options/route";
import * as selectRoute from "@/app/api/draw/select/route";
import * as startGameRoute from "@/app/api/admin/start-game/route";
import * as setNextRoute from "@/app/api/admin/set-next-result/route";
import * as identifyRoute from "@/app/api/session/identify/route";
import * as adminRoute from "@/app/api/session/admin/route";
import * as heartbeatRoute from "@/app/api/session/heartbeat/route";
import * as logoutRoute from "@/app/api/session/logout/route";
import * as statusRoute from "@/app/api/session/status/route";

type Handler = (req: NextRequest) => Promise<Response>;
const ROUTES: Record<string, Partial<Record<string, Handler>>> = {
  "/api/state": stateRoute as never,
  "/api/draw": drawRoute as never,
  "/api/draw/options": optionsRoute as never,
  "/api/draw/select": selectRoute as never,
  "/api/admin/start-game": startGameRoute as never,
  "/api/admin/set-next-result": setNextRoute as never,
  "/api/session/identify": identifyRoute as never,
  "/api/session/admin": adminRoute as never,
  "/api/session/heartbeat": heartbeatRoute as never,
  "/api/session/logout": logoutRoute as never,
  "/api/session/status": statusRoute as never,
};

// ---------------------------------------------------------------------------
// Server side: a pool of serverless instances behind a load balancer
// ---------------------------------------------------------------------------

export type Topology =
  /** One long-lived Node process (e.g. `next start` on a VM). */
  | { kind: "single" }
  /**
   * Vercel-style serverless: each instance handles one request at a time;
   * when all are busy a new one cold-starts with EMPTY memory. Idle instances
   * are recycled after `idleTimeoutMs` (memory lost).
   */
  | { kind: "serverless"; maxInstances: number; idleTimeoutMs?: number; coldStartMs?: number };

interface Instance {
  id: number;
  memory: InstanceMemory;
  busy: number;
  lastUsed: number;
}

/** Thrown inside a scenario that has already been torn down, so leftover async work stops. */
export class ScenarioDisposed extends Error {
  constructor() {
    super("scenario disposed");
  }
}

export class SimulatedServer {
  instances: Instance[] = [];
  disposed = false;
  private nextId = 0;
  requests = 0;

  constructor(private topology: Topology, private rng: Rng, private processingMs = 3) {}

  private spawn(): Instance {
    const inst: Instance = { id: this.nextId++, memory: {}, busy: 0, lastUsed: Date.now() };
    this.instances.push(inst);
    return inst;
  }

  private pick(): { inst: Instance; cold: boolean } {
    if (this.topology.kind === "single") {
      return { inst: this.instances[0] ?? this.spawn(), cold: false };
    }
    const { maxInstances, idleTimeoutMs } = this.topology;
    const now = Date.now();
    if (idleTimeoutMs !== undefined) {
      this.instances = this.instances.filter(
        (i) => i.busy > 0 || now - i.lastUsed < idleTimeoutMs
      );
    }
    const idle = this.instances.filter((i) => i.busy === 0);
    if (idle.length > 0) {
      return { inst: idle[Math.floor(this.rng() * idle.length)], cold: false };
    }
    if (this.instances.length < maxInstances) {
      return { inst: this.spawn(), cold: true };
    }
    return { inst: this.instances[Math.floor(this.rng() * this.instances.length)], cold: false };
  }

  async handle(path: string, method: string, body: string | undefined, cookieJar: Map<string, string>) {
    if (this.disposed) throw new ScenarioDisposed();
    const handler = ROUTES[path]?.[method];
    if (!handler) return { status: 404, body: JSON.stringify({ error: "not found" }) };

    const { inst, cold } = this.pick();
    inst.busy++;
    this.requests++;
    try {
      if (cold && this.topology.kind === "serverless") {
        await sleep(this.topology.coldStartMs ?? 10);
      }
      const cookieHeader = [...cookieJar].map(([k, v]) => `${k}=${v}`).join("; ");
      const req = new NextRequest(`http://localhost${path}`, {
        method,
        body: method === "GET" || method === "HEAD" ? undefined : body,
        headers: { "content-type": "application/json", cookie: cookieHeader },
      });
      const ctx = { cookies: new Map(cookieJar), changes: new Map<string, string | null>() };
      await sleep(this.processingMs * this.rng());
      const res = await instanceScope.run(inst.memory, () =>
        requestContext.run(ctx, () => handler(req))
      );
      const text = await res.text();
      return { status: res.status, body: text, cookieChanges: ctx.changes };
    } finally {
      inst.busy--;
      inst.lastUsed = Date.now();
    }
  }
}

// ---------------------------------------------------------------------------
// Client side: a simulated browser tab
// ---------------------------------------------------------------------------

export interface ClientProfile {
  /** One-way HTTP latency between this client and the server */
  http: LatencyProfile;
  /** Latency for realtime (Pusher) event delivery to this client */
  realtime: LatencyProfile;
  /** Probability that an HTTP response is lost after the server processed it (timeout) */
  responseLossRate?: number;
  /** Allow realtime events to arrive out of order */
  reorderEvents?: boolean;
  /** Safety-net resync interval for this client */
  pollMs?: number;
}

export class SimulatedBrowser {
  readonly cookies = new Map<string, string>();
  readonly store: StoreApi<GameStore>;
  readonly channel: FakeChannel;
  /** Every (game, currentDrawerIndex) this client has displayed after syncing, in order */
  readonly indexHistory: { gameId: string; idx: number }[] = [];
  /** Every lastDrawResult this client has been shown (i.e. reveal animations) */
  readonly revealsShown: { drawId: string; drawerId: string; gifteeId: string }[] = [];
  httpErrors = 0;
  readonly detach: () => void;

  constructor(
    readonly name: string,
    readonly profile: ClientProfile,
    private server: SimulatedServer,
    hub: FakePusherHub,
    private rng: Rng
  ) {
    this.store = createStore<GameStore>()(createGameStoreState(this.fetch));
    this.channel = hub.subscribe(profile.realtime, name, profile.reorderEvents);
    this.detach = attachRealtime({
      channel: this.channel,
      connection: { bind: () => undefined },
      getStore: this.store.getState,
      pollMs: profile.pollMs,
    });
    this.store.subscribe((s, prev) => {
      const last = this.indexHistory[this.indexHistory.length - 1];
      if (s.isGameReady && (!last || last.idx !== s.currentDrawerIndex || last.gameId !== s.gameId)) {
        this.indexHistory.push({ gameId: s.gameId, idx: s.currentDrawerIndex });
      }
      if (s.lastDrawResult && s.lastDrawResult !== prev.lastDrawResult) {
        this.revealsShown.push({
          drawId: s.lastDrawResult.drawId,
          drawerId: s.lastDrawResult.drawerId,
          gifteeId: s.lastDrawResult.gifteeId,
        });
      }
    });
  }

  get state() {
    return this.store.getState();
  }

  /** fetch() as seen by this browser: latency up, server, latency down, maybe lost. */
  fetch = async (input: string, init?: RequestInit): Promise<Response> => {
    const method = (init?.method ?? "GET").toUpperCase();
    const path = new URL(input, "http://localhost").pathname;
    if (this.server.disposed) throw new ScenarioDisposed();
    await sleep(delayFor(this.profile.http, this.rng));
    const res = await this.server.handle(
      path,
      method,
      init?.body === undefined ? undefined : String(init.body),
      this.cookies
    );
    await sleep(delayFor(this.profile.http, this.rng));
    if (this.rng() < (this.profile.responseLossRate ?? 0)) {
      // The server DID process the request, but the response (and its Set-Cookie) never arrives.
      this.httpErrors++;
      throw new TypeError("Failed to fetch (simulated timeout)");
    }
    for (const [k, v] of res.cookieChanges ?? []) {
      if (v === null) this.cookies.delete(k);
      else this.cookies.set(k, v);
    }
    return new Response(res.body, {
      status: res.status,
      headers: { "content-type": "application/json" },
    });
  };

  /** What app/page.tsx does on load: establish session, then initGame(). */
  async open(opts: { playerId?: string; adminCode?: string }) {
    // Like a person: if logging in fails (timeout), click the button again.
    for (let attempt = 0; attempt < 10; attempt++) {
      try {
        if (opts.adminCode) {
          await this.fetch("/api/session/admin", {
            method: "POST",
            body: JSON.stringify({ secretCode: opts.adminCode }),
          });
        } else if (opts.playerId) {
          await this.fetch("/api/session/identify", {
            method: "POST",
            body: JSON.stringify({ playerId: opts.playerId }),
          });
        }
        break;
      } catch {
        await sleep(50);
      }
    }
    await this.state.initGame();
  }

  /** Reload the page: fresh JS state, same cookies. */
  async reload() {
    // Fresh JS state whose actions are bound to *this* store (same as a page load).
    const fresh = createGameStoreState(this.fetch)(this.store.setState, this.store.getState, this.store);
    this.store.setState(fresh, true);
    this.store.setState({ isPusherReady: this.channel.connected });
    await this.state.initGame();
  }
}

// ---------------------------------------------------------------------------
// Scenario: wire it all together
// ---------------------------------------------------------------------------

export interface ScenarioOptions {
  seed: number;
  topology: Topology;
  /** Provide a shared Redis (as Vercel KV/Upstash would). The app decides whether to use it. */
  withRedis?: boolean;
  redisLatencyMs?: number;
  pusherLatencyMs?: number;
}

export class Scenario {
  readonly rng: Rng;
  readonly hub: FakePusherHub;
  readonly server: SimulatedServer;
  readonly redis: FakeRedis | null;
  readonly browsers: SimulatedBrowser[] = [];
  private realFetch = globalThis.fetch;

  constructor(readonly opts: ScenarioOptions) {
    this.rng = seededRng(opts.seed);
    this.hub = new FakePusherHub(this.rng, opts.pusherLatencyMs ?? 5);
    this.server = new SimulatedServer(opts.topology, this.rng);
    this.redis = opts.withRedis ? new FakeRedis(this.rng, opts.redisLatencyMs ?? 2) : null;
    setHub(this.hub);

    if (this.redis) {
      process.env.KV_REST_API_URL = FAKE_REDIS_URL;
      process.env.KV_REST_API_TOKEN = FAKE_REDIS_TOKEN;
    } else {
      delete process.env.KV_REST_API_URL;
      delete process.env.KV_REST_API_TOKEN;
    }
    const redis = this.redis;
    const realFetch = this.realFetch;
    const server = this.server;
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      if (server.disposed) throw new ScenarioDisposed();
      const url = String(input instanceof Request ? input.url : input);
      if (redis && url.startsWith(FAKE_REDIS_URL)) return redis.handle(url, init);
      if (url.startsWith("http")) {
        throw new Error(`Unexpected outbound fetch in test: ${url}`);
      }
      return realFetch(input, init);
    }) as typeof fetch;
    this.patchedFetch = globalThis.fetch;
  }
  private patchedFetch: typeof fetch;

  browser(name: string, profile: ClientProfile) {
    const b = new SimulatedBrowser(name, profile, this.server, this.hub, this.rng);
    this.browsers.push(b);
    return b;
  }

  /** Ask a brand-new visitor what the game looks like (via the load balancer). */
  async freshView() {
    const res = await this.server.handle("/api/state", "GET", undefined, new Map());
    return JSON.parse(res.body).gameState as GameStore | null;
  }

  /** Wait for all in-flight realtime events to land. */
  async settle(extraMs = 50) {
    if (this.server.disposed) throw new ScenarioDisposed();
    await this.hub.drain();
    await sleep(extraMs);
    await this.hub.drain();
  }

  dispose() {
    this.server.disposed = true;
    for (const b of this.browsers) {
      b.channel.close();
      b.detach();
    }
    if (globalThis.fetch === this.patchedFetch) {
      globalThis.fetch = this.realFetch;
      setHub(null);
      delete process.env.KV_REST_API_URL;
      delete process.env.KV_REST_API_TOKEN;
    }
  }
}

/** Latency presets (one-way, ms). Kept small so the suite runs in seconds. */
export const NET = {
  lan: { http: { base: 1, jitter: 3 }, realtime: { base: 1, jitter: 3 } },
  wifi: { http: { base: 10, jitter: 20 }, realtime: { base: 10, jitter: 30 } },
  mobile4g: { http: { base: 30, jitter: 60 }, realtime: { base: 30, jitter: 90 } },
  /** Abuela's phone on 3G in the kitchen */
  badMobile: { http: { base: 80, jitter: 150 }, realtime: { base: 100, jitter: 300 } },
} satisfies Record<string, ClientProfile>;

export function mixedProfile(rng: Rng): ClientProfile {
  const r = rng();
  if (r < 0.2) return NET.lan;
  if (r < 0.55) return NET.wifi;
  if (r < 0.85) return NET.mobile4g;
  return NET.badMobile;
}
