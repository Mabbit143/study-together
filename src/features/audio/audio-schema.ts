import { z } from "zod";
import { voices, type VoiceId } from "@/features/preferences/peer-options";
export const supportedAudioTypes = ["audio/webm", "audio/mpeg", "audio/mp4", "audio/wav", "audio/x-m4a", "audio/ogg"] as const;
export const speechRequestSchema = z.object({ text: z.string().trim().min(1).max(1500), voice: z.enum(voices) }).strict();
export const peerVoices: Record<"jules" | "rae" | "milo", VoiceId> = { jules: "alloy", rae: "coral", milo: "sage" };
export const MAX_AUDIO_BYTES = 25 * 1024 * 1024;
