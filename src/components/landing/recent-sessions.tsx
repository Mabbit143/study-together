"use client";

import Link from "next/link";
import { saveProfile, type StudyProfileV1 } from "@/features/storage/local-store";

export function RecentSessions({ profile, onError }: { profile: StudyProfileV1; onError(message: string): void }) {
  const sessions = profile.packs.slice(-5).reverse();
  return <section aria-labelledby="recent-sessions-heading" className="panel recent-sessions">
    <p className="eyebrow">Pick up where you left off</p>
    <h2 id="recent-sessions-heading">Previous sessions</h2>
    {sessions.length === 0 ? <p>No previous sessions yet. Create one to get started.</p> : <ul>{sessions.map(pack => <li key={pack.id}><Link href="/?room=old-english-demo" onClick={() => { try { saveProfile({ ...profile, activePackId: pack.id }); } catch { onError("That session could not be opened from this browser."); } }}>{pack.title}</Link></li>)}</ul>}
  </section>;
}
