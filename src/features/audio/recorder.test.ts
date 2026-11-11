import { describe, expect, it, vi } from "vitest";
import { createRecorder } from "./recorder";

describe("recorder", () => {
  it("does not request a microphone until explicit start and stops at 60 seconds", async () => {
    const getUserMedia = vi.fn().mockResolvedValue({ getTracks: () => [{ stop: vi.fn() }] });
    const stop = vi.fn();
    const recorder = createRecorder({ getUserMedia, createMediaRecorder: () => ({ start: vi.fn(), stop, state: "recording" }), schedule: callback => { callback(); return setTimeout(() => undefined, 0); }, cancel: vi.fn() });
    expect(recorder.state()).toMatchObject({ status: "idle", transcript: "" });
    expect(getUserMedia).not.toHaveBeenCalled();
    await recorder.start();
    expect(getUserMedia).toHaveBeenCalledOnce();
    expect(stop).toHaveBeenCalledOnce();
  });

  it("offers typed fallback for denial and unsupported browsers and keeps transcript editable", async () => {
    const denied = createRecorder({ getUserMedia: vi.fn().mockRejectedValue(Object.assign(new Error(), { name: "NotAllowedError" })), createMediaRecorder: () => ({ start: vi.fn(), stop: vi.fn(), state: "inactive" }) });
    await denied.start();
    expect(denied.state()).toMatchObject({ status: "denied", typedFallback: true });
    const unsupported = createRecorder({});
    await unsupported.start();
    unsupported.setTranscript("edited words");
    expect(unsupported.state()).toMatchObject({ status: "unsupported", typedFallback: true, transcript: "edited words" });
  });
});
