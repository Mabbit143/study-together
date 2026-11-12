import { describe, expect, it, vi } from "vitest";
import { demoPack } from "@/features/ai/demo-engine";
import { OLD_ENGLISH_DEMO } from "@/features/study/demo-session";
import { defaultPeers } from "@/features/preferences/peer-preferences";
import { currentBranch, deterministicPractice, followBranch, searchExcerpt } from "./pack-runner";
import { registerStudyServiceWorker } from "./service-worker";
import { parsePackFile, serializePack } from "./pack-file";
import { readFileSync } from "node:fs";

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
  it("keeps the worker cache same-origin, shell-only and upgradeable", () => {
    const worker = readFileSync("public/sw.js", "utf8");
    expect(worker).toContain('url.origin !== self.location.origin');
    expect(worker).toContain('url.pathname.startsWith("/api/")');
    expect(worker).toContain("caches.delete");
    expect(worker).toContain('request.mode === "navigate"');
  });
  it("rejects oversized and ungrounded imported packs", () => {
    const pack = demoPack(request);
    expect(() => parsePackFile(" ".repeat(200_001))).toThrow(/too large/i);
    expect(() => parsePackFile(JSON.stringify({ ...pack, board: { ...pack.board, highlights: ["invented"] } }))).toThrow(/quote the confirmed excerpt/i);
  });
});
