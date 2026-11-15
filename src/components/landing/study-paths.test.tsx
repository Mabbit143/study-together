import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { StudyPaths } from "./study-paths";
afterEach(cleanup);
it("offers equally available paths through callbacks", async () => {
 const create = vi.fn(), resume = vi.fn(); render(<StudyPaths onCreateSession={create} onContinue={resume} />);
 await userEvent.click(screen.getByRole("button", { name: "Create new session" })); await userEvent.click(screen.getByRole("button", { name: "Continue studying" }));
 expect(create).toHaveBeenCalledOnce(); expect(resume).toHaveBeenCalledOnce();
});
it("disables paths that are not wired yet", () => { render(<StudyPaths />); expect(screen.getByRole("button", { name: "Create new session" })).toBeDisabled(); expect(screen.getByRole("button", { name: "Continue studying" })).toBeDisabled(); });
