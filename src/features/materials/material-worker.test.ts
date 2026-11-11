import { File as NodeFile } from "node:buffer";
import { afterEach, describe, expect, it, vi } from "vitest";
import { extractMaterial } from "./extract-text";

class FakeWorker {
  static instances: FakeWorker[] = [];
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: (() => void) | null = null;
  onmessageerror: (() => void) | null = null;
  terminate = vi.fn();
  postMessage = vi.fn();
  constructor() { FakeWorker.instances.push(this); }
}

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); FakeWorker.instances = []; });

describe("browser document processing", () => {
  it("terminates the worker on timeout, ignores late results, and allows another import", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("Worker", FakeWorker);
    const file = new NodeFile(["%PDF-fake"], "a.pdf", { type: "application/pdf" }) as unknown as File;
    const pending = extractMaterial(file);
    await vi.waitFor(() => expect(FakeWorker.instances).toHaveLength(1));
    const first = FakeWorker.instances[0];
    const rejected = expect(pending).rejects.toThrow(/timed out.*smaller file or paste/i);
    await vi.advanceTimersByTimeAsync(15_000);
    await rejected;
    expect(first.terminate).toHaveBeenCalledOnce();
    first.onmessage?.({ data: { result: { text: "late", warnings: [] } } } as MessageEvent);
    const next = extractMaterial(file);
    await vi.waitFor(() => expect(FakeWorker.instances).toHaveLength(2));
    FakeWorker.instances[1].onmessage?.({ data: { result: { text: "recovered", warnings: [] } } } as MessageEvent);
    await expect(next).resolves.toMatchObject({ text: "recovered" });
    expect(FakeWorker.instances[1].terminate).toHaveBeenCalledOnce();
  });
});
