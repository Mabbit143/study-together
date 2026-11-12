"use client";

import { useState } from "react";
import type { ExtractedMaterial } from "@/features/materials/material-schema";
import { confirmExcerpt } from "@/features/materials/select-excerpt";
import type { StudyMaterial } from "@/features/study/types";

type ExcerptPreviewProps = {
  material: ExtractedMaterial;
  onConfirm: (material: StudyMaterial) => void;
};

export function ExcerptPreview({ material, onConfirm }: ExcerptPreviewProps) {
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [error, setError] = useState<string | null>(null);

  function confirm() {
    try {
      onConfirm(confirmExcerpt(material, selection.start, selection.end));
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not confirm the excerpt.");
    }
  }

  return (
    <section aria-labelledby="excerpt-heading">
      <h2 id="excerpt-heading">Choose an excerpt</h2>
      <p>{material.warnings.join(" ")}</p>
      <label htmlFor="material-excerpt">Select the text you want to study</label>
      <textarea
        id="material-excerpt"
        value={material.text}
        readOnly
        onSelect={(event) => setSelection({ start: event.currentTarget.selectionStart, end: event.currentTarget.selectionEnd })}
        rows={12}
      />
      <p>{selection.end - selection.start} characters selected</p>
      {error && <p role="alert">{error}</p>}
      <button type="button" onClick={confirm}>Confirm excerpt</button>
    </section>
  );
}
