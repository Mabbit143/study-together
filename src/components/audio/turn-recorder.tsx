"use client";
import type { RecorderStatus } from "@/features/audio/recorder";
type Props = { status: RecorderStatus; transcript: string; onStart(): void; onStop(): void; onTranscriptChange(value: string): void; error?: string };
export function TurnRecorder({ status, transcript, onStart, onStop, onTranscriptChange, error }: Props) { return <section aria-label="Voice turn">{status === "recording" ? <button type="button" onClick={onStop}>Stop recording</button> : <button type="button" onClick={onStart}>Start recording</button>}<p>Recording starts only when you press the button and stops after 60 seconds.</p>{error && <p role="alert">{error}</p>}<label>Review transcript<textarea value={transcript} onChange={event => onTranscriptChange(event.target.value)} /></label></section>; }
