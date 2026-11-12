import { packSchema, type OfflineStudyPackV1 } from "@/features/storage/local-store";

export function serializePack(pack: OfflineStudyPackV1): string { return JSON.stringify(pack, null, 2); }
const MAX_PACK_BYTES = 200_000;
export function parsePackFile(text: string, bytes = new TextEncoder().encode(text).byteLength): OfflineStudyPackV1 {
  if (bytes > MAX_PACK_BYTES) throw new Error("Offline pack is too large.");
  const pack = packSchema.parse(JSON.parse(text));
  if (pack.board.highlights.some((value) => !pack.excerpt.includes(value))) throw new Error("Offline pack contains an ungrounded highlight.");
  return pack;
}
export function downloadPack(pack: OfflineStudyPackV1) {
  const url = URL.createObjectURL(new Blob([serializePack(pack)], { type: "application/json" }));
  const link = document.createElement("a"); link.href = url; link.download = `${pack.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "study"}-offline-pack.json`; link.click(); URL.revokeObjectURL(url);
}
