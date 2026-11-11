import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { OLD_ENGLISH_DEMO } from "@/features/study/demo-session";
import { StudyRoom } from "./study-room";

describe("StudyRoom", () => {
  it("shows accessible captions and the four whiteboard controls", () => {
    render(<StudyRoom session={OLD_ENGLISH_DEMO} />);

    expect(screen.getByRole("status")).toHaveTextContent("Captions");
    expect(screen.getByText("Sēo cwēn gesihð þone cyning")).toBeInTheDocument();
    expect(screen.getByText("Old English practice text, line 1")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pointer" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pen" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sticky note" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear board" })).toBeInTheDocument();
  });
});
