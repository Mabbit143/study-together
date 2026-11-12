import type { QueuedQuestion } from "@/features/storage/local-store";

export function addToOutbox(outbox: QueuedQuestion[], text: string, packId: string | null = null, materialTitle = "Study material"): QueuedQuestion[] {
  const clean = text.trim();
  return clean ? [...outbox, { id: crypto.randomUUID(), text: clean, packId, materialTitle }] : outbox;
}

export function removeFromOutbox(outbox: QueuedQuestion[], id: string): QueuedQuestion[] {
  return outbox.filter((item) => item.id !== id);
}
