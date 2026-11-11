import { beforeEach, describe, expect, it } from "vitest";
import { clearProfile, deleteMemory, deletePack, deleteQueuedQuestion, editMemory, loadProfile, queueQuestion, saveProfile, type OfflineStudyPackV1 } from "./local-store";
import { replacePeer } from "@/features/preferences/peer-preferences";
const pack: OfflineStudyPackV1 = { version: 1, id: "one", title: "Topic", excerpt: "Text", branches: [{ id: "b", peerId: "jules", question: "Why?", sourceQuote: "Text", hints: ["Hint"], explanations: ["Explanation"], examples: ["Example"], practice: [{ id: "p", prompt: "Try", answerCheck: "Check" }], followUpBranchIds: [] }], board: { notes: ["note"], selectedTool: "pen" }, progress: { branchId: "b", completedPracticeIds: ["p"] } };
describe("local study profile", () => {
 beforeEach(() => localStorage.clear());
 it("round trips complete packs and queues, and retains the last complete pack on incomplete writes", () => {
  const p = loadProfile().profile; p.packs = [pack]; saveProfile(p); queueQuestion({ id: "q", text: "Why?" });
  expect(loadProfile().profile.packs).toEqual([pack]);
  saveProfile({ ...loadProfile().profile, packs: [{ ...pack, branches: [] }] }); expect(loadProfile().profile.packs).toEqual([pack]);
  deletePack("one"); deleteQueuedQuestion("q"); expect(loadProfile().profile).toMatchObject({ packs: [], queuedQuestions: [] }); clearProfile();
 });
 it("keeps each peer independent and replacement preserves memory", () => {
  const p = loadProfile().profile; p.memory.helpful = [{ id: "a", text: "examples" }]; p.peers.rae.voice = "coral";
  const before = structuredClone(p.peers); p.peers.jules = replacePeer(p.peers.jules); saveProfile(p);
  const result = loadProfile().profile; expect(result.peers.jules.name).not.toBe(before.jules.name); expect(result.peers.rae).toEqual(before.rae); expect(result.peers.milo).toEqual(before.milo); expect(result.memory).toEqual(p.memory);
 });
 it("edits and deletes duplicate text independently by ID", () => {
  const p = loadProfile().profile; p.memory.helpful = [{ id: "a", text: "same" }, { id: "b", text: "same" }]; saveProfile(p);
  editMemory("helpful", "a", "changed"); deleteMemory("helpful", "b"); expect(loadProfile().profile.memory.helpful).toEqual([{ id: "a", text: "changed" }]);
 });
 it("migrates old peer and memory data without guessing pack content", () => {
  localStorage.setItem("study-together.profile.v1", JSON.stringify({ version: 1, peer: { name: "Custom", voice: "sage", personality: "playful", approach: "example-led" }, memory: { helpful: ["same", "same"], difficult: [] }, packs: [], queuedQuestions: [] }));
  const result = loadProfile(); expect(result.resetNotice).toBeNull(); expect(result.profile.peers.jules.name).toBe("Custom"); expect(new Set(result.profile.memory.helpful.map(item => item.id)).size).toBe(2);
 });
 it("keeps legacy incomplete pack data untouched when it cannot be migrated", () => {
  const raw = JSON.stringify({ version: 1, peer: { name: "Jules", voice: "alloy", personality: "encouraging", approach: "question-led" }, memory: { helpful: [], difficult: [] }, packs: [{ version: 1, id: "old", title: "Old", excerpt: "Text", discussion: ["Why?"] }], queuedQuestions: [] });
  localStorage.setItem("study-together.profile.v1", raw); expect(loadProfile().resetNotice).toBeTruthy(); expect(localStorage.getItem("study-together.profile.v1")).toBe(raw);
 });
 it("reports corrupt and unknown versions", () => { localStorage.setItem("study-together.profile.v1", "broken"); expect(loadProfile().resetNotice).toBeTruthy(); localStorage.setItem("study-together.profile.v1", JSON.stringify({ version: 2 })); expect(loadProfile().resetNotice).toBeTruthy(); });
 it("strips original files and audio", () => { const p = loadProfile().profile; p.packs = [{ ...pack, originalFile: "secret", rawAudio: "secret" } as OfflineStudyPackV1]; saveProfile(p); expect(localStorage.getItem("study-together.profile.v1")).not.toContain("secret"); });
});
