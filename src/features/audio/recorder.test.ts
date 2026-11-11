import { describe, expect, it, vi } from "vitest";
import { createRecorder } from "./recorder";

describe("recorder", () => {
  it("does not request a microphone until explicit start and auto-stop produces usable audio", async () => {
    const getUserMedia = vi.fn().mockResolvedValue({ getTracks: () => [{ stop: vi.fn() }] }); const listeners: Record<string, (event?: { data?: Blob }) => void> = {};
    const media = { mimeType: "audio/webm", state: "recording", start: vi.fn(), addEventListener: (name: string, listener: (event?: { data?: Blob }) => void) => { listeners[name] = listener; }, stop: vi.fn(() => { listeners.dataavailable?.({ data: new Blob(["voice"], { type: "audio/webm" }) }); listeners.stop?.(); }) };
    const recorder = createRecorder({ getUserMedia, createMediaRecorder: () => media, schedule: callback => { callback(); return setTimeout(() => undefined, 0); }, cancel: vi.fn() });
    expect(recorder.state()).toMatchObject({ status: "idle", transcript: "" });
    expect(getUserMedia).not.toHaveBeenCalled();
    await recorder.start();
    expect(getUserMedia).toHaveBeenCalledOnce();
    expect(media.stop).toHaveBeenCalledOnce(); expect(recorder.state().recording).toBeInstanceOf(Blob); expect(recorder.state().recording?.size).toBeGreaterThan(0);
  });

  it("manual stop produces audio and empty chunks do not become a recording", async () => {
    const listeners: Record<string, (event?: { data?: Blob }) => void> = {}; let chunk = new Blob(["voice"], { type: "audio/webm" });
    const media = { mimeType: "audio/webm", state: "recording", start: vi.fn(), addEventListener: (name: string, listener: (event?: { data?: Blob }) => void) => { listeners[name] = listener; }, stop: vi.fn(() => { listeners.dataavailable?.({ data: chunk }); listeners.stop?.(); }) };
    const recorder = createRecorder({ getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [] }), createMediaRecorder: () => media }); await recorder.start(); recorder.stop();
    expect(recorder.state()).toMatchObject({ status: "stopped" }); expect(recorder.state().recording?.size).toBe(5);
    chunk = new Blob([], { type: "audio/webm" }); await recorder.start(); recorder.stop(); expect(recorder.state().recording).toBeUndefined();
  });

  it("offers typed fallback for denial and unsupported browsers and keeps transcript editable", async () => {
    const denied = createRecorder({ getUserMedia: vi.fn().mockRejectedValue(Object.assign(new Error(), { name: "NotAllowedError" })), createMediaRecorder: () => ({ start: vi.fn(), stop: vi.fn(), state: "inactive", mimeType: "audio/webm", addEventListener: vi.fn() }) });
    await denied.start();
    expect(denied.state()).toMatchObject({ status: "denied", typedFallback: true });
    const unsupported = createRecorder({});
    await unsupported.start();
    unsupported.setTranscript("edited words");
    expect(unsupported.state()).toMatchObject({ status: "unsupported", typedFallback: true, transcript: "edited words" });
  });

  it("stops acquired tracks if recorder construction or start fails", async () => {
    const track = { stop: vi.fn() }; const getUserMedia = vi.fn().mockResolvedValue({ getTracks: () => [track] });
    const constructing = createRecorder({ getUserMedia, createMediaRecorder: () => { throw new Error("constructor"); } }); await constructing.start(); expect(track.stop).toHaveBeenCalledOnce();
    track.stop.mockClear(); const starting = createRecorder({ getUserMedia, createMediaRecorder: () => ({ state: "inactive", mimeType: "audio/webm", addEventListener: vi.fn(), start: () => { throw new Error("start"); }, stop: vi.fn() }) }); await starting.start(); expect(track.stop).toHaveBeenCalledOnce();
  });
});
