import { packSchema, type OfflineStudyPackV1 } from "@/features/storage/local-store";

export function serializePack(pack: OfflineStudyPackV1): string { return JSON.stringify(pack, null, 2); }
export function parsePackFile(text: string): OfflineStudyPackV1 { return packSchema.parse(JSON.parse(text)); }
export function downloadPack(pack: OfflineStudyPackV1) {
  const url = URL.createObjectURL(new Blob([serializePack(pack)], { type: "application/json" }));
  const link = document.createElement("a"); link.href = url; link.download = `${pack.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "study"}-offline-pack.json`; link.click(); URL.revokeObjectURL(url);
}
