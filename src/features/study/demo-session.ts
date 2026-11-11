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
      id: "mara",
      name: "Mara",
      role: "Student",
      aiLabel: "Human learner",
      isPresent: true,
    },
    {
      id: "aelfric",
      name: "Ælfric",
      role: "Translator",
      aiLabel: "AI translation assistant",
      isPresent: true,
    },
    {
      id: "wulfstan",
      name: "Wulfstan",
      role: "Coach",
      aiLabel: "AI language coach",
      isPresent: true,
    },
  ],
  turns: [
    {
      id: "turn-1",
      peerId: "mara",
      caption: "I think cwēn means queen. Is gesihð the verb?",
      isActiveSpeaker: false,
    },
    {
      id: "turn-2",
      peerId: "aelfric",
      caption: "Yes. The sentence means: The queen sees the king.",
      isActiveSpeaker: true,
    },
  ],
  board: {
    notes: ["cwēn = queen", "gesihð = sees"],
    selectedTool: "pointer",
  },
};
