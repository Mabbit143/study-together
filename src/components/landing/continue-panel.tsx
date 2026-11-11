"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { PeerSettings } from "@/components/study/peer-settings";
import { MemoryManager } from "@/components/memory/memory-manager";
import { clearProfile, deleteMemory, editMemory, deletePack, deleteQueuedQuestion, loadProfile, saveProfile, type StudyProfileV1 } from "@/features/storage/local-store";
export function ContinuePanel() {
 const [profile, setProfile] = useState<StudyProfileV1 | null>(null); const [notice, setNotice] = useState<string | null>(null);
 function refresh() { const result = loadProfile(); setProfile(result.profile); setNotice(result.resetNotice); }
 useEffect(() => { let active = true; Promise.resolve().then(() => { if (active) refresh(); }); return () => { active = false; }; }, []);
 function run(action: () => void) { try { action(); refresh(); } catch { setNotice("Could not save study data in this browser. Please check your browser storage settings."); } }
 return <section className="panel" aria-labelledby="continue-heading"><h2 id="continue-heading">Your saved study data</h2><p>Your study data stays in this browser.</p>{notice && <p role="alert">{notice}</p>}
 {profile && !notice && <>{profile.memory.difficult[0] && <p><strong>Suggested next step:</strong> Practice “{profile.memory.difficult[0].text}” again. <Link href="/?room=old-english-demo">Return to the study room</Link></p>}{(["jules", "rae", "milo"] as const).map(id => <div key={id}><h3>{profile.peers[id].name}</h3><PeerSettings peerId={id} preferences={profile.peers[id]} onChange={peer => run(() => saveProfile({ ...profile, peers: { ...profile.peers, [id]: peer } }))} /></div>)}<MemoryManager memory={profile.memory} onDelete={(kind, id) => run(() => deleteMemory(kind, id))} onEdit={(kind, id, replacement) => run(() => editMemory(kind, id, replacement))} />
 <h3>Offline study packs</h3>{profile.packs.length === 0 && <p>No saved packs yet.</p>}<ul>{profile.packs.map(pack => <li key={pack.id}>{pack.title} <button type="button" onClick={() => run(() => deletePack(pack.id))}>Delete {pack.title}</button></li>)}</ul><h3>Waiting for connection</h3><ul>{profile.queuedQuestions.map(question => <li key={question.id}>{question.text} <button type="button" onClick={() => run(() => deleteQueuedQuestion(question.id))}>Delete question {question.text}</button></li>)}</ul></>}
 <button type="button" onClick={() => run(clearProfile)}>Clear local study data</button></section>;
}
