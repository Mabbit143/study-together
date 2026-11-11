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
  const [pastedText, setPastedText] = useState("");

  async function previewPastedText() {
    setError(null);
    setMaterial(null);
    try {
      const { prepareMaterial } = await import("@/features/materials/extract-text");
      setMaterial(prepareMaterial("Pasted text", "text", pastedText));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not read the text. Try again.");
    }
  }

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
        onChange={(event) => {
          void importFile(event.currentTarget.files?.[0]);
          event.currentTarget.value = "";
        }}
        disabled={isExtracting}
      />
      <label htmlFor="pasted-material">Or paste text</label>
      <textarea id="pasted-material" value={pastedText} onChange={(event) => setPastedText(event.currentTarget.value)} disabled={isExtracting} />
      <button type="button" onClick={() => void previewPastedText()} disabled={isExtracting}>Preview pasted text</button>
      {isExtracting && <p role="status">Reading your file…</p>}
      {error && <p role="alert">{error}</p>}
      {material && <ExcerptPreview key={`${material.name}:${material.text}`} material={material} onConfirm={onConfirm} />}
    </section>
  );
}
