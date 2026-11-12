import { describe, expect, it } from "vitest";

import {
  EXTRACTION_TIMEOUT_MS,
  MAX_EXTRACTED_CHARACTERS,
  MAX_FILE_SIZE_BYTES,
  extractMaterial,
} from "./extract-text";
import { confirmExcerpt } from "./select-excerpt";

describe("extractMaterial", () => {
  it("imports plain text while preserving Old English Unicode", async () => {
    const file = new File(["  \u00fea\u0301r   \u01e3e\u0304   \u01e2sc  "], "beowulf.txt", {
      type: "text/plain",
    });

    await expect(extractMaterial(file)).resolves.toEqual({
      name: "beowulf.txt",
      type: "text",
      text: "\u00fea\u0301r \u01e3e\u0304 \u01e2sc",
      warnings: [],
    });
  });

  it("rejects an extension and MIME type mismatch", async () => {
    const file = new File(["not a PDF"], "notes.pdf", { type: "text/plain" });
    await expect(extractMaterial(file)).rejects.toThrow("does not match");
  });

  it("rejects empty files", async () => {
    const file = new File(["   \n\t "], "empty.txt", { type: "text/plain" });
    await expect(extractMaterial(file)).rejects.toThrow("empty");
  });

  it("rejects files larger than 10 MiB before parsing", async () => {
    const file = new File([new Uint8Array(MAX_FILE_SIZE_BYTES + 1)], "large.txt", {
      type: "text/plain",
    });
    await expect(extractMaterial(file)).rejects.toThrow("10 MiB");
  });

  it("limits the extracted text to 100,000 characters", async () => {
    const file = new File(["a".repeat(MAX_EXTRACTED_CHARACTERS + 1)], "long.txt", {
      type: "text/plain",
    });
    await expect(extractMaterial(file)).rejects.toThrow("100,000");
  });

  it("requires a non-empty excerpt of at most 20,000 characters", () => {
    const material = { name: "notes.txt", type: "text" as const, text: "\u00fe\u01e3e\u01e2", warnings: [] };
    expect(() => confirmExcerpt(material, 0, 0)).toThrow("Select some text");
    expect(confirmExcerpt(material, 0, 4)).toEqual({
      title: "notes",
      excerpt: "\u00fe\u01e3e\u01e2",
      citation: "notes.txt",
    });
  });

  it("exports the 15-second extraction timeout", () => {
    expect(EXTRACTION_TIMEOUT_MS).toBe(15_000);
  });
});
