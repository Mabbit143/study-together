import type { OfflineStudyPackV1 } from "@/features/storage/local-store";
import type { PeerId } from "@/features/study/types";

function starterPack(id: string, title: string, excerpt: string, peerId: PeerId, question: string, hint: string, explanation: string, practice: string): OfflineStudyPackV1 {
  return { version: 1, id, title, excerpt, branches: [{ id: `${id}-branch`, peerId, question, sourceQuote: excerpt, hints: [hint], explanations: [explanation], examples: [`Use this exact source: “${excerpt}”`], practice: [{ id: `${id}-practice`, prompt: practice, answerCheck: `Check that your answer is supported by: “${excerpt}”` }], followUpBranchIds: [] }], board: { notes: [], highlights: [], selectedTool: "pointer" }, progress: { branchId: `${id}-branch`, completedPracticeIds: [] } };
}

export const starterTopicPacks: OfflineStudyPackV1[] = [
  starterPack("starter-old-english", "Old English sentence roles", "Sēo cwēn gesihð þone cyning.", "jules", "How do the word endings help identify who sees whom?", "Compare sēo cwēn with þone cyning.", "The forms mark the queen as the subject and the king as the object.", "Identify the subject, verb, and object, then cite the form that supports each choice."),
  starterPack("starter-cell-biology", "Cell biology essentials", "Mitochondria release usable energy from food, while ribosomes assemble proteins from amino acids.", "rae", "How are mitochondria and ribosomes different?", "Match each structure to the action stated in the sentence.", "The source assigns energy release to mitochondria and protein assembly to ribosomes.", "Explain both jobs without adding information that is not in the source."),
  starterPack("starter-source-evaluation", "Source evaluation basics", "A strong academic claim identifies its evidence, explains how that evidence supports the claim, and states important limits.", "milo", "What makes a claim well supported?", "Find the three actions named in the source.", "The sentence requires evidence, reasoning that connects it to the claim, and acknowledgment of limits.", "Draft one claim and label its evidence, reasoning, and limitation."),
];
