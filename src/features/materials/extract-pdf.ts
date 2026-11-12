import type { ExtractedMaterial } from "./material-schema";

export async function extractPdf(file: File): Promise<Pick<ExtractedMaterial, "text" | "warnings">> {
  try {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const inWorker = typeof self !== "undefined" && "importScripts" in self;
    const workerSrc = new URL("pdfjs-dist/legacy/build/pdf.worker.min.mjs", import.meta.url).toString();
    if (typeof window !== "undefined" || inWorker) pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
    // PDF.js accesses window when it creates its own worker. Supply a nested
    // worker explicitly when extraction itself is already running in a worker.
    const port = inWorker ? new Worker(workerSrc, { type: "module" }) : undefined;
    const pdfWorker = port ? pdfjs.PDFWorker.create({ port }) : undefined;
    const loadingTask = pdfjs.getDocument({ data: await file.arrayBuffer(), worker: pdfWorker });
    try {
      const document = await loadingTask.promise;
      const pages = await Promise.all(Array.from({ length: document.numPages }, async (_, index) => {
        const page = await document.getPage(index + 1);
        const content = await page.getTextContent();
        return content.items.map((item) => ("str" in item ? item.str : "")).filter(Boolean).join(" ");
      }));
      const text = pages.join("\n");
      return { text, warnings: text.trim() ? [] : ["This PDF appears to contain images rather than selectable text."] };
    } finally {
      await loadingTask.destroy();
      pdfWorker?.destroy();
      port?.terminate();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown PDF parsing error";
    if (/password|encrypted/i.test(message)) throw new Error("This PDF is encrypted. Remove its password and try again.");
    throw new Error("This PDF could not be read. It may be malformed or unsupported. Try exporting a new PDF or paste the text.");
  }
}
