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
});

function loadSavedPack() { return JSON.parse(localStorage.getItem("study-together.profile.v1") ?? "{}").packs?.[0]?.id; }
