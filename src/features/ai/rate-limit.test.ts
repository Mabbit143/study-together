import { describe, expect, it, vi } from "vitest";
import { consumeRateLimit } from "./rate-limit";
const config = { vercel: "1", url: "https://example.upstash.io", token: "token" };
const request = (session: string) => new Request("https://example.test", { headers: { "x-vercel-forwarded-for": "192.0.2.1", "x-session-id": session } });
describe("distributed live limiter", () => {
 it("uses platform identity, not client session IDs, and atomically counts across calls", async () => {
  let count = 0; const keys: string[] = [];
  const fetcher = vi.fn(async (_url, init) => { const command = JSON.parse(String(init?.body)); keys.push(command[3]); return Response.json({ result: ++count }); }) as typeof fetch;
  for (let i = 0; i < 30; i++) expect(await consumeRateLimit(request(String(i)), config, fetcher)).toBe("allowed");
  expect(await consumeRateLimit(request("new-client-id"), config, fetcher)).toBe("limited"); expect(new Set(keys).size).toBe(1);
 });
 it("fails closed on missing config, missing trusted identity or store errors", async () => {
  const broken = vi.fn().mockRejectedValue(new Error("offline"));
  expect(await consumeRateLimit(request("x"), { ...config, url: "" }, broken)).toBe("unavailable");
  expect(await consumeRateLimit(new Request("https://example.test"), config, broken)).toBe("unavailable");
  expect(await consumeRateLimit(request("x"), config, broken)).toBe("unavailable");
  expect(await consumeRateLimit(request("x"), { ...config, vercel: "" }, broken)).toBe("unavailable");
 });
});
