"use client";
export function StudyPaths({ onBringMaterial, onContinue }: { onBringMaterial?: () => void; onContinue?: () => void }) {
 return <nav aria-label="Study paths"><button type="button" disabled={!onBringMaterial} onClick={onBringMaterial}>Bring material</button><button type="button" disabled={!onContinue} onClick={onContinue}>Continue studying</button></nav>;
}
