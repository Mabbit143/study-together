import { describe, expect, it, vi } from "vitest";
import { createTranscribeHandler } from "@/features/audio/handler";

const request = () => new Request("http://local/api/transcribe", { method: "POST", headers: { "x-vercel-forwarded-for": "203.0.113.1" } });
const upload = (blob: Blob) => vi.fn().mockResolvedValue(Object.assign(blob, { name: "turn.webm" }));
describe("transcribe route", () => {
  it("returns a client error for malformed multipart before limiting or provider work", async () => {
    const limit = vi.fn(); const transcribe = vi.fn();
    const malformed = new Request("http://local/api/transcribe", { method: "POST", body: "not multipart", headers: { "content-type": "multipart/form-data; boundary=missing", "x-vercel-forwarded-for": "203.0.113.1" } });
    const response = await createTranscribeHandler({ apiKey: "fake", limit, transcribe })(malformed);
    expect(response.status).toBe(400); expect(await response.json()).toMatchObject({ code: "invalid_request" }); expect(limit).not.toHaveBeenCalled(); expect(transcribe).not.toHaveBeenCalled();
  });
  it("rejects empty, invalid MIME, and oversized audio", async () => {
    const base = { apiKey: "fake", limit: vi.fn().mockResolvedValue("allowed") };
    expect((await createTranscribeHandler({ ...base, readAudio: upload(new Blob([], { type: "audio/webm" })) })(request())).status).toBe(400);
    expect((await createTranscribeHandler({ ...base, readAudio: upload(new Blob(["x"], { type: "text/plain" })) })(request())).status).toBe(415);
    expect((await createTranscribeHandler({ ...base, readAudio: upload(new Blob([new Uint8Array(25 * 1024 * 1024 + 1)], { type: "audio/webm" })) })(request())).status).toBe(413);
  });
  it.each([["timeout", { name: "TimeoutError" }, 504], ["quota", { status: 429 }, 503], ["invalid_output", "", 502]])("handles %s without content logs", async (_name, result, status) => {
    const log = vi.spyOn(console, "error");
    const transcribe = result === "" ? vi.fn().mockResolvedValue(result) : vi.fn().mockRejectedValue(result);
    const response = await createTranscribeHandler({ apiKey: "fake", limit: vi.fn().mockResolvedValue("allowed"), readAudio: upload(new Blob(["audio"], { type: "audio/webm" })), transcribe })(request());
    expect(response.status).toBe(status); expect(log).not.toHaveBeenCalled(); log.mockRestore();
  });
  it("fails closed before provider when the durable limiter is unavailable", async () => {
    const transcribe = vi.fn(); const response = await createTranscribeHandler({ apiKey: "fake", limit: vi.fn().mockResolvedValue("unavailable"), readAudio: upload(new Blob(["audio"], { type: "audio/webm" })), transcribe })(request());
    expect(response.status).toBe(503); expect(transcribe).not.toHaveBeenCalled();
  });
});
