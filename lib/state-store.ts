/**
 * Authoritative game-state storage with optimistic concurrency control.
 *
 * WHY: On Vercel every request may hit a different serverless instance, each
 * with its own memory. Keeping the game in `globalThis` therefore gives every
 * instance its own (often empty) game. And because routes used to accept the
 * whole state from the browser, concurrent requests overwrote each other.
 *
 * NOW:
 *  - If a Redis REST endpoint is configured (Vercel KV / Upstash), the game is
 *    stored there and shared by all instances. Otherwise we fall back to
 *    process memory, which is only correct for a single long-lived server
 *    (`next dev`, `next start`), and log a loud warning on serverless.
 *  - Every change goes through `transact()`: read the state + version, apply a
 *    pure update, and commit with an atomic compare-and-set. If someone else
 *    committed in between, we re-read and retry, so updates never get lost.
 *  - Presence (heartbeats) is stored separately so 25 phones pinging every 30s
 *    can never conflict with, or roll back, a draw.
 */
import { GameState, PlayerSession } from "@/types";
import { initializeGame } from "./game-logic";
import { instanceMemory } from "./instance-memory";
import { redisCommand, redisConfigFromEnv, RedisConfig } from "./redis-rest";

const STATE_KEY = "secret-santa:state";
const PRESENCE_KEY = "secret-santa:presence";

/** Atomic compare-and-set on the `version` field (marker comment is checked by the test fake). */
const CAS_SCRIPT = `-- secret-santa:cas:v1
local cur = redis.call('GET', KEYS[1])
local v = -1
if cur then v = tonumber(cjson.decode(cur)['version']) or 0 end
if v ~= tonumber(ARGV[1]) then return 0 end
redis.call('SET', KEYS[1], ARGV[2])
return 1`;

/** Thrown by an update function to abort a transaction with an HTTP status. */
export class GameError extends Error {
  constructor(message: string, readonly status: number, readonly state?: GameState) {
    super(message);
  }
}

interface Backend {
  /** Returns the stored state (without presence) or null */
  read(): Promise<GameState | null>;
  /** Store `next` iff the stored version equals `expectedVersion` (-1 = must not exist). */
  compareAndSet(expectedVersion: number, next: GameState): Promise<boolean>;
  readPresence(): Promise<Record<string, PlayerSession>>;
  writePresence(session: PlayerSession): Promise<void>;
  clearPresence(): Promise<void>;
}

// ---------------------------------------------------------------------------
// Backends
// ---------------------------------------------------------------------------

function memoryBackend(): Backend {
  const mem = instanceMemory() as {
    __ssState?: string | null;
    __ssPresence?: Record<string, PlayerSession>;
  };
  return {
    async read() {
      return mem.__ssState ? (JSON.parse(mem.__ssState) as GameState) : null;
    },
    async compareAndSet(expected, next) {
      // No await between check and write => atomic within this process.
      const cur = mem.__ssState ? (JSON.parse(mem.__ssState) as GameState) : null;
      const v = cur ? cur.version : -1;
      if (v !== expected) return false;
      mem.__ssState = JSON.stringify(next);
      return true;
    },
    async readPresence() {
      return { ...(mem.__ssPresence ?? {}) };
    },
    async writePresence(s) {
      mem.__ssPresence = { ...(mem.__ssPresence ?? {}), [s.playerId]: s };
    },
    async clearPresence() {
      mem.__ssPresence = {};
    },
  };
}

function redisBackend(cfg: RedisConfig): Backend {
  return {
    async read() {
      const raw = await redisCommand<string | null>(cfg, ["GET", STATE_KEY]);
      return raw ? (JSON.parse(raw) as GameState) : null;
    },
    async compareAndSet(expected, next) {
      const ok = await redisCommand<number>(cfg, [
        "EVAL",
        CAS_SCRIPT,
        1,
        STATE_KEY,
        expected,
        JSON.stringify(next),
      ]);
      return ok === 1;
    },
    async readPresence() {
      const flat = await redisCommand<string[]>(cfg, ["HGETALL", PRESENCE_KEY]);
      const out: Record<string, PlayerSession> = {};
      for (let i = 0; i + 1 < (flat?.length ?? 0); i += 2) {
        out[flat[i]] = JSON.parse(flat[i + 1]) as PlayerSession;
      }
      return out;
    },
    async writePresence(s) {
      await redisCommand(cfg, ["HSET", PRESENCE_KEY, s.playerId, JSON.stringify(s)]);
    },
    async clearPresence() {
      await redisCommand(cfg, ["DEL", PRESENCE_KEY]);
    },
  };
}

