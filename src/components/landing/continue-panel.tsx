"use client";
import { useEffect, useState } from "react";
import { PeerSettings } from "@/components/study/peer-settings";
import { MemoryManager } from "@/components/memory/memory-manager";
import { clearProfile, deleteMemory, deletePack, deleteQueuedQuestion, loadProfile, saveProfile, type StudyProfileV1 } from "@/features/storage/local-store";

export function ContinuePanel() {
 const [profile, setProfile] = useState<StudyProfileV1 | null>(null);
 const [notice, setNotice] = useState<string | null>(null);
 function refresh() { const result = loadProfile(); setProfile(result.profile); setNotice(result.resetNotice); }
 useEffect(() => { let active = true; Promise.resolve().then(() => { if (active) refresh(); }); return () => { active = false; }; }, []);
 function run(action: () => void) { try { action(); refresh(); } catch { setNotice("Could not save study data in this browser. Please check your browser storage settings."); } }
 return <section className="panel" aria-labelledby="continue-heading"><h2 id="continue-heading">Continue studying</h2><p>Your study data stays in this browser.</p>
 {notice && <p role="alert">{notice}</p>}
 {profile && !notice && <><PeerSettings preferences={profile.peer} onChange={peer => run(() => saveProfile({ ...profile, peer }))} /><MemoryManager memory={profile.memory} onDelete={(kind, item) => run(() => deleteMemory(kind, item))} onEdit={(kind, item, replacement) => run(() => saveProfile({ ...profile, memory: { ...profile.memory, [kind]: profile.memory[kind].map(value => value === item ? replacement : value) } }))} />
 <h3>Offline study packs</h3>{profile.packs.length === 0 && <p>No saved packs yet.</p>}<ul>{profile.packs.map(pack => <li key={pack.id}>{pack.title} <button type="button" onClick={() => run(() => deletePack(pack.id))}>Delete {pack.title}</button></li>)}</ul>
 <h3>Waiting for connection</h3><ul>{profile.queuedQuestions.map(question => <li key={question.id}>{question.text} <button type="button" onClick={() => run(() => deleteQueuedQuestion(question.id))}>Delete question {question.text}</button></li>)}</ul></>}
 <button type="button" onClick={() => run(clearProfile)}>Clear local study data</button></section>;
}
