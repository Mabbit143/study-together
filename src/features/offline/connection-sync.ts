import type { StudyMaterial } from "@/features/study/types";
import type { QueuedQuestion } from "@/features/storage/local-store";

export function addToOutbox(outbox: QueuedQuestion[], text: string, packId: string | null = null, material: StudyMaterial = { title: "Study material", excerpt: "Study material", citation: "Local material" }): QueuedQuestion[] {
  const clean = text.trim();
  return clean ? [...outbox, { id: crypto.randomUUID(), text: clean, packId, materialTitle: material.title, material }] : outbox;
}

export function removeFromOutbox(outbox: QueuedQuestion[], id: string): QueuedQuestion[] {
  return outbox.filter((item) => item.id !== id);
}
