import {
  EXTRACTION_TIMEOUT_MS, MAX_EXTRACTED_CHARACTERS, MAX_FILE_SIZE_BYTES,
  type AcceptedMaterialType, type ExtractedMaterial,
} from "./material-schema";

export { EXTRACTION_TIMEOUT_MS, MAX_EXTRACTED_CHARACTERS, MAX_FILE_SIZE_BYTES };
export type { AcceptedMaterialType, ExtractedMaterial };

const definitions: Record<AcceptedMaterialType, { extensions: string[]; mimeTypes: string[] }> = {
  text: { extensions: ["txt", "md"], mimeTypes: ["text/plain", "text/markdown"] },
  pdf: { extensions: ["pdf"], mimeTypes: ["application/pdf"] },
  docx: { extensions: ["docx"], mimeTypes: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"] },
};

function typeFor(file: File): AcceptedMaterialType {
  const extension = file.name.split(".").pop()?.toLowerCase();
  const type = (Object.entries(definitions).find(([, value]) => value.extensions.includes(extension ?? ""))?.[0] ?? null) as AcceptedMaterialType | null;
  if (!type) throw new Error("Choose a .txt, .md, .pdf, or .docx file.");
  if (file.type && !definitions[type].mimeTypes.includes(file.type)) throw new Error("The file extension does not match its content type. Choose the original file.");
  return type;
}

const encryptedOffice = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];
function begins(bytes: Uint8Array, signature: number[]) { return signature.every((value, index) => bytes[index] === value); }

export function prepareMaterial(name: string, type: AcceptedMaterialType, raw: string, warnings: string[] = []): ExtractedMaterial {
  const text = raw.replace(/[\t\r\n ]+/g, " ").trim();
  if (!text) throw new Error(type === "pdf" ? "This PDF has no selectable text. Try a text-based PDF or run OCR first." : "This file is empty. Add text or choose another file.");
  if (text.length > MAX_EXTRACTED_CHARACTERS) throw new Error("Extracted text must be 100,000 characters or fewer. Choose a shorter document.");
  return { name, type, text, warnings };
}

async function parseDocument(file: File, type: "pdf" | "docx"): Promise<Pick<ExtractedMaterial, "text" | "warnings">> {
  // The UI always runs document parsers off the main thread. Node runs the same
  // extractors directly for fixture tests, outside the browser execution path.
  if (typeof window === "undefined") {
    return type === "pdf" ? (await import("./extract-pdf")).extractPdf(file) : (await import("./extract-docx")).extractDocx(file);
  }
  return new Promise((resolve, reject) => {
    let worker: Worker;
    try {
      worker = new Worker(new URL("./material-worker.ts", import.meta.url), { type: "module" });
    } catch {
      reject(new Error("Document processing could not start. Try another browser or paste the text."));
      return;
    }
    let done = false;
    const finish = (result?: Pick<ExtractedMaterial, "text" | "warnings">, error?: string) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      worker.terminate();
      if (error) reject(new Error(error)); else resolve(result!);
    };
    const timer = setTimeout(() => finish(undefined, "Extraction timed out after 15 seconds. Try a smaller file or paste the text."), EXTRACTION_TIMEOUT_MS);
    worker.onmessage = (event: MessageEvent<{ result?: Pick<ExtractedMaterial, "text" | "warnings">; error?: string }>) => {
      if (event.data.error) finish(undefined, event.data.error);
      else if (event.data.result) finish(event.data.result);
      else finish(undefined, "Document processing failed. Try another file or paste the text.");
    };
    worker.onerror = (event) => {
      console.error("Document worker failed:", event.message);
      finish(undefined, "Document processing failed. Try another file or paste the text.");
    };
    worker.onmessageerror = () => finish(undefined, "Document processing failed. Try another file or paste the text.");
    try { worker.postMessage({ file, type }); }
    catch { finish(undefined, "Document processing failed. Try another file or paste the text."); }
  });
}

export async function extractMaterial(file: File): Promise<ExtractedMaterial> {
  if (file.size > MAX_FILE_SIZE_BYTES) throw new Error("Files must be 10 MiB or smaller. Choose a smaller file.");
  const type = typeFor(file);
  const bytes = new Uint8Array(await file.arrayBuffer());
  const pdf = begins(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d]);
  const zip = begins(bytes, [0x50, 0x4b, 0x03, 0x04]);
  if (type === "docx" && begins(bytes, encryptedOffice)) throw new Error("This DOCX may be encrypted. Remove its password and save it as DOCX, then try again.");
  if ((type === "pdf" && !pdf) || (type === "docx" && !zip) || (type === "text" && (pdf || zip || begins(bytes, encryptedOffice)))) {
    throw new Error("The file extension does not match its contents. Choose the original file or export it in the correct format.");
  }
  if (type === "text") {
    let text: string;
    try {
      text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
      if (text.includes("\0")) throw new Error("binary");
    } catch { throw new Error("This is not valid UTF-8 text. Export it as UTF-8 text and try again."); }
    return prepareMaterial(file.name, type, text);
  }
  const extracted = await parseDocument(file, type);
  return prepareMaterial(file.name, type, extracted.text, extracted.warnings);
}
