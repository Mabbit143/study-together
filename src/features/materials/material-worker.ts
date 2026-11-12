import { extractPdf } from "./extract-pdf";
import { extractDocx } from "./extract-docx";

self.onmessage = async (event: MessageEvent<{ file: File; type: "pdf" | "docx" }>) => {
  try {
    const { file, type } = event.data;
    const result = await (type === "pdf" ? extractPdf(file) : extractDocx(file));
    self.postMessage({ result });
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : "Could not read this document. Try another file or paste the text." });
  }
};
