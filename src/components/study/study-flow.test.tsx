import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OLD_ENGLISH_DEMO } from "@/features/study/demo-session";
import { StudyExperience } from "./study-experience";
import axe from "axe-core";
import { SessionStatus } from "./session-status";
import type { SessionStatus as Status } from "@/features/study/use-study-session";
import { useStudySession } from "@/features/study/use-study-session";
import { StudyRoom } from "./study-room";

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
});
