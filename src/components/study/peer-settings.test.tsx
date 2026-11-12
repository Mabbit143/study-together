import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { expect, it } from "vitest";
import { PeerSettings } from "./peer-settings";
import { defaultPeerPreferences } from "@/features/preferences/peer-preferences";
function Harness() { const [value, setValue] = useState(defaultPeerPreferences); return <PeerSettings preferences={value} onChange={setValue} />; }
it("opens, changes, resets and closes with the keyboard, restoring focus", async () => {
 const user = userEvent.setup(); render(<Harness />); await user.tab(); await user.keyboard("{Enter}"); await user.tab(); await user.tab(); await user.keyboard("{ArrowDown}"); expect(screen.getByLabelText("Voice")).toHaveValue("coral"); await user.tab(); await user.keyboard("{Enter}"); expect(screen.getByLabelText("Voice")).toHaveValue("alloy"); await user.keyboard("{Escape}"); expect(screen.getByRole("button", { name: "Peer settings" })).toHaveFocus();
 await user.keyboard("{Enter}"); for (let i = 0; i < 9; i++) await user.tab(); expect(screen.getByRole("button", { name: "Close settings" })).toHaveFocus(); await user.keyboard("{Enter}"); expect(screen.getByRole("button", { name: "Peer settings" })).toHaveFocus();
});
