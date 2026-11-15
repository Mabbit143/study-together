import type { PeerId } from "@/features/study/types";
import type { Personality, StudyApproach, VoiceId } from "./peer-options";
export type PeerPreferences = { name: string; voice: VoiceId; personality: Personality; approach: StudyApproach };
export const defaultPeerPreferences: PeerPreferences = { name: "Jules", voice: "alloy", personality: "encouraging", approach: "question-led" };
export const defaultPeers: Record<PeerId, PeerPreferences> = { jules: defaultPeerPreferences, rae: { name: "Rae", voice: "coral", personality: "straightforward", approach: "example-led" }, milo: { name: "Milo", voice: "sage", personality: "playful", approach: "explain-then-practice" } };
export const studyGroupPersonas = [
 { id: "casual", label: "Casual classmates", description: "Friendly, relaxed discussion with questions along the way." },
 { id: "creative", label: "Creative personalities", description: "Playful connections, examples, and new ways to see the material." },
 { id: "scientific", label: "Seriously scientific", description: "Direct, precise explanations followed by focused practice." },
] as const;
export type StudyGroupPersona = typeof studyGroupPersonas[number]["id"];
export function peersForPersona(persona: StudyGroupPersona): Record<PeerId, PeerPreferences> {
 if (persona === "casual") return { jules: { ...defaultPeers.jules, personality: "encouraging", approach: "question-led" }, rae: { ...defaultPeers.rae, personality: "playful", approach: "question-led" }, milo: { ...defaultPeers.milo, personality: "encouraging", approach: "example-led" } };
 if (persona === "creative") return { jules: { ...defaultPeers.jules, personality: "playful", approach: "example-led" }, rae: { ...defaultPeers.rae, personality: "encouraging", approach: "example-led" }, milo: { ...defaultPeers.milo, personality: "playful", approach: "question-led" } };
 return { jules: { ...defaultPeers.jules, personality: "straightforward", approach: "explain-then-practice" }, rae: { ...defaultPeers.rae, personality: "straightforward", approach: "example-led" }, milo: { ...defaultPeers.milo, personality: "straightforward", approach: "explain-then-practice" } };
}
export function replacePeer(peer: PeerPreferences, id: PeerId = "jules"): PeerPreferences { return { ...defaultPeers[id], name: peer.name === `${defaultPeers[id].name} (new)` ? defaultPeers[id].name : `${defaultPeers[id].name} (new)` }; }
