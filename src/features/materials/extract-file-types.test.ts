import { beforeEach, describe, expect, it, vi } from "vitest";

const parsers = vi.hoisted(() => ({ pdf: vi.fn(), docx: vi.fn() }));

vi.mock("./extract-pdf", () => ({ extractPdf: parsers.pdf }));
vi.mock("./extract-docx", () => ({ extractDocx: parsers.docx }));

import { extractMaterial } from "./extract-text";

const pdf = (contents = "fixture") => new File([contents], "old-english.pdf", { type: "application/pdf" });
const docx = (contents = "fixture") => new File([contents], "old-english.docx", {
  type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
});

describe("PDF and DOCX import safety", () => {
  beforeEach(() => {
    parsers.pdf.mockReset();
    parsers.docx.mockReset();
  });

  it("preserves Unicode returned from PDF and DOCX fixtures", async () => {
    parsers.pdf.mockResolvedValue({ text: "þār ǣē Ǣsc", warnings: [] });
    parsers.docx.mockResolvedValue({ text: "þār ǣē Ǣsc", warnings: [] });

    await expect(extractMaterial(pdf())).resolves.toMatchObject({ text: "þār ǣē Ǣsc", type: "pdf" });
    await expect(extractMaterial(docx())).resolves.toMatchObject({ text: "þār ǣē Ǣsc", type: "docx" });
  });

  it("does not advance malformed or encrypted files", async () => {
    parsers.pdf.mockRejectedValueOnce(new Error("This PDF could not be read. It may be malformed or unsupported."));
    parsers.pdf.mockRejectedValueOnce(new Error("This PDF is encrypted and cannot be imported."));

    await expect(extractMaterial(pdf())).rejects.toThrow("malformed");
    await expect(extractMaterial(pdf())).rejects.toThrow("encrypted");
  });

  it("does not advance image-only PDFs", async () => {
    parsers.pdf.mockResolvedValue({
      text: "",
      warnings: ["This PDF appears to contain images rather than selectable text."],
    });

    await expect(extractMaterial(pdf())).rejects.toThrow("no selectable text");
  });

  it("does not advance an extraction that exceeds 15 seconds", async () => {
    vi.useFakeTimers();
    parsers.docx.mockReturnValue(new Promise(() => undefined));
    const extraction = extractMaterial(docx());
    const timedOut = expect(extraction).rejects.toThrow("timed out");
    await vi.advanceTimersByTimeAsync(15_000);
    await timedOut;
    vi.useRealTimers();
  });
});
