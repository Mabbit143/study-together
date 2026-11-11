import { z } from "zod";
import { defaultPeers } from "@/features/preferences/peer-preferences";
import { voices, personalities, approaches } from "@/features/preferences/peer-options";
import type { StudyMemory } from "@/features/memory/study-memory";
const key = "study-together.profile.v1";
const text = z.string().min(1);
const peerSchema = z.object({ name: text, voice: z.enum(voices), personality: z.enum(personalities), approach: z.enum(approaches) }).strip();
export const packSchema = z.object({ version: z.literal(1), id: text, title: text, excerpt: text, branches: z.array(z.object({ id: text, peerId: z.enum(["jules", "rae", "milo"]), question: text, sourceQuote: text, hints: z.array(text).min(1), explanations: z.array(text).min(1), examples: z.array(text).min(1), practice: z.array(z.object({ id: text, prompt: text, answerCheck: text }).strip()).min(1), followUpBranchIds: z.array(text) }).strip()).min(1), board: z.object({ notes: z.array(z.string()), highlights: z.array(z.string()).default([]), selectedTool: z.enum(["pointer", "pen", "sticky"]) }).strip(), progress: z.object({ branchId: text, completedPracticeIds: z.array(text) }).strip() }).strip().superRefine((pack, ctx) => {
 const branchIds = new Set(pack.branches.map(branch => branch.id));
 if (branchIds.size !== pack.branches.length || !branchIds.has(pack.progress.branchId) || pack.branches.some(branch => !pack.excerpt.includes(branch.sourceQuote) || branch.followUpBranchIds.some(id => !branchIds.has(id)))) ctx.addIssue({ code: "custom", message: "Pack branches must be grounded and connected." });
 const practiceIds = pack.branches.flatMap(branch => branch.practice.map(item => item.id));
 if (new Set(practiceIds).size !== practiceIds.length || pack.progress.completedPracticeIds.some(id => !practiceIds.includes(id))) ctx.addIssue({ code: "custom", message: "Pack progress must refer to practice items." });
});
const questionSchema = z.object({ id: text, text }).strip();
const memoryItem = z.object({ id: text, text }).strip();
const profileSchema = z.object({ version: z.literal(1), peers: z.object({ jules: peerSchema, rae: peerSchema, milo: peerSchema }).strip(), memory: z.object({ helpful: z.array(memoryItem), difficult: z.array(memoryItem) }).strip(), packs: z.array(packSchema), activePackId: z.string().nullable().default(null), queuedQuestions: z.array(questionSchema) }).strip().superRefine((profile, ctx) => { if (profile.activePackId && !profile.packs.some((pack) => pack.id === profile.activePackId)) ctx.addIssue({ code: "custom", message: "Active pack must exist." }); });
const legacySchema = z.object({ version: z.literal(1), peer: peerSchema, memory: z.object({ helpful: z.array(z.string()), difficult: z.array(z.string()) }), packs: z.array(z.unknown()).length(0), queuedQuestions: z.array(questionSchema) });
export type OfflineStudyPackV1 = z.infer<typeof packSchema>;
export type QueuedQuestion = z.infer<typeof questionSchema>;
export type StudyProfileV1 = z.infer<typeof profileSchema>;
const emptyProfile = (): StudyProfileV1 => ({ version: 1, peers: structuredClone(defaultPeers), memory: { helpful: [], difficult: [] }, packs: [], activePackId: null, queuedQuestions: [] });
export function loadProfile(): { profile: StudyProfileV1; resetNotice: string | null } {
 try {
  const raw = localStorage.getItem(key); if (!raw) return { profile: emptyProfile(), resetNotice: null };
  const data: unknown = JSON.parse(raw); const parsed = profileSchema.safeParse(data); if (parsed.success) return { profile: parsed.data, resetNotice: null };
  const old = legacySchema.safeParse(data); if (old.success) { const p = emptyProfile(); p.peers.jules = old.data.peer; p.memory = { helpful: old.data.memory.helpful.map((value, i) => ({ id: `legacy-helpful-${i}`, text: value })), difficult: old.data.memory.difficult.map((value, i) => ({ id: `legacy-difficult-${i}`, text: value })) }; p.queuedQuestions = old.data.queuedQuestions; const migrated = profileSchema.parse(p); localStorage.setItem(key, JSON.stringify(migrated)); return { profile: migrated, resetNotice: null }; }
 } catch { /* Treat inaccessible or corrupt storage as unavailable. */ }
 return { profile: emptyProfile(), resetNotice: "Saved study data could not be read. Clear local data to reset it." };
}
export function saveProfile(profile: StudyProfileV1): void {
 const previous = loadProfile(); if (previous.resetNotice) throw new Error("Clear unreadable study data before saving.");
 const valid = profile.packs.flatMap(pack => { const result = packSchema.safeParse(pack); return result.success ? [result.data] : []; });
 const safe = profileSchema.parse({ ...profile, packs: valid.length === profile.packs.length ? valid : previous.profile.packs }); localStorage.setItem(key, JSON.stringify(safe));
}
export function deleteMemory(kind: keyof StudyMemory, id: string): void { const p = loadProfile().profile; p.memory[kind] = p.memory[kind].filter(item => item.id !== id); saveProfile(p); }
export function editMemory(kind: keyof StudyMemory, id: string, value: string): void { const p = loadProfile().profile; p.memory[kind] = p.memory[kind].map(item => item.id === id ? { ...item, text: value } : item); saveProfile(p); }
export function deletePack(id: string): void { const p = loadProfile().profile; p.packs = p.packs.filter(pack => pack.id !== id); if (p.activePackId === id) p.activePackId = p.packs[0]?.id ?? null; saveProfile(p); }
export function queueQuestion(question: QueuedQuestion): void { const p = loadProfile().profile; p.queuedQuestions.push(questionSchema.parse(question)); saveProfile(p); }
export function deleteQueuedQuestion(id: string): void { const p = loadProfile().profile; p.queuedQuestions = p.queuedQuestions.filter(q => q.id !== id); saveProfile(p); }
export function clearProfile(): void { localStorage.removeItem(key); }
