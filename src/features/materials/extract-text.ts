import {
  EXTRACTION_TIMEOUT_MS,
  MAX_EXTRACTED_CHARACTERS,
  MAX_FILE_SIZE_BYTES,
  type AcceptedMaterialType,
  type ExtractedMaterial,
} from "./material-schema";

export { EXTRACTION_TIMEOUT_MS, MAX_EXTRACTED_CHARACTERS, MAX_FILE_SIZE_BYTES };
export type { AcceptedMaterialType, ExtractedMaterial };

const definitions: Record<AcceptedMaterialType, { extensions: string[]; mimeTypes: string[] }> = {
  text: { extensions: ["txt", "md"], mimeTypes: ["text/plain", "text/markdown"] },
  pdf: { extensions: ["pdf"], mimeTypes: ["application/pdf"] },
  docx: {
    extensions: ["docx"],
    mimeTypes: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  },
};

function typeFor(file: File): AcceptedMaterialType {
  const extension = file.name.split(".").pop()?.toLowerCase();
  const type = (Object.entries(definitions).find(([, definition]) => definition.extensions.includes(extension ?? ""))?.[0] ?? null) as AcceptedMaterialType | null;
  if (!type) throw new Error("Choose a .txt, .md, .pdf, or .docx file.");
  if (file.type && !definitions[type].mimeTypes.includes(file.type)) {
    throw new Error("The file extension does not match its content type.");
  }
  return type;
}

function normalizeWhitespace(text: string) {
  return text.replace(/[\t\r\n ]+/g, " ").trim();
}

async function withTimeout<T>(work: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      work,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error("Extraction timed out after 15 seconds.")), EXTRACTION_TIMEOUT_MS);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

export async function extractMaterial(file: File): Promise<ExtractedMaterial> {
  if (file.size > MAX_FILE_SIZE_BYTES) throw new Error("Files must be 10 MiB or smaller.");
  const type = typeFor(file);
  const extracted = await withTimeout(
    type === "text"
      ? file.text().then((text) => ({ text, warnings: [] }))
      : type === "pdf"
        ? import("./extract-pdf").then(({ extractPdf }) => extractPdf(file))
        : import("./extract-docx").then(({ extractDocx }) => extractDocx(file)),
  );
  const text = normalizeWhitespace(extracted.text);
  if (!text) throw new Error(type === "pdf" ? "This PDF has no selectable text." : "This file is empty.");
  if (text.length > MAX_EXTRACTED_CHARACTERS) throw new Error("Extracted text must be 100,000 characters or fewer.");
  return { name: file.name, type, text, warnings: extracted.warnings };
}
