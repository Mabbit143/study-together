import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { OLD_ENGLISH_DEMO } from "@/features/study/demo-session";
import type { StudySession } from "@/features/study/types";
import { StudyRoom } from "./study-room";

describe("StudyRoom", () => {
  it("shows accessible captions and the four whiteboard controls", () => {
    render(<StudyRoom session={OLD_ENGLISH_DEMO} />);

    expect(screen.getByRole("status")).toHaveTextContent("Captions");
    expect(screen.getByText("Sēo cwēn gesihð þone cyning")).toBeInTheDocument();
    expect(screen.getByText("Old English practice text, line 1")).toBeInTheDocument();
    expect(screen.getByText("Answer status: Cited source")).toBeInTheDocument();
    expect(screen.getByText("Source for this answer: Old English practice text, line 1")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pointer" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pen" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sticky note" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear board" })).toBeInTheDocument();
    expect(screen.getByText(/Hi there, I'm Jules/i)).toBeInTheDocument();
    expect(screen.getByText(/Hey there, I'm Rae/i)).toBeInTheDocument();
    expect(screen.getByText(/Welcome there, I'm Milo/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Select focus topic" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Upload more class materials" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Adjust personality/ })).toHaveLength(3);
    expect(screen.getByRole("button", { name: "Export transcript" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /^Start topic:/ })).toHaveLength(3);
    expect(screen.getByRole("heading", { name: "Old English sentence roles" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Cell biology essentials" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Source evaluation basics" })).toBeInTheDocument();
  });

  it("rejects a session whose active-turn ID does not identify exactly one turn", () => {
    const missingTurnSession = {
      ...OLD_ENGLISH_DEMO,
      activeTurnId: "missing-turn",
    } as unknown as StudySession;
    const duplicateTurnSession = {
      ...OLD_ENGLISH_DEMO,
      turns: [...OLD_ENGLISH_DEMO.turns, { ...OLD_ENGLISH_DEMO.turns[1] }],
    };

    expect(() => render(<StudyRoom session={missingTurnSession} />)).toThrow(
      "Study session must identify exactly one active turn.",
    );
    expect(() => render(<StudyRoom session={duplicateTurnSession} />)).toThrow(
      "Study session must identify exactly one active turn.",
    );
  });
});
