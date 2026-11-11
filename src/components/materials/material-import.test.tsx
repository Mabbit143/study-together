import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MaterialImport } from "./material-import";

vi.mock("@/features/materials/extract-text", () => ({
  extractMaterial: vi.fn(async () => ({
    name: "beowulf.txt",
    type: "text",
    text: "\u00fea\u0301r \u01e3e\u0304 \u01e2sc",
    warnings: [],
  })),
}));

describe("MaterialImport", () => {
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
