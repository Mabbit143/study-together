import type { ExtractedMaterial } from "./material-schema";

export async function extractPdf(file: File): Promise<Pick<ExtractedMaterial, "text" | "warnings">> {
  try {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const document = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
    const pages = await Promise.all(
      Array.from({ length: document.numPages }, async (_, index) => {
        const page = await document.getPage(index + 1);
        const content = await page.getTextContent();
        return content.items
          .map((item) => ("str" in item ? item.str : ""))
          .filter(Boolean)
          .join(" ");
      }),
    );
    const text = pages.join("\n");
    return {
      text,
      warnings: text.trim() ? [] : ["This PDF appears to contain images rather than selectable text."],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown PDF parsing error";
    if (/password|encrypted/i.test(message)) {
      throw new Error("This PDF is encrypted and cannot be imported.");
    }
    throw new Error("This PDF could not be read. It may be malformed or unsupported.");
  }
}
