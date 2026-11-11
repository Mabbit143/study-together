import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { Landing } from "./landing";
it("opens each study path", async () => { const user = userEvent.setup(); render(<Landing />); await user.click(screen.getByRole("button", { name: "Bring material" })); expect(screen.getByText("Bring your material to start a study session.")).toBeInTheDocument(); await user.click(screen.getByRole("button", { name: "Continue studying" })); expect(await screen.findByRole("heading", { name: "Your saved study data" })).toBeInTheDocument(); });
