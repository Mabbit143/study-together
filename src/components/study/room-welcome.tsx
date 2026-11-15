import type { Peer } from "@/features/study/types";

const greetingFor = (peer: Peer, learner: string) => peer.function === "facilitates" ? `Hi ${learner}, I'm ${peer.name}. I'll help keep us moving.` : peer.function === "checks sources" ? `Hey ${learner}, I'm ${peer.name}. I'll keep us connected to the material.` : `Welcome ${learner}, I'm ${peer.name}. I'll help connect the ideas.`;

export function RoomWelcome({ learnerName, peers }: { learnerName?: string; peers: Peer[] }) {
  const learner = learnerName?.trim() || "there";
  return <section aria-labelledby="welcome-heading" className="panel room-welcome"><p className="eyebrow">Your group is here</p><h2 id="welcome-heading">Welcome to the room</h2><ul>{peers.map(peer => <li key={peer.id}><strong>{peer.name}:</strong> {greetingFor(peer, learner)}</li>)}</ul></section>;
}