let warned = false;
function backend(): Backend {
  const cfg = redisConfigFromEnv();
  if (cfg) return redisBackend(cfg);
  if (!warned && process.env.VERCEL) {
    warned = true;
    console.error(
      "⚠️ No shared state store configured (KV_REST_API_URL / UPSTASH_REDIS_REST_URL). " +
        "On Vercel each serverless instance will have its OWN game state. " +
        "Add the Upstash Redis integration to the project."
    );
  }
  return memoryBackend();
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

const PRESENCE_TIMEOUT_MS = 60_000;

/** Merge presence into a state snapshot for clients (presence is not versioned). */
async function withPresence(b: Backend, state: GameState): Promise<GameState> {
  const presence = await b.readPresence();
  const now = Date.now();
  const sessions: Record<string, PlayerSession> = {};
  for (const [id, s] of Object.entries(presence)) {
    sessions[id] = { ...s, isOnline: s.isOnline && now - s.lastSeen <= PRESENCE_TIMEOUT_MS };
  }
  return { ...state, activePlayerSessions: sessions };
}

/** Read the current game, creating it if none exists (race-free). */
export async function loadGame(): Promise<GameState> {
  const b = backend();
  let state = await b.read();
  if (!state) {
    const fresh = initializeGame();
    // Only one concurrent creator wins; everyone else re-reads the winner's game.
    await b.compareAndSet(-1, fresh);
    state = (await b.read()) ?? fresh;
  }
  return withPresence(b, state);
}

/**
 * Apply `update` to the latest state atomically.
 *
 * `update` must be a pure function of the state it is given (it may be called
 * several times if there is contention). Throw `GameError` to reject.
 * Return the same object to signal "no change" (nothing is written).
 */
export async function transact(
  update: (state: GameState) => GameState
): Promise<{ state: GameState; changed: boolean }> {
  const b = backend();
  for (let attempt = 0; attempt < 50; attempt++) {
    let current = await b.read();
    if (!current) {
      await b.compareAndSet(-1, initializeGame());
      current = await b.read();
      if (!current) continue;
    }
    const proposed = update(structuredClone(current));
    if (proposed === current || JSON.stringify(proposed) === JSON.stringify(current)) {
      return { state: await withPresence(b, current), changed: false };
    }
    // Presence is never persisted inside the versioned state.
    const next: GameState = { ...proposed, version: current.version + 1, activePlayerSessions: {} };
    if (await b.compareAndSet(current.version, next)) {
      return { state: await withPresence(b, next), changed: true };
    }
    // Lost the race: back off a little and retry against the new state.
    await new Promise((r) => setTimeout(r, Math.random() * 5 * (attempt + 1)));
  }
  throw new GameError("Server busy, please retry", 503);
}

/** Replace the game with a brand-new one (admin reset). */
export async function resetGame(): Promise<GameState> {
  const b = backend();
  const fresh = initializeGame();
  const { state } = await transact((cur) => ({
    ...fresh,
    // Keep createdAt strictly increasing so every client accepts the reset.
    createdAt: Math.max(fresh.createdAt, cur.createdAt + 1),
    adminId: cur.adminId,
    version: cur.version,
  }));
  await b.clearPresence();
  return { ...state, activePlayerSessions: {} };
}

export async function touchPresence(playerId: string, isOnline = true): Promise<PlayerSession> {
  const b = backend();
  const existing = (await b.readPresence())[playerId];
  const now = Date.now();
  const session: PlayerSession = {
    playerId,
    connectedAt: existing?.isOnline ? existing.connectedAt : now,
    lastSeen: now,
    isOnline,
  };
  await b.writePresence(session);
  return session;
}
