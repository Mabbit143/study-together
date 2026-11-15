import { render, screen, within } from "@testing-library/react";
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
it("lets the learner opt into keep-on mode without starting the microphone", async () => {
  const start = vi.fn(); const change = vi.fn(); const user = userEvent.setup();
  const view = render(<TurnRecorder status="idle" transcript="" keepOn={false} onKeepOnChange={change} onStart={start} onStop={vi.fn()} onTranscriptChange={vi.fn()} />);
  await user.click(within(view.container).getByRole("checkbox", { name: /keep microphone on/i }));
  expect(change).toHaveBeenCalledWith(true);
  expect(start).not.toHaveBeenCalled();
});
it("renders caption and AI disclosure before optional audio control", () => {
  render(<SpeechPlayer caption="Grounded answer" audioUrl="blob:test" />);
  const caption = screen.getByText("Grounded answer"); const audio = screen.getByLabelText("Play AI-generated voice");
  expect(caption.compareDocumentPosition(audio) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(screen.getByText(/AI-generated/)).toBeInTheDocument();
});
