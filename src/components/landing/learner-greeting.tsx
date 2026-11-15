"use client";

import { useState } from "react";
import { saveProfile, type StudyProfileV1 } from "@/features/storage/local-store";

export function LearnerGreeting({ profile, onSaved }: { profile: StudyProfileV1; onSaved(profile: StudyProfileV1): void }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  if (profile.learnerName) return <section aria-label="Learner greeting" className="learner-greeting"><p className="eyebrow">Welcome back</p><h2>{profile.learnerName}</h2><p>Your name and study history are saved only in this browser.</p></section>;
  function saveName() {
    const learnerName = name.trim();
    if (!learnerName) { setError("Enter the name your study group should use."); return; }
    try { const next = { ...profile, learnerName }; saveProfile(next); onSaved(next); setError(""); }
    catch { setError("Your learner name could not be saved in this browser."); }
  }
  return <section aria-labelledby="profile-heading" className="learner-greeting"><p className="eyebrow">Local learner profile</p><h2 id="profile-heading">What should your study group call you?</h2><p>This is not an online login. The name stays in this browser.</p><label>Your name<input autoComplete="name" maxLength={100} value={name} onChange={event => setName(event.target.value)} /></label>{error && <p role="alert">{error}</p>}<button disabled={!name.trim()} onClick={saveName} type="button">Save learner name</button></section>;
}
