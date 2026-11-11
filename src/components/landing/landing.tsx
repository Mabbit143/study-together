"use client";
import { useState } from "react";
import type { StudyMaterial } from "@/features/study/types";
import { StartPanel } from "./start-panel";
import { ContinuePanel } from "./continue-panel";
import { StudyPaths } from "./study-paths";
import { MaterialImport } from "@/components/materials/material-import";
import { StudyRoom } from "@/components/study/study-room";
import { OLD_ENGLISH_DEMO } from "@/features/study/demo-session";
export function Landing() {
 const [material, setMaterial] = useState<StudyMaterial | null>(null);
 const [path, setPath] = useState<"bring" | "continue" | null>(null);
 if (material) return <StudyRoom session={{ ...OLD_ENGLISH_DEMO, id: "imported-material", title: material.title, material }} />;
 return <main className="landing"><StartPanel /><StudyPaths onBringMaterial={() => setPath("bring")} onContinue={() => setPath("continue")} />{path === "bring" && <section className="panel"><h2>Bring material</h2><p>Bring your material to start a study session.</p><MaterialImport onConfirm={setMaterial} /></section>}{path === "continue" && <ContinuePanel />}<aside className="landing-note" aria-label="How the demo works"><p className="eyebrow">Built for clarity</p><p>Every contribution is named, every source is cited, and every shared moment can be read as captions.</p></aside></main>;
}
