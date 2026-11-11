import { describe, expect, it, vi } from "vitest";
import { demoPack } from "@/features/ai/demo-engine";
import { OLD_ENGLISH_DEMO } from "@/features/study/demo-session";
import { defaultPeers } from "@/features/preferences/peer-preferences";
import { currentBranch, deterministicPractice, followBranch, searchExcerpt } from "./pack-runner";
import { registerStudyServiceWorker } from "./service-worker";
import { parsePackFile, serializePack } from "./pack-file";

const request = { sessionId: "demo", material: OLD_ENGLISH_DEMO.material, peers: defaultPeers, recentTurns: [], selectedMemories: [], question: "Practice", speaker: "jules" as const, demo: true };
describe("prepared offline study", () => {
  it("searches locally and traverses only connected precomputed branches", () => {
    const pack = demoPack(request);
    expect(searchExcerpt(pack.excerpt, "cwēn")).toEqual([pack.excerpt]);
    expect(currentBranch(pack).sourceQuote).toBe(pack.excerpt);
    expect(deterministicPractice(pack)?.prompt).toMatch(/quoted passage/i);
    expect(followBranch(pack, "not-connected")).toBe(pack);
    expect(parsePackFile(serializePack(pack))).toEqual(pack);
    expect(() => parsePackFile('{"version":1}')).toThrow();
  });
  it("registers the app-shell worker only when supported", async () => {
    const register = vi.fn().mockResolvedValue({ scope: "/" });
    Object.defineProperty(navigator, "serviceWorker", { configurable: true, value: { register } });
    await registerStudyServiceWorker();
    expect(register).toHaveBeenCalledWith("/sw.js");
  });
});
