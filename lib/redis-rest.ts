/**
 * Tiny dependency-free client for the Upstash Redis REST API
 * (what Vercel's "Upstash for Redis" / legacy "Vercel KV" integration exposes).
 * https://upstash.com/docs/redis/features/restapi
 */
export interface RedisConfig {
  url: string;
  token: string;
}

export function redisConfigFromEnv(): RedisConfig | null {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url: url.replace(/\/$/, ""), token } : null;
}

export async function redisCommand<T = unknown>(
  cfg: RedisConfig,
  command: (string | number)[]
): Promise<T> {
  const res = await fetch(cfg.url, {
    method: "POST",
    headers: { authorization: `Bearer ${cfg.token}`, "content-type": "application/json" },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  const json = (await res.json()) as { result?: T; error?: string };
  if (!res.ok || json.error) {
    throw new Error(`Redis ${String(command[0])} failed: ${json.error ?? res.status}`);
  }
  return json.result as T;
}
