"use client";

import { useState } from "react";
import type { PeerId, StudyMaterial } from "@/features/study/types";

type Flashcard = { id: string; front: string; back: string };
type Technique = "flashcards" | "cram" | "brainstorm" | null;

function downloadFlashcards(title: string, cards: Flashcard[]) {
  const text = cards.map((card, index) => `Card ${index + 1}\nFront: ${card.front}\nBack: ${card.back}`).join("\n\n");
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a"); link.href = url; link.download = `${title.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "study"}-flashcards.txt`; link.click(); URL.revokeObjectURL(url);
}

export function StudyTechniques({ material, peerNames, difficultMemory }: { material: StudyMaterial; peerNames: Record<PeerId, string>; difficultMemory?: string }) {
  const [technique, setTechnique] = useState<Technique>(null);
  const [front, setFront] = useState(""); const [back, setBack] = useState(""); const [cards, setCards] = useState<Flashcard[]>([]);
  const [project, setProject] = useState(""); const [brainstorming, setBrainstorming] = useState(false);
  const sourcePrompt = material.excerpt.split(/(?<=[.!?])\s+/).find(Boolean) ?? material.excerpt;

  return <section className="panel" aria-labelledby="techniques-heading">
    <h2 id="techniques-heading">Guided study techniques</h2>
    <p>You do the thinking; the buddies provide structure and questions.</p>
    <div className="study-actions"><button type="button" aria-pressed={technique === "flashcards"} onClick={() => setTechnique("flashcards")}>Make flashcards together</button><button type="button" aria-pressed={technique === "cram"} onClick={() => setTechnique("cram")}>Exam cram</button><button type="button" aria-pressed={technique === "brainstorm"} onClick={() => setTechnique("brainstorm")}>Brainstorm a project</button></div>

    {technique === "flashcards" && <div className="technique-workspace"><h3>Build your flashcards</h3><p><strong>{peerNames.jules}:</strong> Choose one idea from this confirmed source and turn it into a question: “{sourcePrompt.slice(0, 180)}”</p><p><strong>{peerNames.rae}:</strong> Write the answer in your own words, then check it against the source.</p><form onSubmit={(event) => { event.preventDefault(); const cleanFront = front.trim(); const cleanBack = back.trim(); if (!cleanFront || !cleanBack) return; setCards((items) => [...items, { id: crypto.randomUUID(), front: cleanFront, back: cleanBack }]); setFront(""); setBack(""); }}><label>Front: your question<input value={front} onChange={(event) => setFront(event.target.value)} /></label><label>Back: your answer<input value={back} onChange={(event) => setBack(event.target.value)} /></label><button type="submit">Add my flashcard</button></form>{cards.length ? <ol aria-label="Your flashcards">{cards.map((card) => <li key={card.id}><strong>{card.front}</strong><p>{card.back}</p><button type="button" onClick={() => setCards((items) => items.filter((item) => item.id !== card.id))}>Remove {card.front}</button></li>)}</ol> : <p>No cards yet—the group will not make them without you.</p>}<button type="button" disabled={!cards.length} onClick={() => downloadFlashcards(material.title, cards)}>Export my flashcards</button></div>}

    {technique === "cram" && <div className="technique-workspace"><h3>Three-step exam cram</h3><ol><li><strong>Recall:</strong> Close the source and explain the main idea in two minutes.</li><li><strong>Check:</strong> Reopen the source and mark what you missed or overstated.</li><li><strong>Practice:</strong> Answer one likely exam question using exact evidence.</li></ol><p><strong>{peerNames.milo}:</strong> Start with: {difficultMemory ? `“${difficultMemory.slice(0, 180)}”` : `What does the confirmed ${material.title} source actually establish?`}</p></div>}

    {technique === "brainstorm" && <div className="technique-workspace"><h3>Brainstorm an upcoming project</h3><label>What are you making or investigating?<textarea value={project} onChange={(event) => { setProject(event.target.value); setBrainstorming(false); }} /></label><button type="button" disabled={!project.trim()} onClick={() => setBrainstorming(true)}>Start brainstorm</button>{brainstorming && <div aria-live="polite"><p><strong>{peerNames.jules}:</strong> What would a successful version of “{project.trim()}” let someone understand or do?</p><p><strong>{peerNames.rae}:</strong> Which sources or examples will you need before you trust the idea?</p><p><strong>{peerNames.milo}:</strong> What is one surprising connection or format you could test without committing to the whole project?</p></div>}</div>}
  </section>;
}
