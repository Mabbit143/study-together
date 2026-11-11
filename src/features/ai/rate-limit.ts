import { createHash } from "node:crypto";
import { isIP } from "node:net";
type Config = { vercel?: string; url?: string; token?: string };
export type LimitResult = "allowed" | "limited" | "unavailable";
const script = "local n = redis.call('INCR', KEYS[1]); if n == 1 then redis.call('EXPIRE', KEYS[1], 3600) end; return n";
export async function consumeRateLimit(request: Request, config: Config = { vercel: process.env.VERCEL, url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN }, fetcher: typeof fetch = fetch): Promise<LimitResult> {
 // Vercel overwrites this header with the connecting IP. Other hosts are not trusted.
 const identity = request.headers.get("x-vercel-forwarded-for")?.trim();
 if (config.vercel !== "1" || !identity || !isIP(identity) || !config.url || !config.token) return "unavailable";
 try {
  const url = new URL(config.url); if (url.protocol !== "https:") return "unavailable";
  const key = `study-limit:v1:${createHash("sha256").update(identity).digest("hex")}`;
  const response = await fetcher(url, { method: "POST", headers: { authorization: `Bearer ${config.token}`, "content-type": "application/json" }, body: JSON.stringify(["EVAL", script, 1, key]), signal: AbortSignal.timeout(3000), cache: "no-store" });
  if (!response.ok) return "unavailable";
  const body: unknown = await response.json();
  if (!body || typeof body !== "object" || !("result" in body) || !Number.isSafeInteger(body.result) || (body.result as number) < 1) return "unavailable";
  return (body.result as number) <= 30 ? "allowed" : "limited";
 } catch { return "unavailable"; }
}
