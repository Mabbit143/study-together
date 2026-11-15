import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it } from "vitest";
import { Landing } from "./landing";
import { demoPack } from "@/features/ai/demo-engine";
import { defaultPeers } from "@/features/preferences/peer-preferences";
import { loadProfile, saveProfile } from "@/features/storage/local-store";
beforeEach(() => localStorage.clear());
it("opens new and previous session paths from the landing navigation", async () => { const user = userEvent.setup(); render(<Landing />); await user.click(screen.getAllByRole("button", { name: "Create new session" })[0]); expect(screen.getByRole("heading", { name: "Create new session" })).toBeInTheDocument(); await user.click(screen.getByRole("button", { name: "Open navigation menu" })); await user.click(screen.getByRole("button", { name: "Previous sessions" })); expect(await screen.findByRole("heading", { name: "Your saved study data" })).toBeInTheDocument(); });
it("shows an empty recent-session state", async () => { render(<Landing />); expect(await screen.findByRole("heading", { name: "Previous sessions" })).toBeInTheDocument(); expect(screen.getByText(/no previous sessions yet/i)).toBeInTheDocument(); });
it("shows only the five most recent saved sessions", async () => {
 const packs = Array.from({ length: 6 }, (_, index) => ({ ...demoPack({ sessionId: `session-${index + 1}`, material: { title: `Session ${index + 1}`, excerpt: `Confirmed source ${index + 1}.`, citation: "Notes" }, peers: defaultPeers, recentTurns: [], selectedMemories: [], question: "Study this source", speaker: "jules", demo: true }), id: `session-${index + 1}`, title: `Session ${index + 1}` }));
 saveProfile({ ...loadProfile().profile, packs, activePackId: packs.at(-1)!.id }); render(<Landing />); await screen.findByRole("link", { name: "Session 6" }); expect(screen.queryByRole("link", { name: "Session 1" })).not.toBeInTheDocument(); expect(screen.getAllByRole("link")).toHaveLength(5);
});
