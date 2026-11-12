import type { OfflineStudyPackV1 } from "@/features/storage/local-store";

export function currentBranch(pack: OfflineStudyPackV1) {
  return pack.branches.find((branch) => branch.id === pack.progress.branchId) ?? pack.branches[0];
}

export function followBranch(pack: OfflineStudyPackV1, id: string): OfflineStudyPackV1 {
  const branch = currentBranch(pack);
  if (!branch.followUpBranchIds.includes(id) || !pack.branches.some((item) => item.id === id)) return pack;
  return { ...pack, progress: { ...pack.progress, branchId: id } };
}

export function searchExcerpt(excerpt: string, query: string): string[] {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return [];
  return excerpt.split(/(?<=[.!?])\s+/).filter((line) => line.toLocaleLowerCase().includes(needle));
}

export function deterministicPractice(pack: OfflineStudyPackV1) {
  return currentBranch(pack).practice.find((item) => !pack.progress.completedPracticeIds.includes(item.id)) ?? null;
}
