import type { Peer } from "@/features/study/types";
import type { PeerPreferences } from "@/features/preferences/peer-preferences";
import { PeerSettings } from "./peer-settings";

type PeerListProps = {
  peers: Peer[];
  preferences?: Record<Peer["id"], PeerPreferences>;
  onChange?: (id: Peer["id"], value: PeerPreferences) => void;
};

export function PeerList({ peers, preferences, onChange }: PeerListProps) {
  return (
    <section aria-labelledby="peers-heading" className="panel peer-list">
      <div className="section-heading">
        <p className="eyebrow">Room</p>
        <h2 id="peers-heading">Study partners</h2>
      </div>
      <ul>
        {peers.map((peer) => (
          <li key={peer.id}>
            <span aria-hidden="true" className={peer.isPresent ? "presence online" : "presence"} />
            <div>
              <strong>{peer.name}</strong>
              {preferences && onChange && <PeerSettings peerId={peer.id} preferences={preferences[peer.id]} onChange={value => onChange(peer.id, value)} triggerClassName="text-link" triggerLabel={`Adjust personality for ${peer.name}`} />}
              <p>{peer.function}</p>
              <span className="ai-label">{peer.aiLabel}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
