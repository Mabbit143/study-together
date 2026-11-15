"use client";

import { useState } from "react";
import { MaterialImport } from "@/components/materials/material-import";
import { peersForPersona, studyGroupPersonas, type StudyGroupPersona } from "@/features/preferences/peer-preferences";
import { loadProfile, saveProfile } from "@/features/storage/local-store";
import type { StudyMaterial } from "@/features/study/types";

export function NewSession({ onEnter }: { onEnter(material: StudyMaterial): void }) {
  const [subject, setSubject] = useState("");
  const [persona, setPersona] = useState<StudyGroupPersona | null>(null);
  const [material, setMaterial] = useState<StudyMaterial | null>(null);
  const [error, setError] = useState("");
  function enterRoom() {
    const cleanSubject = subject.trim();
    if (!cleanSubject || !persona || !material) { setError("Choose a subject, confirm study material, and select a study group before entering."); return; }
    try {
      const profile = loadProfile().profile;
      saveProfile({ ...profile, peers: peersForPersona(persona) });
      onEnter({ ...material, title: cleanSubject });
    } catch { setError("Your study-group choice could not be saved in this browser."); }
  }
  return <section aria-labelledby="new-session-heading" className="new-session panel">
    <p className="eyebrow">Set up your room</p>
    <h1 id="new-session-heading">Create new session</h1>
    <label>What subject?<input value={subject} onChange={event => setSubject(event.target.value)} /></label>
    <div className="new-session-material"><h2>Upload materials</h2><MaterialImport onConfirm={setMaterial} /></div>
    {material && <p className="confirmed-choice" role="status">Material confirmed: {material.citation}</p>}
    <fieldset><legend>Choose your study group persona</legend><div className="persona-grid">{studyGroupPersonas.map(option => <label className="persona-option" key={option.id}><input checked={persona === option.id} name="persona" onChange={() => setPersona(option.id)} type="radio" value={option.id} /><strong>{option.label}</strong><span>{option.description}</span></label>)}</div></fieldset>
    {error && <p role="alert">{error}</p>}
    <button className="primary-action" disabled={!subject.trim() || !material || !persona} onClick={enterRoom} type="button">Enter study room</button>
  </section>;
}
