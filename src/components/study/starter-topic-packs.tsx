import type { OfflineStudyPackV1 } from "@/features/storage/local-store";
import { starterTopicPacks } from "@/features/offline/starter-topic-packs";

export function StarterTopicPacks({ onOpen }: { onOpen(pack: OfflineStudyPackV1): void }) {
  return <section className="panel" aria-labelledby="starter-packs-heading"><h2 id="starter-packs-heading">Ready-made topic packs</h2><p>Three source-grounded sessions are available immediately and work offline after you start them.</p><div className="starter-pack-grid">{starterTopicPacks.map((pack) => <article key={pack.id}><h3>{pack.title}</h3><p>{pack.branches[0].question}</p><button type="button" onClick={() => onOpen(pack)}>Start topic: {pack.title}</button></article>)}</div></section>;
}
