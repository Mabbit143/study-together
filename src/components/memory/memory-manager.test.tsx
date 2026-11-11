import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { MemoryManager } from "./memory-manager";
it("shows and deletes learner memory", async () => {
 const onDelete = vi.fn(); render(<MemoryManager memory={{ helpful: ["examples"], difficult: ["dates"] }} onDelete={onDelete} />);
 expect(screen.getByText("dates")).toBeInTheDocument();
 await userEvent.click(screen.getByRole("button", { name: "Delete examples" })); expect(onDelete).toHaveBeenCalledWith("helpful", "examples");
});
