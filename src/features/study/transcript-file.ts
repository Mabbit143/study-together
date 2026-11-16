import type { PeerId, StudyTurn } from "./types";

export function formatTranscript({ roomTitle, materialTitle, turns, peerNames }: { roomTitle: string; materialTitle: string; turns: StudyTurn[]; peerNames: Record<PeerId, string> }) {
  const lines = [`Study Together transcript`, `Room: ${roomTitle}`, `Material: ${materialTitle}`, ""];
  turns.forEach((turn) => {
    if (turn.question) lines.push(`You: ${turn.question}`);
    lines.push(`${peerNames[turn.peerId]}: ${turn.caption}`);
    if (turn.provenance.status === "cited") lines.push(`Source: ${turn.provenance.sourceCitation}`);
    lines.push("");
  });
  return lines.join("\n").trimEnd() + "\n";
}

export function downloadTranscript(filename: string, transcript: string) {
  const url = URL.createObjectURL(new Blob([transcript], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "study"}-transcript.txt`;
  link.click();
  URL.revokeObjectURL(url);
}
