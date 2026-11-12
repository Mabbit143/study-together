"use client";
type Props = { caption: string; audioUrl?: string };
export function SpeechPlayer({ caption, audioUrl }: Props) { return <section aria-label="Peer response"><p>{caption}</p><p>Voice audio is AI-generated, not a human recording.</p>{audioUrl && <audio aria-label="Play AI-generated voice" controls src={audioUrl} />}</section>; }
