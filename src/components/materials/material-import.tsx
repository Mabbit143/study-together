"use client";

import { useState } from "react";
import type { ExtractedMaterial } from "@/features/materials/material-schema";
import type { StudyMaterial } from "@/features/study/types";
import { ExcerptPreview } from "./excerpt-preview";

type MaterialImportProps = {
  onConfirm: (material: StudyMaterial) => void;
};

export function MaterialImport({ onConfirm }: MaterialImportProps) {
  const [material, setMaterial] = useState<ExtractedMaterial | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);

  async function importFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setMaterial(null);
    setIsExtracting(true);
    try {
      // This dynamic import keeps document parsers out of the server bundle.
      const { extractMaterial } = await import("@/features/materials/extract-text");
      setMaterial(await extractMaterial(file));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not import that file.");
    } finally {
      setIsExtracting(false);
    }
  }

  return (
    <section aria-labelledby="material-import-heading">
      <h1 id="material-import-heading">Add study material</h1>
      <label htmlFor="material-file">Text, PDF, or DOCX file</label>
      <input
        id="material-file"
        type="file"
        accept=".txt,.md,text/plain,text/markdown,.pdf,application/pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={(event) => void importFile(event.currentTarget.files?.[0])}
        disabled={isExtracting}
      />
      {isExtracting && <p role="status">Reading your file…</p>}
      {error && <p role="alert">{error}</p>}
      {material && <ExcerptPreview material={material} onConfirm={onConfirm} />}
    </section>
  );
}
