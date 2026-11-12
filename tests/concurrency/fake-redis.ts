import { Rng, sleep } from "./fake-pusher";

/**
 * Minimal in-process emulation of the Upstash Redis REST API
 * (https://upstash.com/docs/redis/features/restapi), which is what
 * Vercel's KV / Redis marketplace integration exposes.
 *
 * Supports: GET, SET, DEL, HSET, HGETALL, HGET, and EVAL for the single
 * compare-and-set script used by lib/state-store.ts. Every command is applied
 * atomically (JS is single threaded and we never await mid-command), which is
 * the guarantee real Redis gives.
 */
export const FAKE_REDIS_URL = "https://fake-redis.test";
export const FAKE_REDIS_TOKEN = "fake-token";

export class FakeRedis {
  strings = new Map<string, string>();
  hashes = new Map<string, Map<string, string>>();
  commands = 0;

  constructor(private rng: Rng, private latencyMs = 2) {}

  /** Execute one command (array form, like the Upstash REST body). */
  exec(cmd: (string | number)[]): unknown {
    this.commands++;
    const [rawName, ...args] = cmd.map(String);
    const name = rawName.toUpperCase();
    switch (name) {
      case "GET":
        return this.strings.get(args[0]) ?? null;
      case "SET":
        this.strings.set(args[0], args[1]);
        return "OK";
      case "DEL": {
        let n = 0;
        for (const k of args) {
          if (this.strings.delete(k)) n++;
          if (this.hashes.delete(k)) n++;
        }
        return n;
      }
      case "HSET": {
        const h = this.hashes.get(args[0]) ?? new Map<string, string>();
        this.hashes.set(args[0], h);
        let added = 0;
        for (let i = 1; i < args.length; i += 2) {
          if (!h.has(args[i])) added++;
          h.set(args[i], args[i + 1]);
        }
        return added;
      }
      case "HGET":
        return this.hashes.get(args[0])?.get(args[1]) ?? null;
      case "HGETALL": {
        const h = this.hashes.get(args[0]);
        if (!h) return [];
        return [...h.entries()].flat();
      }
      case "EVAL":
        return this.evalScript(args[0], Number(args[1]), args.slice(2));
      default:
        throw new Error(`FakeRedis: unsupported command ${name}`);
    }
  }

  /**
   * Only the compare-and-set script is supported. We recognise it by a marker
   * comment so the fake can't silently diverge from the real script.
   */
  private evalScript(script: string, numKeys: number, rest: string[]): unknown {
    if (!script.includes("secret-santa:cas:v1")) {
      throw new Error("FakeRedis: unknown EVAL script");
    }
    const keys = rest.slice(0, numKeys);
    const argv = rest.slice(numKeys);
    // KEYS[1] = state key, ARGV[1] = expected version ("-1" = must not exist), ARGV[2] = new JSON
    const current = this.strings.get(keys[0]);
    const currentVersion = current === undefined ? -1 : Number(JSON.parse(current).version ?? 0);
    if (currentVersion !== Number(argv[0])) return 0;
    this.strings.set(keys[0], argv[1]);
    return 1;
  }

  /** fetch() handler for the REST endpoint, with simulated network latency. */
  handle = async (url: string, init?: RequestInit): Promise<Response> => {
    const auth = new Headers(init?.headers).get("authorization");
    if (auth !== `Bearer ${FAKE_REDIS_TOKEN}`) {
      return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
    }
    await sleep(this.latencyMs * (0.5 + this.rng()));
    const path = new URL(url).pathname;
    const body = init?.body ? JSON.parse(String(init.body)) : null;
    try {
      if (path === "/pipeline" || path === "/multi-exec") {
        const results = (body as (string | number)[][]).map((c) => ({ result: this.exec(c) }));
        await sleep(this.latencyMs * (0.5 + this.rng()));
        return new Response(JSON.stringify(results), { status: 200 });
      }
      const result = this.exec(body as (string | number)[]);
      await sleep(this.latencyMs * (0.5 + this.rng()));
      return new Response(JSON.stringify({ result }), { status: 200 });
    } catch (e) {
      return new Response(JSON.stringify({ error: String(e) }), { status: 400 });
    }
  };
}
