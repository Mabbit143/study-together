import type { PeerId } from "@/features/study/types";
import type { Personality, StudyApproach, VoiceId } from "./peer-options";
export type PeerPreferences = { name: string; voice: VoiceId; personality: Personality; approach: StudyApproach };
export const defaultPeerPreferences: PeerPreferences = { name: "Jules", voice: "alloy", personality: "encouraging", approach: "question-led" };
export const defaultPeers: Record<PeerId, PeerPreferences> = { jules: defaultPeerPreferences, rae: { name: "Rae", voice: "coral", personality: "straightforward", approach: "example-led" }, milo: { name: "Milo", voice: "sage", personality: "playful", approach: "explain-then-practice" } };
export function replacePeer(peer: PeerPreferences, id: PeerId = "jules"): PeerPreferences { return { ...defaultPeers[id], name: peer.name === `${defaultPeers[id].name} (new)` ? defaultPeers[id].name : `${defaultPeers[id].name} (new)` }; }
