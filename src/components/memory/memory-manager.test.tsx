import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { MemoryManager } from "./memory-manager";
it("edits and deletes equal text by stable ID", async () => {
 const onDelete = vi.fn(), onEdit = vi.fn(); render(<MemoryManager memory={{ helpful: [{ id: "a", text: "same" }, { id: "b", text: "same" }], difficult: [] }} onDelete={onDelete} onEdit={onEdit} />);
 await userEvent.click(screen.getAllByRole("button", { name: "Edit same" })[0]); await userEvent.clear(screen.getByLabelText("Edit memory")); await userEvent.type(screen.getByLabelText("Edit memory"), "different"); await userEvent.click(screen.getByRole("button", { name: "Save memory" })); expect(onEdit).toHaveBeenCalledWith("helpful", "a", "different");
 await userEvent.click(screen.getAllByRole("button", { name: "Delete same" })[1]); expect(onDelete).toHaveBeenCalledWith("helpful", "b");
});
