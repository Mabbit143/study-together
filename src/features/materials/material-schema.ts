import { z } from "zod";

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
export const MAX_EXTRACTED_CHARACTERS = 100_000;
export const MAX_CONFIRMED_EXCERPT_CHARACTERS = 20_000;
export const EXTRACTION_TIMEOUT_MS = 15_000;

export const acceptedMaterialTypes = ["text", "pdf", "docx"] as const;
export type AcceptedMaterialType = (typeof acceptedMaterialTypes)[number];

export type ExtractedMaterial = {
  name: string;
  type: AcceptedMaterialType;
  text: string;
  warnings: string[];
};

export const extractedMaterialSchema = z.object({
  name: z.string().min(1),
  type: z.enum(acceptedMaterialTypes),
  text: z.string().min(1).max(MAX_EXTRACTED_CHARACTERS),
  warnings: z.array(z.string()),
});
