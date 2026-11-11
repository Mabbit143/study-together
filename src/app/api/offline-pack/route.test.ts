import { describe, expect, it, vi } from "vitest";
import { createHandler } from "@/features/ai/handler";
import { defaultPeers } from "@/features/preferences/peer-preferences";
import { demoPack } from "@/features/ai/demo-engine";
const data = { sessionId: "shared", material: { title: "Test", excerpt: "Plants need light.", citation: "page 1" }, peers: defaultPeers, recentTurns: [], selectedMemories: [], question: "What helps?", speaker: "jules" as const, demo: false };
const req = (body: unknown) => new Request("http://localhost/api/offline-pack", { method: "POST", body: JSON.stringify(body) });
describe("offline pack route", () => {
 it("never returns a partial pack", async () => { const pack = demoPack(data); const generate = vi.fn().mockResolvedValue({ ...pack, branches: [] }); const response = await createHandler("pack", { apiKey: "fake", limit: vi.fn().mockResolvedValue("allowed"), generate })(req(data)); expect(response.status).toBe(502); });
 it("rejects an unsupported pack despite a verbatim quote", async () => { const pack = demoPack(data); pack.branches[0].sourceQuote = "a"; pack.branches[0].practice[0].answerCheck = "Aliens did it"; const response = await createHandler("pack", { apiKey: "fake", limit: vi.fn().mockResolvedValue("allowed"), generate: vi.fn().mockResolvedValue(pack), verify: vi.fn().mockResolvedValue(false) })(req(data)); expect(await response.json()).toMatchObject({ code: "ungrounded_output" }); });
 it("returns demo without live store or provider", async () => { const limit = vi.fn(); const generate = vi.fn(); const response = await createHandler("pack", { apiKey: "", limit, generate })(req({ ...data, demo: true })); expect(response.status).toBe(200); expect(limit).not.toHaveBeenCalled(); expect(generate).not.toHaveBeenCalled(); });
});
