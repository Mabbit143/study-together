import { describe, it, expect } from "vitest";
import { buildStudyPrompt } from "./build-study-prompt";
import { demoTurn, demoPack } from "./demo-engine";
import { validateTurn, validatePack } from "./turn-schema";
import { defaultPeers } from "@/features/preferences/peer-preferences";
const request = { sessionId: "session", material: { title: "Test", excerpt: "Plants need light.", citation: "page 1" }, peers: defaultPeers, recentTurns: [], selectedMemories: [{ id: "1", text: "I like examples" }], question: "What do plants need?", speaker: "jules" as const, demo: true };
describe("grounded generation", () => {
 it("treats source as untrusted and includes only selected context", () => {
  const prompt = buildStudyPrompt(request, "turn");
  expect(prompt.instructions).toMatch(/untrusted/i);
  expect(prompt.input).toContain("Plants need light.");
  expect(prompt.input).toContain("I like examples");
  expect(prompt.input).not.toContain("unselected secret");
 });
 it("returns validated deterministic grounded demo responses", () => {
  const turn = demoTurn(request); expect(validateTurn(turn, request.material.excerpt)).toEqual(turn);
  const pack = demoPack(request); expect(validatePack(pack, request.material.excerpt)).toEqual(pack);
  expect(pack.version).toBe(1); expect(pack.branches.length).toBeGreaterThan(0);
 });
 it("rejects invented citations and duplicate follow-ups", () => {
  const turn = demoTurn(request);
  expect(() => validateTurn({ ...turn, citedExcerpt: "invented" }, request.material.excerpt)).toThrow();
  expect(() => validateTurn({ ...turn, followUp: turn.response }, request.material.excerpt)).toThrow();
 });
 it("rejects incomplete, ungrounded and network-dependent packs", () => {
  const pack = demoPack(request);
  expect(() => validatePack({ ...pack, branches: [] }, request.material.excerpt)).toThrow();
  expect(() => validatePack({ ...pack, excerpt: "other" }, request.material.excerpt)).toThrow();
  expect(() => validatePack({ ...pack, title: "https://example.com" }, request.material.excerpt)).toThrow();
 });
});

describe("demo teaching approach", () => {
 it("explains before asking for practice", () => {
  const turn = demoTurn({ ...request, speaker: "milo" });
  expect(turn.response).toMatch(/the passage says[\s\S]*practice/i);
 });
});
