import type { Personality, StudyApproach, VoiceId } from "./peer-options";
export type PeerPreferences = { name: string; voice: VoiceId; personality: Personality; approach: StudyApproach };
export const defaultPeerPreferences: PeerPreferences = { name: "Jules", voice: "alloy", personality: "encouraging", approach: "question-led" };
export function replacePeer(peer: PeerPreferences): PeerPreferences {
  return { ...defaultPeerPreferences, name: peer.name === "Jules" ? "Rae" : "Jules" };
}
