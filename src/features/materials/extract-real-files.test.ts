// @vitest-environment node
import { readFile } from "node:fs/promises";
import { File } from "node:buffer";
import { describe, expect, it } from "vitest";
import { extractMaterial } from "./extract-text";

const phrase = "Sēo cwēn gesihþ þone cyning";

describe("real document extraction", () => {
  for (const [extension, mime] of [
    ["pdf", "application/pdf"],
    ["docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  ]) {
    it(`extracts exact Old English from a real ${extension.toUpperCase()}`, async () => {
      const bytes = await readFile(new URL(`./__fixtures__/old-english.${extension}`, import.meta.url));
      const file = new File([bytes], `old-english.${extension}`, { type: mime }) as unknown as globalThis.File;
      await expect(extractMaterial(file)).resolves.toMatchObject({ text: phrase, type: extension });
    });

    it(`rejects malformed ${extension.toUpperCase()} content even with the expected MIME type`, async () => {
      const file = new File([extension === "pdf" ? "%PDF-not a document" : "PK\x03\x04not a document"], `invalid.${extension}`, { type: mime }) as unknown as globalThis.File;
      await expect(extractMaterial(file)).rejects.toThrow(/malformed.*paste the text/i);
    });
  }
});
