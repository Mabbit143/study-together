import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MaterialImport } from "./material-import";
import { extractMaterial } from "@/features/materials/extract-text";

afterEach(cleanup);

vi.mock("@/features/materials/extract-text", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/features/materials/extract-text")>(),
  extractMaterial: vi.fn(async () => ({
    name: "beowulf.txt",
    type: "text",
    text: "\u00fea\u0301r \u01e3e\u0304 \u01e2sc",
    warnings: [],
  })),
}));

describe("MaterialImport", () => {
  it("previews pasted text and requires an explicit selection and confirmation", async () => {
    const onConfirm = vi.fn();
    render(<MaterialImport onConfirm={onConfirm} />);
    fireEvent.change(screen.getByLabelText("Or paste text"), { target: { value: "Sēo cwēn gesihþ þone cyning" } });
    fireEvent.click(screen.getByRole("button", { name: "Preview pasted text" }));
    const preview = await screen.findByLabelText("Select the text you want to study");
    expect(onConfirm).not.toHaveBeenCalled();
    fireEvent.select(preview, { target: { selectionStart: 0, selectionEnd: 8 } });
    fireEvent.click(screen.getByRole("button", { name: "Confirm excerpt" }));
    expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({ excerpt: "Sēo cwēn" }));
  });

  it("offers recovery from empty pasted text and can be retried", async () => {
    render(<MaterialImport onConfirm={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Preview pasted text" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Add text or choose another file");
    fireEvent.change(screen.getByLabelText("Or paste text"), { target: { value: "Retry" } });
    fireEvent.click(screen.getByRole("button", { name: "Preview pasted text" }));
    expect(await screen.findByLabelText("Select the text you want to study")).toHaveValue("Retry");
  });

  it("shows timeout recovery and allows the user to paste after a failed import", async () => {
    vi.mocked(extractMaterial).mockRejectedValueOnce(new Error("Extraction timed out after 15 seconds. Try a smaller file or paste the text."));
    render(<MaterialImport onConfirm={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Text, PDF, or DOCX file"), {
      target: { files: [new File(["ignored"], "slow.pdf", { type: "application/pdf" })] },
    });
    expect(await screen.findByRole("alert")).toHaveTextContent("Try a smaller file or paste the text");
    fireEvent.change(screen.getByLabelText("Or paste text"), { target: { value: "Recovered text" } });
    fireEvent.click(screen.getByRole("button", { name: "Preview pasted text" }));
    expect(await screen.findByLabelText("Select the text you want to study")).toHaveValue("Recovered text");
  });
  it("shows an extracted preview and only submits after confirmation", async () => {
    const onConfirm = vi.fn();
    render(<MaterialImport onConfirm={onConfirm} />);

    fireEvent.change(screen.getByLabelText("Text, PDF, or DOCX file"), {
      target: { files: [new File(["ignored"], "beowulf.txt", { type: "text/plain" })] },
    });

    await screen.findByLabelText("Select the text you want to study");
    expect(onConfirm).not.toHaveBeenCalled();

    const preview = screen.getByLabelText("Select the text you want to study");
    fireEvent.select(preview, { target: { selectionStart: 0, selectionEnd: 12 } });
    fireEvent.click(screen.getByRole("button", { name: "Confirm excerpt" }));

    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));
    expect(onConfirm.mock.calls[0][0].excerpt).toBe("\u00fea\u0301r \u01e3e\u0304 \u01e2sc");
  });
});
