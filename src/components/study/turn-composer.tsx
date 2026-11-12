"use client";
import { useRef, useState } from "react";
import { createRecorder, type RecorderState } from "@/features/audio/recorder";
import { TurnRecorder } from "@/components/audio/turn-recorder";

export function TurnComposer({ value, onChange, onSubmit, loading, onCancel }: { value: string; onChange(value: string): void; onSubmit(): void; loading?: boolean; onCancel?(): void }) {
  const [recorderState, setRecorderState] = useState<RecorderState>({ status: "idle", transcript: "", typedFallback: false });
  const recorder = useRef<ReturnType<typeof createRecorder> | null>(null); const draftRevision = useRef(0); const recordingRevision = useRef(0);
  function controller() {
    if (!recorder.current) recorder.current = createRecorder({ onRecording: async (blob) => {
      const body = new FormData(); body.append("audio", blob, `turn.${blob.type.includes("wav") ? "wav" : "webm"}`);
      try { const response = await fetch("/api/transcribe", { method: "POST", body }); if (!response.ok) throw new Error(); const result = await response.json() as { transcript: string }; if (draftRevision.current !== recordingRevision.current) return; onChange(result.transcript); setRecorderState({ ...recorder.current!.state(), transcript: result.transcript }); }
      catch { setRecorderState({ ...recorder.current!.state(), typedFallback: true, error: "Transcription failed. Type or edit your response instead." }); }
    } });
    return recorder.current;
  }
  async function start() { recordingRevision.current = draftRevision.current; await controller().start(); setRecorderState(controller().state()); }
  function stop() { controller().stop(); queueMicrotask(() => setRecorderState(controller().state())); }
  return <section className="panel composer" aria-labelledby="composer-heading"><h2 id="composer-heading">Your turn</h2><label>Your question<textarea value={value} onChange={(event) => { draftRevision.current += 1; onChange(event.target.value); }} /></label>{loading ? <button type="button" onClick={onCancel}>Interrupt response</button> : <button type="button" onClick={onSubmit}>Send to the group</button>}<TurnRecorder status={recorderState.status} transcript={value} onStart={() => void start()} onStop={stop} onTranscriptChange={(next) => { draftRevision.current += 1; onChange(next); }} error={recorderState.error} /></section>;
}
