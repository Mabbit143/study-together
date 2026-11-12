"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { StudySession, StudyTurn, PeerId } from "./types";
import type { StudyTurnResponse } from "@/features/ai/turn-schema";
import { loadProfile, saveProfile, type OfflineStudyPackV1 } from "@/features/storage/local-store";
import { addToOutbox, removeFromOutbox } from "@/features/offline/connection-sync";
import { registerStudyServiceWorker } from "@/features/offline/service-worker";
import { demoTurn } from "@/features/ai/demo-engine";
import { defaultPeers } from "@/features/preferences/peer-preferences";
import { followBranch } from "@/features/offline/pack-runner";

export type SessionStatus = "empty" | "loading" | "success" | "offline-pack" | "offline-no-pack" | "waiting-for-connection" | "rate-limit" | "provider-error" | "storage-error" | "demo";

export function useStudySession(session: StudySession, initialOnline = true) {
  const initial = useMemo(() => typeof window === "undefined" ? null : loadProfile().profile, []);
  const initialPack = session.id === "imported-material" ? null : initial?.packs.find((pack) => pack.id === initial.activePackId) ?? (initial?.activePackId ? null : initial?.packs[0] ?? null);
  const initialConnection = typeof navigator === "undefined" ? initialOnline : initialOnline && navigator.onLine;
  const [profile, setProfile] = useState(initial);
  const [online, setOnlineState] = useState(initialConnection);
  const [input, setInput] = useState("");
  const [turns, setTurns] = useState(session.id === "old-english-demo" && !initialPack ? session.turns : []);
  const [activePeerId, setActivePeerId] = useState<PeerId>("jules");
  const [status, setStatus] = useState<SessionStatus>(initialConnection ? "success" : initialPack ? "offline-pack" : "offline-no-pack");
  const [boardNotes, setBoardNotes] = useState(initialPack?.board.notes ?? (session.id === "old-english-demo" ? session.board.notes : []));
  const [highlights, setHighlights] = useState(initialPack?.board.highlights ?? []);
  const [selectedTool, setSelectedToolState] = useState<"pointer" | "pen" | "sticky">(initialPack?.board.selectedTool ?? (session.id === "old-english-demo" ? session.board.selectedTool : "pointer"));
  const [activePack, setActivePack] = useState<OfflineStudyPackV1 | null>(initialPack);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const boardSaveNotice = activePack ? "Saved with this offline pack." : "Temporary board: prepare an offline pack to save it across reloads.";
  const activeRequest = useRef<AbortController | null>(null);
  const outbox = profile?.queuedQuestions ?? [];
  const highlight = highlights.at(-1) ?? "";
  const activeMaterial = activePack ? { title: activePack.title, excerpt: activePack.excerpt, citation: "Saved prepared offline study pack" } : session.material;

  useEffect(() => {
    void registerStudyServiceWorker();
    const applyConnection = (value: boolean) => { setOnlineState(value); setStatus(value ? "success" : activePack ? "offline-pack" : "offline-no-pack"); };
    const connected = () => applyConnection(true);
    const disconnected = () => applyConnection(false);
    window.addEventListener("online", connected);
    window.addEventListener("offline", disconnected);
    return () => { window.removeEventListener("online", connected); window.removeEventListener("offline", disconnected); };
  }, [activePack]);
  const persist = useCallback((next: NonNullable<typeof profile>) => { try { saveProfile(next); setProfile(next); return true; } catch { setStatus("storage-error"); return false; } }, []);
  function setOnline(value: boolean) { setOnlineState(value); setStatus(value ? "success" : activePack ? "offline-pack" : "offline-no-pack"); }
  const requestBody = (question: string, demo: boolean) => { const subject = activeMaterial.title.toLowerCase(); const memories = [...(profile?.memory.helpful ?? []), ...(profile?.memory.difficult ?? [])].filter((item) => (item.subjectTitle ?? "General study").toLowerCase() === subject || (item.subjectTitle ?? "General study") === "General study").slice(-8).map((item) => ({ id: item.id, text: item.text.slice(0, 300) })); return { sessionId: session.id, material: activeMaterial, peers: profile?.peers ?? defaultPeers, recentTurns: turns.slice(-8).map((turn) => ({ id: turn.id, peerId: turn.peerId, caption: turn.caption.slice(0, 1400), provenance: turn.provenance })), selectedMemories: memories, question: question.slice(0, 2000), speaker: activePeerId, demo }; };
  async function runTurn(question: string, demo = false) {
    setStatus("loading"); setCurrentQuestion(question); const controller = new AbortController(); activeRequest.current = controller;
    try {
      const response = await fetch("/api/study-turn", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(requestBody(question, demo)), signal: controller.signal });
      if (!response.ok) { if (activeRequest.current === controller) setStatus(response.status === 429 ? "rate-limit" : "provider-error"); return false; }
      const data = await response.json() as StudyTurnResponse;
      if (activeRequest.current !== controller) return false;
      const next: StudyTurn = { id: crypto.randomUUID(), peerId: data.speaker, caption: data.response, provenance: data.supportStatus === "supported" && data.citedExcerpt ? { status: "cited", sourceCitation: activeMaterial.citation } : { status: "general-knowledge" }, followUp: data.followUp, memorySuggestion: data.memorySuggestion, supportStatus: data.supportStatus };
      setTurns((items) => [...items, next]); if (data.citedExcerpt) setHighlight(data.citedExcerpt); if (data.boardAction?.type === "add-note") setBoardNotes((items) => [...items, data.boardAction!.text]);
      setInput((draft) => draft === question ? "" : draft); setStatus(demo ? "demo" : "success"); return true;
    } catch (error) { if (activeRequest.current === controller) setStatus((error as { name?: string }).name === "AbortError" ? "success" : "provider-error"); return false; }
    finally { if (activeRequest.current === controller) activeRequest.current = null; }
  }
  async function submitTurn() {
    if (!input.trim()) { setStatus("empty"); return; }
    if (!online) { if (profile && persist({ ...profile, queuedQuestions: addToOutbox(outbox, input, activePack?.id ?? null, activeMaterial.title) })) { setInput(""); setStatus("waiting-for-connection"); } return; }
    await runTurn(input);
  }
  async function useDemo() {
    const data = demoTurn(requestBody(input || "Give me another example.", true));
    const next: StudyTurn = { id: crypto.randomUUID(), peerId: data.speaker, caption: data.response, provenance: { status: "cited", sourceCitation: activeMaterial.citation }, followUp: data.followUp, memorySuggestion: data.memorySuggestion, supportStatus: data.supportStatus };
    setTurns((items) => [...items, next]); setHighlight(data.citedExcerpt ?? ""); setInput((draft) => draft ? "" : draft); setCurrentQuestion(input || "Give me another example."); setStatus("demo");
  }
  async function preparePack() {
    if (!online) { setStatus("offline-no-pack"); return; } setStatus("loading"); const controller = new AbortController(); activeRequest.current = controller;
    try { const response = await fetch("/api/offline-pack", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(requestBody(input || "Prepare offline study.", false)), signal: controller.signal }); if (!response.ok) throw new Error(); const generated = await response.json() as OfflineStudyPackV1; if (activeRequest.current !== controller) return; const pack = { ...generated, board: { ...generated.board, notes: [...boardNotes], highlights: [...highlights], selectedTool } }; const latest = loadProfile().profile; if (!persist({ ...latest, packs: [...latest.packs.filter((item) => item.id !== pack.id), pack], activePackId: pack.id })) return; setActivePack(pack); setStatus("success"); } catch (error) { if (activeRequest.current === controller) setStatus((error as { name?: string }).name === "AbortError" ? "success" : "provider-error"); } finally { if (activeRequest.current === controller) activeRequest.current = null; }
  }
  const sending = useRef(new Set<string>());
  async function sendQueued(id: string) { const item = outbox.find((question) => question.id === id); if (!item || !online || sending.current.has(id)) return; if (item.packId && item.packId !== activePack?.id) { selectPack(item.packId); setStatus("waiting-for-connection"); return; } sending.current.add(id); try { if (await runTurn(item.text)) { const latest = loadProfile().profile; persist({ ...latest, queuedQuestions: removeFromOutbox(latest.queuedQuestions, id) }); } } finally { sending.current.delete(id); } }
  function deleteQueued(id: string) { if (profile) persist({ ...profile, queuedQuestions: removeFromOutbox(outbox, id) }); }
  function updatePack(update: (pack: OfflineStudyPackV1) => OfflineStudyPackV1) {
    if (!activePack || !profile) return; const next = update(activePack); setActivePack(next); persist({ ...profile, packs: [...profile.packs.filter((item) => item.id !== next.id), next], activePackId: next.id });
  }
  function setHighlight(value: string) { if (!value) return; const next = [...highlights.filter((item) => item !== value), value]; setHighlights(next); updatePack((pack) => ({ ...pack, board: { ...pack.board, highlights: [...pack.board.highlights.filter((item) => item !== value), value] } })); }
  function setBoardNotesPersisted(notes: string[]) { setBoardNotes(notes); updatePack((pack) => ({ ...pack, board: { ...pack.board, notes } })); }
  function setSelectedTool(tool: "pointer" | "pen" | "sticky") { setSelectedToolState(tool); updatePack((pack) => ({ ...pack, board: { ...pack.board, selectedTool: tool } })); }
  function addBoardNote(note: string) { if (note.trim()) setBoardNotesPersisted([...boardNotes, note.trim()]); }
  function clearBoard() { setBoardNotes([]); setHighlights([]); setCurrentQuestion(""); updatePack((pack) => ({ ...pack, board: { ...pack.board, notes: [], highlights: [] } })); }
  function saveMemory(kind: "helpful" | "difficult", text: string) { if (profile && text.trim()) persist({ ...profile, memory: { ...profile.memory, [kind]: [...profile.memory[kind], { id: crypto.randomUUID(), text: text.trim().slice(0, 300), subjectTitle: activeMaterial.title }] } }); }
  function cancelTurn() { activeRequest.current?.abort(); activeRequest.current = null; setStatus("success"); }
  function activateSubject(pack: OfflineStudyPackV1) { setActivePack(pack); setTurns([]); setCurrentQuestion(""); setBoardNotes(pack.board.notes); setHighlights(pack.board.highlights); setSelectedToolState(pack.board.selectedTool); }
  function importPack(pack: OfflineStudyPackV1) { if (profile && !persist({ ...profile, packs: [...profile.packs.filter((item) => item.id !== pack.id), pack], activePackId: pack.id })) return; activateSubject(pack); setStatus(online ? "success" : "offline-pack"); }
  function selectPack(id: string) { const pack = profile?.packs.find((item) => item.id === id); if (!pack || !profile || !persist({ ...profile, activePackId: id })) return; activateSubject(pack); setStatus(online ? "success" : "offline-pack"); }
  function followOfflineBranch(id: string) { updatePack((pack) => followBranch(pack, id)); }
  function completePractice(id: string) { updatePack((pack) => ({ ...pack, progress: { ...pack.progress, completedPracticeIds: [...new Set([...pack.progress.completedPracticeIds, id])] } })); }
  return { session, activeMaterial, profile, online, setOnline, input, setInput, turns, currentQuestion, boardSaveNotice, activePeerId, setActivePeerId, status, boardNotes, setBoardNotes: setBoardNotesPersisted, addBoardNote, clearBoard, highlights, highlight, setHighlight, selectedTool, setSelectedTool, activePack, importPack, selectPack, followOfflineBranch, completePractice, outbox, submitTurn, cancelTurn, useDemo, preparePack, sendQueued, deleteQueued, saveMemory, setProfile: persist };
}

export type StudySessionController = ReturnType<typeof useStudySession>;
