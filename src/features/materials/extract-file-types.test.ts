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
  it("gives recovery guidance for empty and image-only content", () => {
    expect(() => prepareMaterial("empty.txt", "text", " ")).toThrow(/empty.*Add text/i);
    expect(() => prepareMaterial("scan.pdf", "pdf", " ")).toThrow(/no selectable text.*OCR/i);
  });
  it("gives recovery guidance for oversized files", async () => {
    await expect(extractMaterial(file([new Uint8Array(10 * 1024 * 1024 + 1)], "large.txt", "text/plain"))).rejects.toThrow(/10 MiB.*smaller/i);
  });
});
