import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { StudyPaths } from "./study-paths";
afterEach(cleanup);
it("offers equally available paths through callbacks", async () => {
 const bring = vi.fn(), resume = vi.fn(); render(<StudyPaths onBringMaterial={bring} onContinue={resume} />);
 await userEvent.click(screen.getByRole("button", { name: "Bring material" })); await userEvent.click(screen.getByRole("button", { name: "Continue studying" }));
 expect(bring).toHaveBeenCalledOnce(); expect(resume).toHaveBeenCalledOnce();
});
it("disables paths that are not wired yet", () => { render(<StudyPaths />); expect(screen.getByRole("button", { name: "Bring material" })).toBeDisabled(); expect(screen.getByRole("button", { name: "Continue studying" })).toBeDisabled(); });
