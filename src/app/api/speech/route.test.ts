import { describe, expect, it, vi } from "vitest";
import { createSpeechHandler } from "@/features/audio/handler";
const request = (body: unknown) => new Request("http://local/api/speech", { method: "POST", body: JSON.stringify(body), headers: { "content-type": "application/json", "x-vercel-forwarded-for": "203.0.113.1" } });
describe("speech route", () => {
  it("rejects text beyond 1500 chars and unknown voices", async () => {
    const handler = createSpeechHandler({ apiKey: "fake", limit: vi.fn().mockResolvedValue("allowed") });
    expect((await handler(request({ text: "x".repeat(1501), voice: "alloy" }))).status).toBe(400);
    expect((await handler(request({ text: "hello", voice: "stranger" }))).status).toBe(400);
  });
  it("returns MPEG only after the shared limiter and rejects malformed provider output", async () => {
    const limit = vi.fn().mockResolvedValue("allowed");
    const ok = await createSpeechHandler({ apiKey: "fake", limit, speak: vi.fn().mockResolvedValue(new Uint8Array([1, 2])) })(request({ text: "hello", voice: "coral" }));
    expect(ok.headers.get("content-type")).toBe("audio/mpeg");
    const bad = await createSpeechHandler({ apiKey: "fake", limit, speak: vi.fn().mockResolvedValue(new Uint8Array()) })(request({ text: "hello", voice: "coral" }));
    expect(bad.status).toBe(502);
  });
});
