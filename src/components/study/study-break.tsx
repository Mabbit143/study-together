"use client";

import { useState } from "react";
import type { StudySessionController } from "@/features/study/use-study-session";

const jokes = [
  "Why did the study group bring a ladder? The syllabus said the material was next-level.",
  "I made a pencil joke, but it had no point. I am choosing to learn from this.",
];

function cleanMemory(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 180);
}

export function StudyBreak({ study }: { study: StudySessionController }) {
  const [takingBreak, setTakingBreak] = useState(false);
  const [round, setRound] = useState(0);
  const profile = study.profile;
  if (!profile) return null;

  const names = profile.peers;
  const memory = [...profile.memory.helpful, ...profile.memory.difficult].at(-1);
  const otherRooms = [...new Set(profile.packs.map((pack) => pack.title).filter((title) => title !== study.activeMaterial.title))].slice(0, 3);
  const words = study.activeMaterial.excerpt.trim().split(/\s+/).filter(Boolean);
  const sentences = study.activeMaterial.excerpt.split(/(?<=[.!?])\s+/).filter((value) => value.trim());

  if (!takingBreak) return <section className="panel study-break-entry"><h2>Need a breather?</h2><p>Pause the study talk without losing your place.</p><button type="button" onClick={() => setTakingBreak(true)}>Take a study break</button></section>;

  return <section aria-labelledby="study-break-heading" className="panel study-break">
    <p className="eyebrow">Break mode</p>
    <h2 id="study-break-heading">The group is taking five</h2>
    <p>These are low-stakes AI buddy messages, not study answers.</p>
    <div className="break-chat" aria-live="polite">
      <p><strong>{names.jules.name}:</strong> {jokes[round % jokes.length]}</p>
      <p><strong>{names.rae.name}:</strong> Subject-adjacent trivia from your confirmed material: this {study.activeMaterial.title} excerpt has {words.length} words across {Math.max(1, sentences.length)} sentence{sentences.length === 1 ? "" : "s"}.</p>
      <p><strong>{names.milo.name}:</strong> {memory ? `You mentioned “${cleanMemory(memory.text)}” before. How are you feeling about that now—no studying required?` : "What is one completely non-academic thing that has been making your day better?"}</p>
      <p><strong>{names.jules.name}:</strong> {otherRooms.length ? `You also have ${otherRooms.join(", ")} waiting in your other study rooms. Want a reminder to visit one after this break?` : "Do you have another study room or subject you want us to remind you about later?"}</p>
    </div>
    <div className="study-actions"><button type="button" onClick={() => setRound((value) => value + 1)}>More break chat</button><button type="button" onClick={() => setTakingBreak(false)}>Back to studying</button></div>
  </section>;
}
