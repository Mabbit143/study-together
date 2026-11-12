import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OLD_ENGLISH_DEMO } from "@/features/study/demo-session";
import { StudyExperience } from "./study-experience";
import axe from "axe-core";
import { SessionStatus } from "./session-status";
import type { SessionStatus as Status } from "@/features/study/use-study-session";
import { useStudySession } from "@/features/study/use-study-session";
import { StudyRoom } from "./study-room";
import { demoPack } from "@/features/ai/demo-engine";
import { defaultPeers } from "@/features/preferences/peer-preferences";
import { loadProfile, saveProfile } from "@/features/storage/local-store";

function ExperienceHarness({ online = true }: { online?: boolean }) { return <StudyExperience study={useStudySession(OLD_ENGLISH_DEMO, online)} />; }

describe("StudyExperience", () => {
  beforeEach(() => { localStorage.clear(); vi.stubGlobal("fetch", vi.fn()); });
  afterEach(cleanup);

  it("offers a keyboard-readable complete study and offline flow", () => {
    render(<StudyRoom session={OLD_ENGLISH_DEMO} />);
    expect(screen.getByRole("textbox", { name: /your question/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /start recording/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /prepare offline study pack/i })).toBeInTheDocument();
    expect(screen.getByText(/prepared offline study is not live ai/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /sticky note/i }));
    fireEvent.change(screen.getByRole("textbox", { name: /board note/i }), { target: { value: "My note" } });
    fireEvent.click(screen.getByRole("button", { name: /save board note/i }));
    expect(screen.getByText("My note")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /another example/i }));
    expect(screen.getByText(/another subject-specific example/i)).toBeInTheDocument();
  });

  it("labels all recovery states and keeps peer controls available", () => {
    render(<ExperienceHarness online={false} />);
    expect(screen.getAllByText(/offline without a prepared pack/i)).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: /peer settings/i })).toHaveLength(3);
    expect(screen.getByRole("region", { name: /session status/i })).toHaveAttribute("aria-live", "polite");
  });

  it("has no serious or critical automated accessibility violations", async () => {
    const { container } = render(<ExperienceHarness />);
    const result = await axe.run(container, { resultTypes: ["violations"] });
    expect(result.violations.filter((item) => item.impact === "serious" || item.impact === "critical")).toEqual([]);
  });

  it("provides human-readable recovery for every session state", () => {
    const states: Status[] = ["empty", "loading", "success", "offline-pack", "offline-no-pack", "waiting-for-connection", "rate-limit", "provider-error", "demo"];
    for (const status of states) { const { unmount } = render(<SessionStatus status={status} />); expect(screen.getByRole("region", { name: /session status/i })).not.toBeEmptyDOMElement(); unmount(); }
  });

  it("keeps optional peer speech off until requested and allows stopping it", async () => {
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => undefined);
    const fetcher = vi.fn().mockResolvedValue({ ok: true, blob: async () => new Blob(["audio"], { type: "audio/mpeg" }) }); vi.stubGlobal("fetch", fetcher);
    const createObjectURL = vi.fn(() => "blob:voice"); const revokeObjectURL = vi.fn(); Object.defineProperty(URL, "createObjectURL", { configurable: true, value: createObjectURL }); Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: revokeObjectURL });
    render(<ExperienceHarness />); expect(fetcher).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /play ai voice/i }));
    expect(await screen.findByLabelText(/optional ai voice playback/i)).toBeInTheDocument();
    expect(fetcher).toHaveBeenCalledWith("/api/speech", expect.objectContaining({ method: "POST" }));
    fireEvent.click(screen.getByRole("button", { name: /stop ai voice/i })); expect(screen.queryByLabelText(/optional ai voice playback/i)).not.toBeInTheDocument(); expect(revokeObjectURL).toHaveBeenCalledWith("blob:voice");
  });

  it("aborts pending speech on unmount without creating an object URL", async () => {
    let resolve!: (value: unknown) => void;
    const fetcher = vi.fn((_url, init?: RequestInit) => new Promise((done, reject) => { resolve = done; init?.signal?.addEventListener("abort", () => reject(Object.assign(new Error("aborted"), { name: "AbortError" }))); }));
    vi.stubGlobal("fetch", fetcher); const createObjectURL = vi.fn(() => "blob:late"); Object.defineProperty(URL, "createObjectURL", { configurable: true, value: createObjectURL });
    const { unmount } = render(<ExperienceHarness />); fireEvent.click(screen.getByRole("button", { name: /play ai voice/i })); unmount();
    resolve({ ok: true, blob: async () => new Blob(["late"]) }); await Promise.resolve(); await Promise.resolve();
    expect(createObjectURL).not.toHaveBeenCalled();
  });

  it("renders the peer answer once with a consistent uncertain label", () => {
    render(<StudyRoom session={{ ...OLD_ENGLISH_DEMO, turns: OLD_ENGLISH_DEMO.turns.map((turn) => turn.id === OLD_ENGLISH_DEMO.activeTurnId ? { ...turn, caption: "Unique uncertain answer", supportStatus: "uncertain" as const, provenance: { status: "general-knowledge" as const } } : turn) }} />);
    expect(screen.getAllByText("Unique uncertain answer")).toHaveLength(1);
    expect(screen.getByText(/peer is uncertain/i)).toBeInTheDocument();
    expect(screen.queryByText(/general knowledge—not supported/i)).not.toBeInTheDocument();
  });

  it("makes each whiteboard mode change available behavior", () => {
    render(<StudyRoom session={OLD_ENGLISH_DEMO} />);
    fireEvent.click(screen.getByRole("button", { name: "Pen" })); expect(screen.getByRole("textbox", { name: /pen mark/i })).toBeInTheDocument(); fireEvent.change(screen.getByRole("textbox", { name: /pen mark/i }), { target: { value: "underline queen" } }); fireEvent.click(screen.getByRole("button", { name: /add pen mark/i })); expect(screen.getByText(/underline queen/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /sticky note/i })); expect(screen.getByRole("textbox", { name: /board note/i })).toHaveFocus();
    fireEvent.click(screen.getByRole("button", { name: "Pointer" })); expect(screen.getByText(/review and select board items/i)).toBeInTheDocument();
  });

  it("shows live and persisted grounded highlights in the primary whiteboard", async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ speaker: "jules", response: "Queen is supported by the excerpt.", supportStatus: "supported", citedExcerpt: "cwēn", boardAction: null, memorySuggestion: null, followUp: null }) }); vi.stubGlobal("fetch", fetcher);
    render(<StudyRoom session={OLD_ENGLISH_DEMO} />); fireEvent.change(screen.getByRole("textbox", { name: /^your question$/i }), { target: { value: "What is queen?" } }); fireEvent.click(screen.getByRole("button", { name: /send to the group/i }));
    await waitFor(() => expect(within(screen.getByLabelText(/grounded source highlights/i)).getByText("cwēn")).toBeInTheDocument()); cleanup();
    const pack = demoPack({ sessionId: "bio", material: { title: "Biology", excerpt: "Cells contain DNA. Ribosomes build proteins.", citation: "Science" }, peers: defaultPeers, recentTurns: [], selectedMemories: [], question: "Where is DNA?", speaker: "rae", demo: true }); pack.board.highlights = ["Cells contain DNA.", "Ribosomes build proteins."]; pack.board.selectedTool = "sticky";
    const profile = loadProfile().profile; saveProfile({ ...profile, packs: [pack], activePackId: pack.id }); render(<StudyRoom session={OLD_ENGLISH_DEMO} />);
    const boardHighlights = within(screen.getByLabelText(/grounded source highlights/i)); expect(boardHighlights.getByText("Cells contain DNA.")).toBeInTheDocument(); expect(boardHighlights.getByText("Ribosomes build proteins.")).toBeInTheDocument(); expect(screen.getByRole("button", { name: /sticky note/i })).toHaveAttribute("aria-pressed", "true"); expect(screen.getAllByText("Cells contain DNA.")).toHaveLength(1);
  });
});
