import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { TurnRecorder } from "./turn-recorder";
import { SpeechPlayer } from "./speech-player";

it("requires explicit recording and exposes editable transcript", async () => {
  const start = vi.fn(); const user = userEvent.setup();
  render(<TurnRecorder status="idle" transcript="draft" onStart={start} onStop={vi.fn()} onTranscriptChange={vi.fn()} />);
  expect(start).not.toHaveBeenCalled(); await user.click(screen.getByRole("button", { name: "Start recording" })); expect(start).toHaveBeenCalledOnce();
  expect(screen.getByLabelText("Review transcript")).toHaveValue("draft");
});
it("renders caption and AI disclosure before optional audio control", () => {
  render(<SpeechPlayer caption="Grounded answer" audioUrl="blob:test" />);
  const caption = screen.getByText("Grounded answer"); const audio = screen.getByLabelText("Play AI-generated voice");
  expect(caption.compareDocumentPosition(audio) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(screen.getByText(/AI-generated/)).toBeInTheDocument();
});
