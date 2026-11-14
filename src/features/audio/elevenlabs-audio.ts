import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import type { VoiceId } from "@/features/preferences/peer-options";

const defaultVoiceIds: Record<VoiceId, string> = {
  alloy: "EXAVITQu4vr4xnSDxMaL", // Sarah
  coral: "JBFqnCBsd6RMkjVDRZzb", // George
  sage: "onwK4e9ZLuTAKqWW03F9", // Daniel
};

function voiceId(voice: VoiceId): string {
  const configured = {
    alloy: process.env.ELEVENLABS_VOICE_ALLOY_ID,
    coral: process.env.ELEVENLABS_VOICE_CORAL_ID,
    sage: process.env.ELEVENLABS_VOICE_SAGE_ID,
  }[voice];
  return configured?.trim() || defaultVoiceIds[voice];
}

export async function transcribeAudio(file: File, apiKey: string): Promise<string> {
  const client = new ElevenLabsClient({ apiKey });
  const result = await client.speechToText.convert({
    file,
    modelId: process.env.ELEVENLABS_TRANSCRIBE_MODEL || "scribe_v3",
    tagAudioEvents: false,
  });
  return result.text;
}

export async function synthesizeSpeech(text: string, voice: VoiceId, apiKey: string): Promise<Uint8Array> {
  const client = new ElevenLabsClient({ apiKey });
  const audio = await client.textToSpeech.convert(voiceId(voice), {
    text,
    modelId: process.env.ELEVENLABS_SPEECH_MODEL || "eleven_flash_v2_5",
    outputFormat: "mp3_44100_128",
    voiceSettings: { stability: 0.45, similarityBoost: 0.75 },
  });
  return new Uint8Array(await new Response(audio).arrayBuffer());
}
