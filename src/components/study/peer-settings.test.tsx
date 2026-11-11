import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { PeerSettings } from "./peer-settings";
import { defaultPeerPreferences } from "@/features/preferences/peer-preferences";
it("changes and resets attributes independently with the keyboard and replaces a peer", async () => {
  const user = userEvent.setup(); const onChange = vi.fn();
  render(<PeerSettings preferences={defaultPeerPreferences} onChange={onChange} />);
  await user.tab(); await user.keyboard("{Enter}");
  await user.selectOptions(screen.getByLabelText("Voice"), "coral");
  expect(onChange).toHaveBeenCalledWith({ ...defaultPeerPreferences, voice: "coral" });
  await user.click(screen.getByRole("button", { name: "Reset voice" }));
  expect(onChange).toHaveBeenLastCalledWith(defaultPeerPreferences);
  await user.click(screen.getByRole("button", { name: "Replace peer" }));
  expect(onChange.mock.lastCall?.[0].name).not.toBe(defaultPeerPreferences.name);
  await user.keyboard("{Escape}"); expect(screen.queryByLabelText("Voice")).not.toBeInTheDocument();
});
