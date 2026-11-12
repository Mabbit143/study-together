import { describe, expect, it } from "vitest";

import { OLD_ENGLISH_DEMO } from "./demo-session";

describe("OLD_ENGLISH_DEMO", () => {
  it("models the cited Old English sentence with the three required AI peers", () => {
    expect(OLD_ENGLISH_DEMO.material.excerpt).toBe("Sēo cwēn gesihð þone cyning");
    expect(OLD_ENGLISH_DEMO.material.citation).toBe("Old English practice text, line 1");
    expect(OLD_ENGLISH_DEMO.peers).toEqual([
      expect.objectContaining({ name: "Jules", function: "facilitates", aiLabel: "AI peer" }),
      expect.objectContaining({ name: "Rae", function: "checks sources", aiLabel: "AI peer" }),
      expect.objectContaining({ name: "Milo", function: "makes connections", aiLabel: "AI peer" }),
    ]);
    expect(OLD_ENGLISH_DEMO.activeTurnId).toBe("turn-2");
    expect(OLD_ENGLISH_DEMO.turns.find((turn) => turn.id === OLD_ENGLISH_DEMO.activeTurnId)).toBeDefined();
    expect(OLD_ENGLISH_DEMO.turns.find((turn) => turn.id === OLD_ENGLISH_DEMO.activeTurnId)?.provenance).toEqual({
      status: "cited",
      sourceCitation: "Old English practice text, line 1",
    });
  });
});
