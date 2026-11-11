import { requestSchema, validatePack, validateTurn, type StudyTurnRequest } from "./turn-schema";
import { demoPack, demoTurn } from "./demo-engine";
import { consumeRateLimit } from "./rate-limit";
import { generate as generateDefault } from "./openai-client";
type Dependencies = { apiKey?: string; generate?: (request: StudyTurnRequest, kind: "turn" | "pack", key: string) => Promise<unknown> };
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
export function createHandler(kind: "turn" | "pack", dependencies: Dependencies = {}) {
 return async (request: Request) => {
  let body: unknown;
  try { body = await readBody(request); } catch (e) { return e instanceof RangeError ? error(413, "too_large", "This request is too large. Shorten your material or question.", false) : error(400, "invalid_request", "We could not read this request.", false); }
  const parsed = requestSchema.safeParse(body); if (!parsed.success) return error(400, "invalid_request", "Check your study material and try again.", false);
  const data = parsed.data;
  if (!consumeRateLimit(data.sessionId)) return error(429, "rate_limit", "You've reached the study limit. Try again later or use a saved pack.", true);
  try {
   const key = dependencies.apiKey ?? process.env.OPENAI_API_KEY;
   if (!data.demo && !key) return error(503, "missing_key", "The study service is unavailable. Try the demo.", false);
   let value: unknown;
   if (data.demo) value = kind === "turn" ? demoTurn(data) : demoPack(data);
   else {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try { value = await Promise.race([(dependencies.generate ?? generateDefault)(data, kind, key!), new Promise<never>((_, reject) => { timer = setTimeout(() => reject(Object.assign(new Error("timeout"), { name: "TimeoutError" })), 20_000); })]); }
    finally { if (timer) clearTimeout(timer); }
   }
   const result = kind === "turn" ? validateTurn(value, data.material.excerpt) : validatePack(value, data.material.excerpt);
   if (kind === "turn" && "speaker" in result && result.speaker !== data.speaker) throw new Error("Unexpected speaker");
   return Response.json(result);
  } catch (e) {
   const failure = e as { name?: string; status?: number };
   if (failure.name === "TimeoutError" || failure.name === "APIConnectionTimeoutError") return error(504, "timeout", "The study service took too long. Try again or use the demo.", true);
   if (failure.name === "APIConnectionError") return error(503, "connection", "Could not connect to the study service. Try again or use the demo.", true);
   if (failure.status === 429) return error(503, "quota", "The study service is temporarily unavailable. Try again later or use the demo.", true);
   return error(502, "invalid_output", "The study service could not produce a safe response. Try again or use the demo.", true);
  }
 };
}
