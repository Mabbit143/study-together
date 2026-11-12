import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OLD_ENGLISH_DEMO } from "./demo-session";
import { useStudySession } from "./use-study-session";
import { demoPack } from "@/features/ai/demo-engine";
import { defaultPeers } from "@/features/preferences/peer-preferences";

describe("useStudySession", () => {
  beforeEach(() => { localStorage.clear(); vi.restoreAllMocks(); });

  it("preserves a failed question and uses deterministic demo recovery", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 503, json: async () => ({ error: "Provider unavailable" }) }));
    const { result } = renderHook(() => useStudySession(OLD_ENGLISH_DEMO));
    act(() => result.current.setInput("Why is cwēn the subject?"));
    await act(() => result.current.submitTurn());
    expect(result.current.input).toBe("Why is cwēn the subject?");
    expect(result.current.status).toBe("provider-error");
    await act(() => result.current.useDemo());
    expect(result.current.input).toBe("");
    expect(result.current.status).toBe("demo");
    expect(result.current.turns.at(-1)?.peerId).toBe("jules");
  });

  it("uses the explicitly chosen peer and that peer's saved study preferences", async () => {
    let body: Record<string, unknown> | undefined;
    vi.stubGlobal("fetch", vi.fn(async (_url, init?: RequestInit) => { body = JSON.parse(String(init?.body)); return { ok: true, json: async () => ({ speaker: "milo", response: "Milo answer", supportStatus: "supported", citedExcerpt: "cwēn", boardAction: null, memorySuggestion: null, followUp: null }) }; }));
    const { result } = renderHook(() => useStudySession(OLD_ENGLISH_DEMO));
    act(() => {
      result.current.setProfile({ ...result.current.profile!, peers: { ...result.current.profile!.peers, milo: { ...result.current.profile!.peers.milo, voice: "alloy", personality: "straightforward", approach: "example-led" } } });
      result.current.setActivePeerId("milo"); result.current.setInput("Connect this idea.");
    });
    await act(() => result.current.submitTurn());
    expect(body).toMatchObject({ speaker: "milo", peers: { milo: { voice: "alloy", personality: "straightforward", approach: "example-led" } } });
    expect(result.current.turns.at(-1)?.peerId).toBe("milo");
  });

  it("uses the explicitly chosen peer when preparing an offline pack", async () => {
    let body: Record<string, unknown> | undefined;
    const pack = demoPack({ sessionId: "demo", material: OLD_ENGLISH_DEMO.material, peers: defaultPeers, recentTurns: [], selectedMemories: [], question: "Prepare", speaker: "rae", demo: true });
    vi.stubGlobal("fetch", vi.fn(async (_url, init?: RequestInit) => { body = JSON.parse(String(init?.body)); return { ok: true, json: async () => pack }; }));
    const { result } = renderHook(() => useStudySession(OLD_ENGLISH_DEMO));
    act(() => result.current.setActivePeerId("rae"));
    await act(() => result.current.preparePack());
    expect(body).toMatchObject({ speaker: "rae", peers: { rae: defaultPeers.rae } });
    expect(result.current.activePack?.branches[0].peerId).toBe("rae");
  });

  it("queues offline questions and never sends until explicit approval", async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ speaker: "jules", response: "A grounded answer", supportStatus: "supported", citedExcerpt: "cwēn", boardAction: null, memorySuggestion: null, followUp: null }) });
    vi.stubGlobal("fetch", fetcher);
    const { result } = renderHook(() => useStudySession(OLD_ENGLISH_DEMO));
    act(() => { result.current.setOnline(false); result.current.setInput("An uncovered question"); });
    await act(() => result.current.submitTurn());
    expect(result.current.outbox).toHaveLength(1);
    act(() => result.current.setOnline(true));
    expect(fetcher).not.toHaveBeenCalled();
    await act(() => result.current.sendQueued(result.current.outbox[0].id));
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(result.current.outbox).toHaveLength(0);
  });

  it("lets the learner delete a queued question without sending it", async () => {
    const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
    const { result } = renderHook(() => useStudySession(OLD_ENGLISH_DEMO, false));
    act(() => result.current.setInput("Do not send this"));
    await act(() => result.current.submitTurn());
    const id = result.current.outbox[0].id;
    act(() => result.current.deleteQueued(id));
    expect(result.current.outbox).toEqual([]);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("prepares and persists a complete pack before offline use", async () => {
    const pack = demoPack({ sessionId: "demo", material: OLD_ENGLISH_DEMO.material, peers: defaultPeers, recentTurns: [], selectedMemories: [], question: "Prepare", speaker: "jules", demo: true });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => pack }));
    const { result } = renderHook(() => useStudySession(OLD_ENGLISH_DEMO));
    await act(() => result.current.preparePack());
    expect(result.current.activePack?.id).toBe("demo-pack");
    act(() => result.current.setOnline(false));
    expect(result.current.status).toBe("offline-pack");
    expect(loadSavedPack()).toBe("demo-pack");
  });

  it("interrupts an in-progress response without losing new input", async () => {
    vi.stubGlobal("fetch", vi.fn((_url, init?: RequestInit) => new Promise((_resolve, reject) => init?.signal?.addEventListener("abort", () => reject(Object.assign(new Error("aborted"), { name: "AbortError" }))))));
    const { result } = renderHook(() => useStudySession(OLD_ENGLISH_DEMO));
    act(() => result.current.setInput("First question"));
    let pending!: Promise<void>; act(() => { pending = result.current.submitTurn(); });
    act(() => { result.current.setInput("My new question"); result.current.cancelTurn(); });
    await act(() => pending);
    expect(result.current.input).toBe("My new question");
    expect(result.current.status).toBe("success");
  });

  it("persists non-demo subject branch, notes, highlights and practice across reload", () => {
    const base = demoPack({ sessionId: "science", material: { title: "Cell biology", excerpt: "Mitochondria release energy from food. Ribosomes build proteins.", citation: "Biology notes" }, peers: defaultPeers, recentTurns: [], selectedMemories: [], question: "What do mitochondria do?", speaker: "rae", demo: true });
    const pack = { ...base, id: "biology-pack", branches: [{ ...base.branches[0], id: "energy", followUpBranchIds: ["proteins"] }, { ...base.branches[0], id: "proteins", question: "What builds proteins?", sourceQuote: "Ribosomes build proteins.", practice: [{ ...base.branches[0].practice[0], id: "practice-proteins" }], followUpBranchIds: [] }], progress: { branchId: "energy", completedPracticeIds: [] } };
    const first = renderHook(() => useStudySession(OLD_ENGLISH_DEMO, false));
    act(() => first.result.current.importPack(pack));
    act(() => first.result.current.followOfflineBranch("proteins"));
    act(() => first.result.current.setBoardNotes(["Compare the organelles"]));
    act(() => first.result.current.setHighlight("Mitochondria release energy from food."));
    act(() => first.result.current.setHighlight("Ribosomes build proteins."));
    act(() => first.result.current.setSelectedTool("pen"));
    act(() => first.result.current.completePractice("practice-proteins"));
    first.unmount();
    const second = renderHook(() => useStudySession(OLD_ENGLISH_DEMO, false));
    expect(second.result.current.activeMaterial.title).toBe("Cell biology");
    expect(second.result.current.activeMaterial.excerpt).toContain("Mitochondria");
    expect(second.result.current.activePack?.progress.branchId).toBe("proteins");
    expect(second.result.current.activePack?.progress.completedPracticeIds).toContain("practice-proteins");
    expect(second.result.current.boardNotes).toContain("Compare the organelles");
    expect(second.result.current.highlight).toBe("Ribosomes build proteins.");
    expect(second.result.current.highlights).toEqual(["Mitochondria release energy from food.", "Ribosomes build proteins."]);
    expect(second.result.current.selectedTool).toBe("pen");
  });

  it("persists explicit subject selection and does not override newly imported material", () => {
    const oldEnglish = demoPack({ sessionId: "old", material: OLD_ENGLISH_DEMO.material, peers: defaultPeers, recentTurns: [], selectedMemories: [], question: "Old English", speaker: "jules", demo: true });
    const biology = { ...demoPack({ sessionId: "bio", material: { title: "Biology", excerpt: "Cells contain DNA.", citation: "Science text" }, peers: defaultPeers, recentTurns: [], selectedMemories: [], question: "Biology", speaker: "rae", demo: true }), id: "biology" };
    const first = renderHook(() => useStudySession(OLD_ENGLISH_DEMO));
    act(() => first.result.current.importPack(oldEnglish)); act(() => first.result.current.importPack(biology)); act(() => first.result.current.selectPack(oldEnglish.id)); first.unmount();
    const oldReload = renderHook(() => useStudySession(OLD_ENGLISH_DEMO)); expect(oldReload.result.current.activeMaterial.title).toBe(oldEnglish.title); act(() => oldReload.result.current.selectPack(biology.id)); oldReload.unmount();
    const bioReload = renderHook(() => useStudySession(OLD_ENGLISH_DEMO)); expect(bioReload.result.current.activeMaterial.title).toBe("Biology"); bioReload.unmount();
    const imported = { ...OLD_ENGLISH_DEMO, id: "imported-material", title: "New history", material: { title: "New history", excerpt: "The treaty was signed in 1919.", citation: "History handout" } };
    const importedRoom = renderHook(() => useStudySession(imported)); expect(importedRoom.result.current.activePack).toBeNull(); expect(importedRoom.result.current.activeMaterial.title).toBe("New history"); expect(importedRoom.result.current.turns).toEqual([]); expect(importedRoom.result.current.boardNotes).toEqual([]);
  });

  it("does not clear a newer draft when an earlier successful request finishes", async () => {
    let resolve!: (value: unknown) => void;
    vi.stubGlobal("fetch", vi.fn(() => new Promise((done) => { resolve = done; })));
    const { result } = renderHook(() => useStudySession(OLD_ENGLISH_DEMO));
    act(() => result.current.setInput("First draft")); let pending!: Promise<void>; act(() => { pending = result.current.submitTurn(); });
    act(() => result.current.setInput("Newer draft"));
    await act(async () => { resolve({ ok: true, json: async () => ({ speaker: "jules", response: "Answer", supportStatus: "supported", citedExcerpt: "cwēn", boardAction: null, memorySuggestion: null, followUp: null }) }); await pending; });
    expect(result.current.input).toBe("Newer draft");
  });

  it("prevents an aborted older request from overwriting a newer request", async () => {
    let rejectFirst!: (error: Error) => void; let resolveSecond!: (value: unknown) => void; let calls = 0;
    vi.stubGlobal("fetch", vi.fn(() => { calls += 1; return calls === 1 ? new Promise((_resolve, reject) => { rejectFirst = reject; }) : new Promise((resolve) => { resolveSecond = resolve; }); }));
    const { result } = renderHook(() => useStudySession(OLD_ENGLISH_DEMO));
    act(() => result.current.setInput("Old question")); let old!: Promise<void>; act(() => { old = result.current.submitTurn(); }); act(() => result.current.cancelTurn());
    act(() => result.current.setInput("New question")); let newer!: Promise<void>; act(() => { newer = result.current.submitTurn(); });
    expect(result.current.status).toBe("loading");
    await act(async () => { rejectFirst(Object.assign(new Error("aborted"), { name: "AbortError" })); await old; });
    expect(result.current.status).toBe("loading");
    await act(async () => { resolveSecond({ ok: true, json: async () => ({ speaker: "jules", response: "New answer", supportStatus: "supported", citedExcerpt: "cwēn", boardAction: null, memorySuggestion: null, followUp: null }) }); await newer; });
    expect(result.current.turns.at(-1)?.caption).toBe("New answer");
    expect(result.current.status).toBe("success");
  });

  it("merges a delayed grounded response with newer board edits", async () => {
    let resolve!: (value: unknown) => void;
    vi.stubGlobal("fetch", vi.fn(() => new Promise((done) => { resolve = done; })));
    const { result } = renderHook(() => useStudySession(OLD_ENGLISH_DEMO));
    act(() => result.current.setInput("Explain queen"));
    let pending!: Promise<void>; act(() => { pending = result.current.submitTurn(); });
    act(() => { result.current.setBoardNotes(["Newer note"]); result.current.setHighlight("þone cyning"); result.current.setSelectedTool("sticky"); result.current.setInput("Newer draft"); });
    await act(async () => { resolve({ ok: true, json: async () => ({ speaker: "jules", response: "Grounded answer", supportStatus: "supported", citedExcerpt: "cwēn", boardAction: { type: "add-note", text: "AI note" }, memorySuggestion: null, followUp: null }) }); await pending; });
    expect(result.current.boardNotes).toEqual(["Newer note", "AI note"]);
    expect(result.current.highlights).toEqual(expect.arrayContaining(["þone cyning", "cwēn"]));
    expect(result.current.selectedTool).toBe("sticky");
    expect(result.current.input).toBe("Newer draft");
  });

  it("merges preparation with latest board state and can cancel it", async () => {
    let resolve!: (value: unknown) => void;
    const pack = demoPack({ sessionId: "demo", material: OLD_ENGLISH_DEMO.material, peers: defaultPeers, recentTurns: [], selectedMemories: [], question: "Prepare", speaker: "jules", demo: true });
    vi.stubGlobal("fetch", vi.fn((_url, init?: RequestInit) => new Promise((done, reject) => { resolve = done; init?.signal?.addEventListener("abort", () => reject(Object.assign(new Error("aborted"), { name: "AbortError" }))); })));
    const { result } = renderHook(() => useStudySession(OLD_ENGLISH_DEMO));
    let pending!: Promise<void>; act(() => { pending = result.current.preparePack(); });
    act(() => { result.current.setBoardNotes(["Edited while preparing"]); result.current.setSelectedTool("sticky"); });
    await act(async () => { resolve({ ok: true, json: async () => pack }); await pending; });
    expect(result.current.activePack?.board.notes).toEqual(["Edited while preparing"]);
    expect(result.current.activePack?.board.selectedTool).toBe("sticky");
    let cancelled!: Promise<void>; act(() => { cancelled = result.current.preparePack(); }); act(() => result.current.cancelTurn()); await act(() => cancelled);
    expect(result.current.status).toBe("success");
  });

  it("shows unsaved state when pack persistence fails while preserving visible work", () => {
    const pack = demoPack({ sessionId: "demo", material: OLD_ENGLISH_DEMO.material, peers: defaultPeers, recentTurns: [], selectedMemories: [], question: "Prepare", speaker: "jules", demo: true });
    const first = renderHook(() => useStudySession(OLD_ENGLISH_DEMO)); act(() => first.result.current.importPack(pack));
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new DOMException("full", "QuotaExceededError"); });
    act(() => first.result.current.setBoardNotes(["Visible unsaved note"]));
    expect(first.result.current.boardNotes).toEqual(["Visible unsaved note"]);
    expect(first.result.current.status).toBe("storage-error");
    expect(first.result.current.boardSaveNotice).toMatch(/not saved/i);
  });

  it("keeps a packless queued question bound to its original subject", async () => {
    const history = { ...OLD_ENGLISH_DEMO, id: "imported-material", title: "History", material: { title: "History", excerpt: "The treaty was signed in 1919.", citation: "History handout" } };
    let body: { material?: { title?: string } } | undefined;
    vi.stubGlobal("fetch", vi.fn(async (_url, init?: RequestInit) => { body = JSON.parse(String(init?.body)); return { ok: true, json: async () => ({ speaker: "jules", response: "History answer", supportStatus: "supported", citedExcerpt: "1919", boardAction: null, memorySuggestion: null, followUp: null }) }; }));
    const first = renderHook(() => useStudySession(history, false)); act(() => first.result.current.setInput("When was it signed?")); await act(() => first.result.current.submitTurn()); const queued = first.result.current.outbox[0]; first.unmount();
    const biologyPack = { ...demoPack({ sessionId: "bio", material: { title: "Biology", excerpt: "Cells contain DNA.", citation: "Biology" }, peers: defaultPeers, recentTurns: [], selectedMemories: [], question: "DNA", speaker: "rae", demo: true }), id: "bio" };
    const second = renderHook(() => useStudySession(OLD_ENGLISH_DEMO)); act(() => { second.result.current.importPack(biologyPack); second.result.current.setOnline(true); }); await act(() => second.result.current.sendQueued(queued.id));
    expect(body?.material?.title).toBe("History");
    expect(second.result.current.activeMaterial.title).toBe("History");
  });
});

function loadSavedPack() { return JSON.parse(localStorage.getItem("study-together.profile.v1") ?? "{}").packs?.[0]?.id; }
