import { requestSchema, validatePack, validateTurn, type StudyTurnRequest } from "./turn-schema";
import { demoPack, demoTurn } from "./demo-engine";
import { consumeRateLimit, type LimitResult } from "./rate-limit";
import { generate as generateDefault } from "./gemini-client";
import { verifyGrounding } from "./grounding-verifier";
import { containsSourceInjection } from "./source-injection";
type Kind = "turn" | "pack";
type Dependencies = { apiKey?: string; generate?: (request: StudyTurnRequest, kind: Kind, key: string) => Promise<unknown>; limit?: (request: Request) => Promise<LimitResult>; verify?: (excerpt: string, candidate: unknown, kind: Kind, key: string) => Promise<boolean> };
const MAX_BYTES = 64 * 1024;
const error = (status: number, code: string, message: string, canRetry: boolean) => Response.json({ code, message, canRetry, demoAvailable: true }, { status });
async function readBody(request: Request): Promise<unknown> {
 if (Number(request.headers.get("content-length")) > MAX_BYTES) throw new RangeError();
 const reader = request.body?.getReader(); if (!reader) throw new SyntaxError();
 let size = 0; const chunks: Uint8Array[] = [];
 while (true) { const { done, value } = await reader.read(); if (done) break; size += value.length; if (size > MAX_BYTES) { await reader.cancel(); throw new RangeError(); } chunks.push(value); }
 const bytes = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
 return JSON.parse(new TextDecoder().decode(bytes));
}
async function withTimeout<T>(operation: Promise<T>): Promise<T> {
 let timer: ReturnType<typeof setTimeout> | undefined;
 try { return await Promise.race([operation, new Promise<never>((_, reject) => { timer = setTimeout(() => reject(Object.assign(new Error("timeout"), { name: "TimeoutError" })), 20_000); })]); }
 finally { if (timer) clearTimeout(timer); }
}
export function createHandler(kind: Kind, dependencies: Dependencies = {}) {
 return async (request: Request) => {
  let body: unknown;
  try { body = await readBody(request); } catch (e) { return e instanceof RangeError ? error(413, "too_large", "This request is too large. Shorten your material or question.", false) : error(400, "invalid_request", "We could not read this request.", false); }
  const parsed = requestSchema.safeParse(body); if (!parsed.success) return error(400, "invalid_request", "Check your study material and try again.", false);
  const data = parsed.data;
  let stage = "request";
  try {
   if (data.demo) return Response.json(kind === "turn" ? validateTurn(demoTurn(data), data.material.excerpt) : validatePack(demoPack(data), data.material.excerpt));
   if (containsSourceInjection(data.material.excerpt)) return error(400, "unsafe_source", "The passage contains instructions directed at the study assistant. Remove those instructions or try the demo.", true);
   const key = dependencies.apiKey ?? process.env.GEMINI_API_KEY;
   if (!key) return error(503, "missing_key", "The study service is unavailable. Try the demo.", false);
   const limiter = dependencies.limit ?? (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN ? consumeRateLimit : undefined);
   if (limiter) {
    const limit = await limiter(request);
    if (limit === "limited") return error(429, "rate_limit", "You've reached the study limit. Try again later or use the demo.", true);
    if (limit !== "allowed") return error(503, "limiter_unavailable", "The study service is unavailable. Try again later or use the demo.", true);
   }
   stage = "generation";
   const value = await withTimeout((dependencies.generate ?? generateDefault)(data, kind, key));
   stage = "validation";
   const result = kind === "turn" ? validateTurn(value, data.material.excerpt) : validatePack(value, data.material.excerpt);
   if (kind === "turn" && "speaker" in result && result.speaker !== data.speaker) throw new Error("Unexpected speaker");
   stage = "grounding";
   const supported = await withTimeout((dependencies.verify ?? verifyGrounding)(data.material.excerpt, result, kind, key));
   if (supported !== true) {
    if (!dependencies.verify) console.error("[study] output rejected", { stage });
    return error(502, "ungrounded_output", "The response could not be verified against your material. Try again or use the demo.", true);
   }
   return Response.json(result);
  } catch (e) {
   const failure = e as { name?: string; status?: number };
   if (!dependencies.generate) console.error("[study] request failed", { stage, name: failure.name, status: failure.status });
   if (failure.name === "TimeoutError" || failure.name === "APIConnectionTimeoutError") return error(504, "timeout", "The study service took too long. Try again or use the demo.", true);
   if (failure.name === "APIConnectionError") return error(503, "connection", "Could not connect to the study service. Try again or use the demo.", true);
   if (failure.status === 429) return error(503, "quota", "The study service is temporarily unavailable. Try again later or use the demo.", true);
   return error(502, "invalid_output", "The study service could not produce a safe response. Try again or use the demo.", true);
  }
 };
}
