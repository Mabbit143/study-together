import { z } from "zod";
import { defaultPeerPreferences } from "@/features/preferences/peer-preferences";
import { voices, personalities, approaches } from "@/features/preferences/peer-options";
import type { StudyMemory } from "@/features/memory/study-memory";

const key = "study-together.profile.v1";
const packSchema = z.object({ version: z.literal(1), id: z.string().min(1), title: z.string().min(1), excerpt: z.string().min(1), discussion: z.array(z.string().min(1)).min(1) }).strip();
const questionSchema = z.object({ id: z.string().min(1), text: z.string().min(1) }).strip();
const profileSchema = z.object({ version: z.literal(1), peer: z.object({ name: z.string().min(1), voice: z.enum(voices), personality: z.enum(personalities), approach: z.enum(approaches) }).strip(), memory: z.object({ helpful: z.array(z.string()), difficult: z.array(z.string()) }).strip(), packs: z.array(packSchema), queuedQuestions: z.array(questionSchema) }).strip();
export type OfflineStudyPackV1 = z.infer<typeof packSchema>;
export type QueuedQuestion = z.infer<typeof questionSchema>;
export type StudyProfileV1 = z.infer<typeof profileSchema>;
const emptyProfile = (): StudyProfileV1 => ({ version: 1, peer: { ...defaultPeerPreferences }, memory: { helpful: [], difficult: [] }, packs: [], queuedQuestions: [] });
export function loadProfile(): { profile: StudyProfileV1; resetNotice: string | null } {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { profile: emptyProfile(), resetNotice: null };
    const parsed = profileSchema.safeParse(JSON.parse(raw));
    if (parsed.success) return { profile: parsed.data, resetNotice: null };
  } catch { /* Treat inaccessible or corrupt storage as unavailable. */ }
  return { profile: emptyProfile(), resetNotice: "Saved study data could not be read. Clear local data to reset it." };
}
export function saveProfile(profile: StudyProfileV1): void {
  const previous = loadProfile();
  if (previous.resetNotice) throw new Error("Clear unreadable study data before saving.");
  const validPacks = profile.packs.flatMap(pack => { const result = packSchema.safeParse(pack); return result.success ? [result.data] : []; });
  const packs = validPacks.length === profile.packs.length ? validPacks : previous.profile.packs;
  const safe = profileSchema.parse({ ...profile, packs });
  localStorage.setItem(key, JSON.stringify(safe));
}
export function deleteMemory(kind: keyof StudyMemory, item: string): void { const p = loadProfile().profile; p.memory[kind] = p.memory[kind].filter(value => value !== item); saveProfile(p); }
export function deletePack(id: string): void { const p = loadProfile().profile; p.packs = p.packs.filter(pack => pack.id !== id); saveProfile(p); }
export function queueQuestion(question: QueuedQuestion): void { const p = loadProfile().profile; p.queuedQuestions.push(questionSchema.parse(question)); saveProfile(p); }
export function deleteQueuedQuestion(id: string): void { const p = loadProfile().profile; p.queuedQuestions = p.queuedQuestions.filter(q => q.id !== id); saveProfile(p); }
export function clearProfile(): void { localStorage.removeItem(key); }
