"use client";
export function StudyPaths({ onCreateSession, onContinue }: { onCreateSession?: () => void; onContinue?: () => void }) {
 return <nav aria-label="Study paths"><button type="button" disabled={!onCreateSession} onClick={onCreateSession}>Create new session</button><button type="button" disabled={!onContinue} onClick={onContinue}>Continue studying</button></nav>;
}
