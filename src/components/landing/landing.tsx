"use client";
import { useState } from "react";
import type { StudyMaterial } from "@/features/study/types";
import { StartPanel } from "./start-panel";
import { ContinuePanel } from "./continue-panel";
import { StudyPaths } from "./study-paths";
import { MaterialImport } from "@/components/materials/material-import";
export function Landing() {
 const [material, setMaterial] = useState<StudyMaterial | null>(null);
 const [path, setPath] = useState<"bring" | "continue" | null>(null);
 return <main className="landing"><StartPanel /><StudyPaths onBringMaterial={() => setPath("bring")} onContinue={() => setPath("continue")} />{path === "bring" && <section className="panel"><h2>Bring material</h2><p>Bring your material to start a study session.</p><MaterialImport onConfirm={setMaterial} />{material && <div role="status"><h3>Material ready</h3><p>{material.title}</p><blockquote>{material.excerpt}</blockquote><cite>{material.citation}</cite></div>}</section>}{path === "continue" && <ContinuePanel />}<aside className="landing-note" aria-label="How the demo works"><p className="eyebrow">Built for clarity</p><p>Every contribution is named, every source is cited, and every shared moment can be read as captions.</p></aside></main>;
}
