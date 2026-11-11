import { beforeEach, describe, expect, it, vi } from "vitest";
import { createHandler } from "@/features/ai/handler";
import { resetRateLimits } from "@/features/ai/rate-limit";
import { defaultPeers } from "@/features/preferences/peer-preferences";
import { demoPack } from "@/features/ai/demo-engine";
const data = { sessionId: "shared", material: { title: "Test", excerpt: "Plants need light.", citation: "page 1" }, peers: defaultPeers, recentTurns: [], selectedMemories: [], question: "What helps?", speaker: "jules" as const, demo: false };
const req = (body: unknown) => new Request("http://localhost/api/offline-pack", { method: "POST", body: JSON.stringify(body) });
beforeEach(resetRateLimits);
describe("offline pack route", () => {
 it("never returns a partial pack", async () => { const pack = demoPack(data); const generate = vi.fn().mockResolvedValue({ ...pack, branches: [] }); const response = await createHandler("pack", { apiKey: "fake", generate })(req(data)); expect(response.status).toBe(502); expect(await response.json()).toMatchObject({ code: "invalid_output", demoAvailable: true }); });
 it("returns a complete demo without a key", async () => { const response = await createHandler("pack", { apiKey: "" })(req({ ...data, demo: true })); expect(response.status).toBe(200); expect(await response.json()).toMatchObject({ version: 1, excerpt: data.material.excerpt }); });
 it("shares the limit with turns", async () => { const turn = createHandler("turn", { apiKey: "" }); for (let i = 0; i < 30; i++) await turn(req({ ...data, demo: true })); expect((await createHandler("pack", { apiKey: "" })(req({ ...data, demo: true }))).status).toBe(429); });
});
