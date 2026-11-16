import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, it } from "vitest";
import { OLD_ENGLISH_DEMO } from "@/features/study/demo-session";
import { loadProfile, saveProfile } from "@/features/storage/local-store";
import { demoPack } from "@/features/ai/demo-engine";
import { defaultPeers } from "@/features/preferences/peer-preferences";
import { useStudySession } from "@/features/study/use-study-session";
import { StudyBreak } from "./study-break";

function Harness() { return <StudyBreak study={useStudySession(OLD_ENGLISH_DEMO)} />; }

beforeEach(() => localStorage.clear());

it("opens reversible break chat with jokes, memory, grounded trivia, and other-room reminders", () => {
  const profile = loadProfile().profile;
  const biology = demoPack({ sessionId: "bio", material: { title: "Cell biology", excerpt: "Cells use energy.", citation: "Class notes" }, peers: defaultPeers, recentTurns: [], selectedMemories: [], question: "Prepare", speaker: "jules", demo: true });
  const history = demoPack({ sessionId: "history", material: { title: "World history", excerpt: "Trade routes connected cities.", citation: "Class notes" }, peers: defaultPeers, recentTurns: [], selectedMemories: [], question: "Prepare", speaker: "rae", demo: true });
  saveProfile({ ...profile, memory: { ...profile.memory, helpful: [{ id: "m1", text: "verb endings finally clicked", subjectTitle: "Old English" }] }, packs: [biology, history], activePackId: biology.id });
  render(<Harness />);
  fireEvent.click(screen.getByRole("button", { name: /take a study break/i }));
  expect(screen.getByText(/ladder.*next-level/i)).toBeInTheDocument();
  expect(screen.getByText(/verb endings finally clicked/i)).toBeInTheDocument();
  expect(screen.getByText(/excerpt has \d+ words/i)).toBeInTheDocument();
  expect(screen.getByText(/world history waiting/i)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /more break chat/i }));
  expect(screen.getByText(/pencil joke/i)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /back to studying/i }));
  expect(screen.getByRole("button", { name: /take a study break/i })).toBeInTheDocument();
});
