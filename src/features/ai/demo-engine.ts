import type { StudyTurnRequest, StudyTurnResponse } from "./turn-schema";
import type { OfflineStudyPackV1 } from "@/features/storage/local-store";
export function demoTurn(request: StudyTurnRequest): StudyTurnResponse {
 const quote = request.material.excerpt.slice(0, 200);
 const approach = request.peers[request.speaker].approach;
 const name = request.peers[request.speaker].name; const personality = request.peers[request.speaker].personality;
 const response = approach === "question-led" ? `${name} (${personality}) asks about “${request.question}”: What do you notice in “${quote}”?` : approach === "example-led" ? `${name} (${personality}) connects your question “${request.question}” to this example: “${quote}”. What stands out?` : `${name} (${personality}) explains your question “${request.question}”: the passage says “${quote}”. Practice by explaining what that wording shows.`;
 return { speaker: request.speaker, response, supportStatus: "supported", citedExcerpt: quote, boardAction: null, memorySuggestion: `Remember how ${name} connected the question to the quoted source.`, followUp: "Which exact words in the quote support your answer?" };
}
export function demoPack(request: StudyTurnRequest): OfflineStudyPackV1 {
 const quote = request.material.excerpt.slice(0, 200);
 return { version: 1, id: "demo-pack", title: request.material.title, excerpt: request.material.excerpt, branches: [{ id: "branch-1", peerId: request.speaker, question: request.question, sourceQuote: quote, hints: ["Look closely at the quoted passage."], explanations: [`The passage says: “${quote}”`], examples: [`One example from the passage is: “${quote}”`], practice: [{ id: "practice-1", prompt: "Find the quoted passage in your material.", answerCheck: `Check your answer against: “${quote}”` }], followUpBranchIds: [] }], board: { notes: [], highlights: [], selectedTool: "pointer" }, progress: { branchId: "branch-1", completedPracticeIds: [] } };
}
