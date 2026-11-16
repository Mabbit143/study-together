import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { StudyTechniques } from "./study-techniques";

const props = { material: { title: "Cell Biology", excerpt: "Ribosomes assemble proteins. Mitochondria release usable energy.", citation: "Class notes" }, peerNames: { jules: "Jules", rae: "Rae", milo: "Milo" } } as const;

beforeEach(() => { vi.restoreAllMocks(); });
afterEach(cleanup);

it("guides the learner to make and export their own flashcards", () => {
  const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined); vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:cards"); vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
  render(<StudyTechniques {...props} />); fireEvent.click(screen.getByRole("button", { name: /make flashcards together/i }));
  expect(screen.getByText(/will not make them without you/i)).toBeInTheDocument();
  fireEvent.change(screen.getByRole("textbox", { name: /front: your question/i }), { target: { value: "What do ribosomes do?" } }); fireEvent.change(screen.getByRole("textbox", { name: /back: your answer/i }), { target: { value: "They assemble proteins." } }); fireEvent.click(screen.getByRole("button", { name: /add my flashcard/i }));
  expect(screen.getByRole("list", { name: /your flashcards/i })).toHaveTextContent("What do ribosomes do?"); fireEvent.click(screen.getByRole("button", { name: /export my flashcards/i })); expect(click).toHaveBeenCalled();
});

it("offers an exam-cram plan and a three-buddy project brainstorm", () => {
  render(<StudyTechniques {...props} difficultMemory="I mix up the organelles" />); fireEvent.click(screen.getByRole("button", { name: /exam cram/i })); expect(screen.getByText(/I mix up the organelles/i)).toBeInTheDocument(); fireEvent.click(screen.getByRole("button", { name: /brainstorm a project/i })); fireEvent.change(screen.getByRole("textbox", { name: /what are you making/i }), { target: { value: "a cell model" } }); fireEvent.click(screen.getByRole("button", { name: /start brainstorm/i })); expect(screen.getByText(/successful version.*cell model/i)).toBeInTheDocument(); expect(screen.getByText(/Which sources or examples/i)).toBeInTheDocument(); expect(screen.getByText(/surprising connection/i)).toBeInTheDocument();
});
