import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ transcribe: vi.fn(), speak: vi.fn() }));
vi.mock("@elevenlabs/elevenlabs-js", () => ({
  ElevenLabsClient: class {
    speechToText = { convert: mocks.transcribe };
    textToSpeech = { convert: mocks.speak };
  },
}));

import { synthesizeSpeech, transcribeAudio } from "./elevenlabs-audio";

describe("ElevenLabs audio adapter", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    mocks.transcribe.mockReset();
    mocks.speak.mockReset();
  });

  it("uses Scribe v3 for bounded recorded turns", async () => {
    mocks.transcribe.mockResolvedValue({ text: "Study this passage." });
    const file = new File(["audio"], "turn.webm", { type: "audio/webm" });
    await expect(transcribeAudio(file, "test-key")).resolves.toBe("Study this passage.");
    expect(mocks.transcribe).toHaveBeenCalledWith({ file, modelId: "scribe_v3", tagAudioEvents: false });
  });

  it("maps each peer voice to ElevenLabs Flash TTS and returns MP3 bytes", async () => {
    mocks.speak.mockResolvedValue(new Uint8Array([1, 2, 3]));
    await expect(synthesizeSpeech("Let us practice.", "coral", "test-key")).resolves.toEqual(new Uint8Array([1, 2, 3]));
    expect(mocks.speak).toHaveBeenCalledWith("JBFqnCBsd6RMkjVDRZzb", expect.objectContaining({
      text: "Let us practice.", modelId: "eleven_flash_v2_5", outputFormat: "mp3_44100_128",
    }));
  });
});
