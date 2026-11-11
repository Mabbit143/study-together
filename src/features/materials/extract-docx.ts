import type { ExtractedMaterial } from "./material-schema";

export async function extractDocx(file: File): Promise<Pick<ExtractedMaterial, "text" | "warnings">> {
  try {
    const mammoth = await import("mammoth/mammoth.browser.js");
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    return { text: result.value, warnings: result.messages.map((message) => message.message) };
  } catch {
    throw new Error("This DOCX file could not be read. It may be malformed or unsupported.");
  }
}
