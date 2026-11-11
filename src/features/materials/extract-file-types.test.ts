// @vitest-environment node
import { File } from "node:buffer";
import { describe, expect, it } from "vitest";
import { extractMaterial, prepareMaterial } from "./extract-text";

function file(bytes: BlobPart[], name: string, type: string) {
  return new File(bytes as never[], name, { type }) as unknown as globalThis.File;
}

describe("document signatures and recovery", () => {
  it.each([
    ["notes.txt", "text/plain", "%PDF-1.7 fake"],
    ["notes.txt", "text/plain", "PK\x03\x04fake"],
    ["notes.pdf", "application/pdf", "plain text"],
    ["notes.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "%PDF-1.7 fake"],
  ])("rejects mismatched bytes for %s", async (name, mime, content) => {
    await expect(extractMaterial(file([content], name, mime))).rejects.toThrow(/does not match its contents.*original file/i);
  });
  it("rejects encrypted Office containers with recovery guidance", async () => {
    const bytes = new Uint8Array([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
    await expect(extractMaterial(file([bytes], "locked.docx", ""))).rejects.toThrow(/encrypted.*Remove its password/i);
  });
  it.each([
    " \n\t%PDF-1.7 fake",
    "\ufeff \n%PDF-1.7 fake",
    "P3\n2 1\n255\n255 0 0 0 255 0\n",
    "\ufeff \nP6\n1 1\n255\n",
    "  GIF89a image",
    "\n<svg xmlns=\"http://www.w3.org/2000/svg\"></svg>",
  ])("rejects disguised document or media content: %s", async (content) => {
    await expect(extractMaterial(file([content], "notes.txt", "text/plain")))
      .rejects.toThrow(/does not match its contents/i);
  });
  it("accepts ordinary Unicode text with a BOM and leading whitespace", async () => {
    await expect(extractMaterial(file(["\ufeff \n Sēo cwēn gesihþ þone cyning"], "notes.txt", "text/plain")))
      .resolves.toMatchObject({ text: "Sēo cwēn gesihþ þone cyning", type: "text" });
  });
  it("gives recovery guidance for empty and image-only content", () => {
    expect(() => prepareMaterial("empty.txt", "text", " ")).toThrow(/empty.*Add text/i);
    expect(() => prepareMaterial("scan.pdf", "pdf", " ")).toThrow(/no selectable text.*OCR/i);
  });
  it("gives recovery guidance for oversized files", async () => {
    await expect(extractMaterial(file([new Uint8Array(10 * 1024 * 1024 + 1)], "large.txt", "text/plain"))).rejects.toThrow(/10 MiB.*smaller/i);
  });
});
