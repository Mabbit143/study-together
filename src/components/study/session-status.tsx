import type { SessionStatus as Status } from "@/features/study/use-study-session";
const messages: Record<Status, string> = {
  empty: "Add a question before sending.", loading: "The group is thinking…", success: "Ready to study.",
  "offline-pack": "Offline with a prepared study pack.", "offline-no-pack": "Offline without a prepared pack. Search, highlight, and notes still work.",
  "waiting-for-connection": "Question saved on this device and waiting for your approval after reconnection.",
  "rate-limit": "The shared study limit was reached. Try the demo or return later.", "provider-error": "The study service is unavailable. Your question is still here; retry or use the demo.", demo: "Demo response shown.",
};
export function SessionStatus({ status }: { status: Status }) { return <section aria-label="Session status" aria-live="polite" className="session-status"><strong>Status:</strong> {messages[status]}</section>; }
