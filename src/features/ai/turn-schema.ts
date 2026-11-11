import { z } from "zod";
import { approaches, personalities, voices } from "@/features/preferences/peer-options";
import { MAX_CONFIRMED_EXCERPT_CHARACTERS } from "@/features/materials/material-schema";
import { packSchema } from "@/features/storage/local-store";
const text = z.string().trim().min(1);
const peerId = z.enum(["jules", "rae", "milo"]);
const peer = z.object({ name: text.max(100), voice: z.enum(voices), personality: z.enum(personalities), approach: z.enum(approaches) }).strip();
export const requestSchema = z.object({
 sessionId: text.max(128), material: z.object({ title: text.max(200), excerpt: text.max(MAX_CONFIRMED_EXCERPT_CHARACTERS), citation: text.max(500) }).strip(),
 peers: z.object({ jules: peer, rae: peer, milo: peer }).strip(), recentTurns: z.array(z.object({ id: text.max(128), peerId, caption: text.max(2000), provenance: z.discriminatedUnion("status", [z.object({ status: z.literal("cited"), sourceCitation: text.max(500) }), z.object({ status: z.literal("general-knowledge") })]) }).strip()).max(12),
 selectedMemories: z.array(z.object({ id: text.max(128), text: text.max(500) }).strip()).max(20), question: text.max(4000), speaker: peerId, demo: z.boolean().default(false)
}).strip();
export type StudyTurnRequest = z.infer<typeof requestSchema>;
export type OfflinePackRequest = StudyTurnRequest;
export const turnSchema = z.object({ speaker: peerId, response: text.max(4000), supportStatus: z.enum(["supported", "general-knowledge", "uncertain"]), citedExcerpt: z.string().max(MAX_CONFIRMED_EXCERPT_CHARACTERS).nullable(), boardAction: z.object({ type: z.enum(["none", "add-note"]), text: z.string().max(1000) }).nullable(), memorySuggestion: z.string().max(500).nullable(), followUp: z.string().max(1000).nullable() }).strict();
export type StudyTurnResponse = z.infer<typeof turnSchema>;
export function validateTurn(value: unknown, excerpt: string): StudyTurnResponse {
 const turn = turnSchema.parse(value);
 if ((turn.supportStatus === "supported" && (!turn.citedExcerpt || !excerpt.includes(turn.citedExcerpt))) || (turn.citedExcerpt && !excerpt.includes(turn.citedExcerpt)) || (turn.followUp && turn.followUp.trim().toLowerCase() === turn.response.trim().toLowerCase())) throw new Error("Invalid grounded response");
 return turn;
}
export function validatePack(value: unknown, excerpt: string) {
 const pack = packSchema.parse(value);
 if (pack.excerpt !== excerpt || JSON.stringify(pack).length > 200_000 || pack.branches.length > 12 || pack.branches.some(b => b.hints.length > 8 || b.explanations.length > 8 || b.examples.length > 8 || b.practice.length > 8 || b.followUpBranchIds.length > 12) || /(?:https?:\/\/|www\.)/i.test(JSON.stringify(pack))) throw new Error("Invalid offline pack");
 return pack;
}
