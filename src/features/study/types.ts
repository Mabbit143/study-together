export type PeerId = "jules" | "rae" | "milo";

export type StudyMaterial = {
  title: string;
  excerpt: string;
  citation: string;
};

export type BoardState = {
  notes: string[];
  selectedTool: "pointer" | "pen" | "sticky";
};

export type Peer = {
  id: PeerId;
  name: string;
  function: "facilitates" | "checks sources" | "makes connections";
  aiLabel: "AI peer";
  isPresent: boolean;
};

export type AnswerProvenance =
  | { status: "cited"; sourceCitation: string }
  | { status: "general-knowledge" };

export type StudyTurn = {
  id: string;
  peerId: PeerId;
  caption: string;
  provenance: AnswerProvenance;
};

export type StudySession = {
  id: string;
  title: string;
  material: StudyMaterial;
  peers: Peer[];
  turns: StudyTurn[];
  activeTurnId: string;
  board: BoardState;
};
