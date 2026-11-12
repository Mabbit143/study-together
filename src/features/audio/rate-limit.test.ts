import { expect, it, vi } from "vitest";
import { consumeAudioRateLimit } from "./rate-limit";

it("shares a durable 20-operation IP quota and fails closed", async () => {
  const request = new Request("https://app/api/speech", { headers: { "x-vercel-forwarded-for": "203.0.113.8" } });
  const config = { vercel: "1", url: "https://redis.example", token: "secret" };
  const allowed = await consumeAudioRateLimit(request, config, vi.fn().mockResolvedValue(new Response(JSON.stringify({ result: 20 }), { status: 200 })));
  const limited = await consumeAudioRateLimit(request, config, vi.fn().mockResolvedValue(new Response(JSON.stringify({ result: 21 }), { status: 200 })));
  expect([allowed, limited]).toEqual(["allowed", "limited"]);
  expect(await consumeAudioRateLimit(request, {}, vi.fn())).toBe("unavailable");
});
