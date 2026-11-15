import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import { NewSession } from "./new-session";
import { loadProfile } from "@/features/storage/local-store";

beforeEach(() => localStorage.clear());

it("requires a subject, confirmed material, and persona before entering", async () => {
  const enter = vi.fn(); const user = userEvent.setup(); render(<NewSession onEnter={enter} />);
  const submit = screen.getByRole("button", { name: "Enter study room" }); expect(submit).toBeDisabled();
  await user.type(screen.getByRole("textbox", { name: "What subject?" }), "Biology");
  await user.click(screen.getByRole("radio", { name: /creative personalities/i })); expect(submit).toBeDisabled();
  const source = "Cells contain DNA and ribosomes build proteins."; fireEvent.change(screen.getByLabelText("Or paste text"), { target: { value: source } });
  await user.click(screen.getByRole("button", { name: "Preview pasted text" }));
  const excerpt = await screen.findByLabelText("Select the text you want to study"); fireEvent.select(excerpt, { target: { selectionStart: 0, selectionEnd: source.length } });
  await user.click(screen.getByRole("button", { name: "Confirm excerpt" })); expect(submit).toBeEnabled(); await user.click(submit);
  expect(enter).toHaveBeenCalledWith(expect.objectContaining({ title: "Biology" })); expect(loadProfile().profile.peers.jules.personality).toBe("playful");
});
