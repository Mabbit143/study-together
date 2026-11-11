import type { StudyTurnRequest, StudyTurnResponse } from "./turn-schema";
import type { OfflineStudyPackV1 } from "@/features/storage/local-store";
export function demoTurn(request: StudyTurnRequest): StudyTurnResponse {
 const quote = request.material.excerpt.slice(0, 200);
 const approach = request.peers[request.speaker].approach;
 const response = approach === "question-led" ? `What do you notice in this passage: “${quote}”?` : approach === "example-led" ? `For an example, look at “${quote}”. What stands out to you?` : `The passage says: “${quote}”. This is source evidence: a supported answer follows from the wording in the passage. Practice: find that wording and explain what it tells you.`;
 return { speaker: request.speaker, response, supportStatus: "supported", citedExcerpt: quote, boardAction: null, memorySuggestion: null, followUp: null };
}
export function demoPack(request: StudyTurnRequest): OfflineStudyPackV1 {
 const quote = request.material.excerpt.slice(0, 200);
 return { version: 1, id: "demo-pack", title: request.material.title, excerpt: request.material.excerpt, branches: [{ id: "branch-1", peerId: request.speaker, question: request.question, sourceQuote: quote, hints: ["Look closely at the quoted passage."], explanations: [`The passage says: “${quote}”`], examples: [`One example from the passage is: “${quote}”`], practice: [{ id: "practice-1", prompt: "Find the quoted passage in your material.", answerCheck: `Check your answer against: “${quote}”` }], followUpBranchIds: [] }], board: { notes: [], highlights: [], selectedTool: "pointer" }, progress: { branchId: "branch-1", completedPracticeIds: [] } };
}
