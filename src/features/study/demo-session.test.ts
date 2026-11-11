import { describe, expect, it } from "vitest";

import { OLD_ENGLISH_DEMO } from "./demo-session";

describe("OLD_ENGLISH_DEMO", () => {
  it("models the cited Old English sentence with three labeled peers", () => {
    expect(OLD_ENGLISH_DEMO.material.excerpt).toBe("Sēo cwēn gesihð þone cyning");
    expect(OLD_ENGLISH_DEMO.material.citation).toBe("Old English practice text, line 1");
    expect(OLD_ENGLISH_DEMO.peers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ role: "Student", aiLabel: "Human learner" }),
        expect.objectContaining({ role: "Translator", aiLabel: "AI translation assistant" }),
        expect.objectContaining({ role: "Coach", aiLabel: "AI language coach" }),
      ]),
    );
    expect(OLD_ENGLISH_DEMO.turns.filter((turn) => turn.isActiveSpeaker)).toHaveLength(1);
  });
});
