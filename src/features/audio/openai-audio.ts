import OpenAI, { toFile } from "openai";
import type { VoiceId } from "@/features/preferences/peer-options";
export async function transcribeAudio(file: File, apiKey: string): Promise<string> { const client = new OpenAI({ apiKey, timeout: 20_000 }); const result = await client.audio.transcriptions.create({ file: await toFile(new Uint8Array(await file.arrayBuffer()), file.name, { type: file.type }), model: process.env.OPENAI_TRANSCRIBE_MODEL ?? "gpt-transcribe" }); return result.text; }
// Temporary adapter: OpenAI schedules gpt-4o-mini-tts shutdown for 2027-01-06.
// Replace this module with gpt-realtime-2.1-mini via the Realtime API before then.
export async function synthesizeSpeech(text: string, voice: VoiceId, apiKey: string): Promise<Uint8Array> { const client = new OpenAI({ apiKey, timeout: 20_000 }); const audio = await client.audio.speech.create({ model: process.env.OPENAI_SPEECH_MODEL ?? "gpt-4o-mini-tts", voice, input: text, response_format: "mp3" }); return new Uint8Array(await audio.arrayBuffer()); }
