import type { StudySession } from "./types";

export const OLD_ENGLISH_DEMO: StudySession = {
  id: "old-english-demo",
  title: "Old English reading circle",
  material: {
    title: "Practice sentence",
    excerpt: "Sēo cwēn gesihð þone cyning",
    citation: "Old English practice text, line 1",
  },
  peers: [
    {
      id: "jules",
      name: "Jules",
      function: "facilitates",
      aiLabel: "AI peer",
      isPresent: true,
    },
    {
      id: "rae",
      name: "Rae",
      function: "checks sources",
      aiLabel: "AI peer",
      isPresent: true,
    },
    {
      id: "milo",
      name: "Milo",
      function: "makes connections",
      aiLabel: "AI peer",
      isPresent: true,
    },
  ],
  turns: [
    {
      id: "turn-1",
      peerId: "jules",
      caption: "I think cwēn means queen. Is gesihð the verb?",
      provenance: {
        status: "general-knowledge",
      },
    },
    {
      id: "turn-2",
      peerId: "rae",
      caption: "Yes. The sentence means: The queen sees the king.",
      provenance: {
        status: "cited",
        sourceCitation: "Old English practice text, line 1",
      },
    },
  ],
  activeTurnId: "turn-2",
  board: {
    notes: ["cwēn = queen", "gesihð = sees"],
    selectedTool: "pointer",
  },
};
