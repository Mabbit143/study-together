import { expect, it, vi } from "vitest";
import { downloadTranscript, formatTranscript } from "./transcript-file";

it("formats learner questions, named buddy answers, and citations", () => {
  const text = formatTranscript({ roomTitle: "Biology room", materialTitle: "Cells", peerNames: { jules: "Jules", rae: "Rae", milo: "Milo" }, turns: [{ id: "t1", peerId: "rae", question: "What do ribosomes do?", caption: "They assemble proteins.", provenance: { status: "cited", sourceCitation: "Class notes" } }] });
  expect(text).toContain("You: What do ribosomes do?");
  expect(text).toContain("Rae: They assemble proteins.");
  expect(text).toContain("Source: Class notes");
});

it("downloads a plain-text transcript with a safe filename", () => {
  const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
  const create = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:transcript");
  const revoke = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
  downloadTranscript("Cell Biology!", "Transcript");
  expect(create).toHaveBeenCalled(); expect(click).toHaveBeenCalled(); expect(revoke).toHaveBeenCalledWith("blob:transcript");
});
