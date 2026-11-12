import { afterEach, describe, expect, it, vi } from "vitest";
const pdf = vi.hoisted(() => ({
  GlobalWorkerOptions: { workerSrc: "" },
  PDFWorker: { create: vi.fn(() => ({ destroy: vi.fn() })) },
  getDocument: vi.fn(() => ({ promise: Promise.resolve({ numPages: 0 }), destroy: vi.fn() })),
}));
vi.mock("pdfjs-dist/legacy/build/pdf.mjs", () => pdf);
import { extractPdf } from "./extract-pdf";

afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); });

describe("PDF browser worker configuration", () => {
  it("sets a PDF.js worker URL before opening a PDF", async () => {
    pdf.getDocument.mockImplementationOnce(() => {
      expect(pdf.GlobalWorkerOptions.workerSrc).toContain("pdf.worker.min.mjs");
      return { promise: Promise.resolve({ numPages: 0 }), destroy: vi.fn() };
    });
    await extractPdf({ arrayBuffer: async () => new ArrayBuffer(0) } as File);
    expect(pdf.getDocument).toHaveBeenCalled();
  });
  it("supplies and closes a nested PDF worker when running inside a worker", async () => {
    const terminate = vi.fn();
    const WorkerStub = vi.fn(class { terminate = terminate; });
    vi.stubGlobal("importScripts", vi.fn());
    vi.stubGlobal("Worker", WorkerStub);
    await extractPdf({ arrayBuffer: async () => new ArrayBuffer(0) } as File);
    expect(WorkerStub).toHaveBeenCalledWith(expect.stringContaining("pdf.worker.min.mjs"), { type: "module" });
    expect(pdf.PDFWorker.create).toHaveBeenCalledWith({ port: expect.any(WorkerStub) });
    expect(terminate).toHaveBeenCalledOnce();
  });
  it("explains how to recover from a password-protected PDF", async () => {
    pdf.getDocument.mockImplementationOnce(() => { throw new Error("Password required"); });
    await expect(extractPdf({ arrayBuffer: async () => new ArrayBuffer(0) } as File))
      .rejects.toThrow(/encrypted.*Remove its password/i);
  });
});
