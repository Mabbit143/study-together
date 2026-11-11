import { beforeEach, describe, expect, it } from "vitest";
import { clearProfile, deleteMemory, deletePack, deleteQueuedQuestion, loadProfile, queueQuestion, saveProfile } from "./local-store";

describe("local study profile", () => {
  beforeEach(() => localStorage.clear());
  it("round trips memory, complete packs and explicitly queued questions", () => {
    const profile = loadProfile().profile;
    profile.memory = { helpful: ["examples"], difficult: ["dates"] };
    profile.packs = [{ version: 1, id: "one", title: "Topic", excerpt: "Text", discussion: ["Question"] }];
    saveProfile(profile);
    queueQuestion({ id: "q", text: "Why?" });
    expect(loadProfile().profile).toMatchObject({ memory: profile.memory, packs: profile.packs, queuedQuestions: [{ id: "q", text: "Why?" }] });
    deleteMemory("helpful", "examples"); deletePack("one"); deleteQueuedQuestion("q");
    expect(loadProfile().profile).toMatchObject({ memory: { helpful: [], difficult: ["dates"] }, packs: [], queuedQuestions: [] });
    clearProfile(); expect(loadProfile().profile.memory.difficult).toEqual([]);
  });
  it("retains a complete pack when an incomplete replacement is saved", () => {
    const p = loadProfile().profile;
    p.packs = [{ version: 1, id: "one", title: "Topic", excerpt: "Text", discussion: ["Question"] }]; saveProfile(p);
    saveProfile({ ...p, packs: [{ ...p.packs[0], discussion: [] }] });
    expect(loadProfile().profile.packs).toEqual(p.packs);
  });
  it("reports corrupt and unknown versions", () => {
    localStorage.setItem("study-together.profile.v1", "broken"); expect(loadProfile().resetNotice).toBeTruthy();
    localStorage.setItem("study-together.profile.v1", JSON.stringify({ version: 2 })); expect(loadProfile().resetNotice).toBeTruthy();
  });
});

it("does not persist extra original file or audio properties and replacement preserves memory", async () => {
  localStorage.clear();
  const { replacePeer } = await import("@/features/preferences/peer-preferences");
  const p = loadProfile().profile;
  p.memory.helpful = ["examples"];
  p.peer = replacePeer(p.peer);
  p.packs = [{ version: 1, id: "a", title: "A", excerpt: "Text", discussion: ["Why?"], originalFile: "secret", rawAudio: "secret" } as typeof p.packs[number]];
  saveProfile(p);
  expect(loadProfile().profile.memory.helpful).toEqual(["examples"]);
  expect(localStorage.getItem("study-together.profile.v1")).not.toContain("secret");
});
