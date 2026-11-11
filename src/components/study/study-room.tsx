"use client";
import { useSyncExternalStore } from "react";
import type { StudySession } from "@/features/study/types";
import { useStudySession } from "@/features/study/use-study-session";

import { PeerList } from "./peer-list";
import { Whiteboard } from "./whiteboard";
import { StudyExperience } from "./study-experience";

type StudyRoomProps = {
  session: StudySession;
};

export function StudyRoom({ session }: StudyRoomProps) {
  const mounted = useSyncExternalStore(() => () => undefined, () => true, () => false);
  const study = useStudySession(session);
  const activeTurns = session.turns.filter((turn) => turn.id === session.activeTurnId);
  const [activeTurn] = activeTurns;
  const activePeer = session.peers.find((peer) => peer.id === activeTurn?.peerId);
  const visiblePeers = session.peers.map((peer) => ({ ...peer, name: study.profile?.peers[peer.id].name ?? peer.name }));
  const visibleTurn = study.turns.at(-1) ?? activeTurn;
  const visiblePeer = visiblePeers.find((peer) => peer.id === visibleTurn?.peerId);

  if (activeTurns.length !== 1 || !activePeer) {
    throw new Error("Study session must identify exactly one active turn.");
  }

  // Local study data exists only in the browser. Render the same stable shell
  // on the server and during hydration, then reveal the restored room.
  if (!mounted) {
    return <main className="study-room"><p role="status">Loading saved study room…</p></main>;
  }

  return (
    <main aria-labelledby="room-title" className="study-room">
      <header className="room-header">
        <div>
          <p className="eyebrow">AccessEd study together</p>
          <h1 id="room-title">{study.activePack ? `${study.activeMaterial.title} study group` : session.title}</h1>
        </div>
        <p className="room-status"><span aria-hidden="true" className="presence online" /> Live and focused</p>
      </header>

      <div className="room-grid">
        <section aria-labelledby="material-heading" className="panel material-card">
          <p className="eyebrow">Today&apos;s material</p>
          <h2 id="material-heading">{study.activeMaterial.title}</h2>
          <blockquote>{study.activeMaterial.excerpt}</blockquote>
          <cite>{study.activeMaterial.citation}</cite>
        </section>

        <aside>
          <PeerList peers={visiblePeers} />
        </aside>

        <Whiteboard board={{ notes: study.boardNotes, highlights: study.highlights, selectedTool: study.selectedTool }} onNotesChange={study.setBoardNotes} onSelectedToolChange={study.setSelectedTool} />

        <section aria-labelledby="captions-heading" aria-live="polite" className="panel captions" role="status">
          <p className="eyebrow">Live support</p>
          <h2 id="captions-heading">Captions</h2>
          <p className="speaker-name">{visiblePeer?.name ?? activePeer.name} is speaking</p>
          <p>{visibleTurn.caption}</p>
          {visibleTurn.provenance.status === "cited" ? (
            <>
              <p className="answer-status">Answer status: Cited source</p>
              <cite>Source for this answer: {visibleTurn.provenance.sourceCitation}</cite>
            </>
          ) : (
            <p className="answer-status">Answer status: General knowledge</p>
          )}
        </section>
      </div>
      <StudyExperience study={study} />
    </main>
  );
}
