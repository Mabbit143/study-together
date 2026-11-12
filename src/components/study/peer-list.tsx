import type { Peer } from "@/features/study/types";

type PeerListProps = {
  peers: Peer[];
};

export function PeerList({ peers }: PeerListProps) {
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
              <p>{peer.function}</p>
              <span className="ai-label">{peer.aiLabel}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
