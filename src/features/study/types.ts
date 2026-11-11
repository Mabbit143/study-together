export type PeerId = "mara" | "aelfric" | "wulfstan";

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
  role: "Student" | "Translator" | "Coach";
  aiLabel: "Human learner" | "AI translation assistant" | "AI language coach";
  isPresent: boolean;
};

export type StudyTurn = {
  id: string;
  peerId: PeerId;
  caption: string;
  isActiveSpeaker: boolean;
};

export type StudySession = {
  id: string;
  title: string;
  material: StudyMaterial;
  peers: Peer[];
  turns: StudyTurn[];
  board: BoardState;
};
