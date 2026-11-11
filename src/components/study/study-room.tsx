import type { StudySession } from "@/features/study/types";

import { PeerList } from "./peer-list";
import { Whiteboard } from "./whiteboard";

type StudyRoomProps = {
  session: StudySession;
};

export function StudyRoom({ session }: StudyRoomProps) {
  const activeTurn = session.turns.find((turn) => turn.isActiveSpeaker);
  const activePeer = session.peers.find((peer) => peer.id === activeTurn?.peerId);

  return (
    <main aria-labelledby="room-title" className="study-room">
      <header className="room-header">
        <div>
          <p className="eyebrow">AccessEd study together</p>
          <h1 id="room-title">{session.title}</h1>
        </div>
        <p className="room-status"><span aria-hidden="true" className="presence online" /> Live and focused</p>
      </header>

      <div className="room-grid">
        <section aria-labelledby="material-heading" className="panel material-card">
          <p className="eyebrow">Today&apos;s material</p>
          <h2 id="material-heading">{session.material.title}</h2>
          <blockquote>{session.material.excerpt}</blockquote>
          <cite>{session.material.citation}</cite>
        </section>

        <aside>
          <PeerList peers={session.peers} />
        </aside>

        <Whiteboard board={session.board} />

        <section aria-labelledby="captions-heading" aria-live="polite" className="panel captions" role="status">
          <p className="eyebrow">Live support</p>
          <h2 id="captions-heading">Captions</h2>
          <p className="speaker-name">{activePeer?.name} is speaking</p>
          <p>{activeTurn?.caption}</p>
        </section>
      </div>
    </main>
  );
}
