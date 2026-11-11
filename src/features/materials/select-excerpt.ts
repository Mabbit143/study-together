import type { StudyMaterial } from "@/features/study/types";
import { MAX_CONFIRMED_EXCERPT_CHARACTERS, type ExtractedMaterial } from "./material-schema";

export function confirmExcerpt(material: ExtractedMaterial, start: number, end: number): StudyMaterial {
  const excerpt = material.text.slice(start, end);
  if (!excerpt) throw new Error("Select some text before confirming.");
  if (excerpt.length > MAX_CONFIRMED_EXCERPT_CHARACTERS) {
    throw new Error("Your excerpt must be 20,000 characters or fewer.");
  }
  return { title: material.name.replace(/\.[^.]+$/, ""), excerpt, citation: material.name };
}
