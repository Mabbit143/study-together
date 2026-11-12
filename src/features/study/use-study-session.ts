"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { StudyMaterial, StudySession, StudyTurn, PeerId } from "./types";
import type { StudyTurnResponse } from "@/features/ai/turn-schema";
import { loadProfile, saveProfile, type OfflineStudyPackV1, type StudyProfileV1 } from "@/features/storage/local-store";
import { addToOutbox, removeFromOutbox } from "@/features/offline/connection-sync";
import { registerStudyServiceWorker } from "@/features/offline/service-worker";
import { demoTurn } from "@/features/ai/demo-engine";
import { defaultPeers } from "@/features/preferences/peer-preferences";
import { followBranch } from "@/features/offline/pack-runner";

export type SessionStatus = "empty" | "loading" | "success" | "offline-pack" | "offline-no-pack" | "waiting-for-connection" | "rate-limit" | "provider-error" | "storage-error" | "demo";
type BoardTool = "pointer" | "pen" | "sticky";

export function useStudySession(session: StudySession, initialOnline = true) {
  const initial = useMemo(() => typeof window === "undefined" ? null : loadProfile().profile, []);
  const initialPack = session.id === "imported-material" ? null : initial?.packs.find((pack) => pack.id === initial.activePackId) ?? (initial?.activePackId ? null : initial?.packs[0] ?? null);
  const initialConnection = typeof navigator === "undefined" ? initialOnline : initialOnline && navigator.onLine;
  const [profile, setProfileState] = useState(initial);
  const [online, setOnlineState] = useState(initialConnection);
  const [input, setInputState] = useState("");
  const [turns, setTurns] = useState(session.id === "old-english-demo" && !initialPack ? session.turns : []);
  const [activePeerId, setActivePeerId] = useState<PeerId>("jules");
  const [status, setStatus] = useState<SessionStatus>(initialConnection ? "success" : initialPack ? "offline-pack" : "offline-no-pack");
  const [boardNotes, setBoardNotesState] = useState(initialPack?.board.notes ?? (session.id === "old-english-demo" ? session.board.notes : []));
  const [highlights, setHighlights] = useState(initialPack?.board.highlights ?? []);
  const [penMarks, setPenMarks] = useState(initialPack?.board.penMarks ?? session.board.penMarks ?? []);
  const [selectedTool, setSelectedToolState] = useState<BoardTool>(initialPack?.board.selectedTool ?? (session.id === "old-english-demo" ? session.board.selectedTool : "pointer"));
  const [activePack, setActivePack] = useState<OfflineStudyPackV1 | null>(initialPack);
  const [materialOverride, setMaterialOverride] = useState<StudyMaterial>(session.material);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [boardPersisted, setBoardPersisted] = useState(Boolean(initialPack));
  const activeRequest = useRef<AbortController | null>(null);
  const contextEpoch = useRef(0);
  const sending = useRef(new Set<string>());

  const profileRef = useRef(profile); profileRef.current = profile;
  const turnsRef = useRef(turns); turnsRef.current = turns;
  const activePackRef = useRef(activePack); activePackRef.current = activePack;
  const notesRef = useRef(boardNotes); notesRef.current = boardNotes;
  const highlightsRef = useRef(highlights); highlightsRef.current = highlights;
  const penMarksRef = useRef(penMarks); penMarksRef.current = penMarks;
  const toolRef = useRef(selectedTool); toolRef.current = selectedTool;
  const inputRef = useRef(input); inputRef.current = input;
  const activeMaterial = activePack ? { title: activePack.title, excerpt: activePack.excerpt, citation: "Saved prepared offline study pack" } : materialOverride;
  const subjectIdentity = activePack ? `pack:${activePack.id}` : `material:${activeMaterial.citation}\u0000${activeMaterial.excerpt}`;
  const materialRef = useRef(activeMaterial); materialRef.current = activeMaterial;
  const outbox = profile?.queuedQuestions ?? [];
  const highlight = highlights.at(-1) ?? "";
  const boardSaveNotice = activePack ? boardPersisted ? "Saved with this offline pack." : "Not saved on this device yet. Your visible board is preserved; free storage and try another edit." : "Temporary board: prepare an offline pack to save it across reloads.";

  useEffect(() => {
    void registerStudyServiceWorker();
    const applyConnection = (value: boolean) => { setOnlineState(value); setStatus(value ? "success" : activePackRef.current ? "offline-pack" : "offline-no-pack"); };
    const connected = () => applyConnection(true); const disconnected = () => applyConnection(false);
    window.addEventListener("online", connected); window.addEventListener("offline", disconnected);
    return () => { window.removeEventListener("online", connected); window.removeEventListener("offline", disconnected); activeRequest.current?.abort(); };
  }, []);

  const persist = useCallback((next: StudyProfileV1) => {
    try { saveProfile(next); profileRef.current = next; setProfileState(next); return true; }
    catch { setStatus("storage-error"); return false; }
  }, []);
  function setProfile(next: StudyProfileV1) { return persist(next); }
  function setInput(value: string) { inputRef.current = value; setInputState(value); }
  function setOnline(value: boolean) { setOnlineState(value); setStatus(value ? "success" : activePackRef.current ? "offline-pack" : "offline-no-pack"); }
  function invalidateActiveWork() { contextEpoch.current += 1; activeRequest.current?.abort(); activeRequest.current = null; }
  function requestBody(question: string, demo: boolean, material = materialRef.current) {
    const subject = material.title.toLowerCase();
    const memories = [...(profileRef.current?.memory.helpful ?? []), ...(profileRef.current?.memory.difficult ?? [])].filter((item) => (item.subjectTitle ?? "General study").toLowerCase() === subject || (item.subjectTitle ?? "General study") === "General study").slice(-8).map((item) => ({ id: item.id, text: item.text.slice(0, 300) }));
    return { sessionId: session.id, material, peers: profileRef.current?.peers ?? defaultPeers, recentTurns: turnsRef.current.slice(-8).map((turn) => ({ id: turn.id, peerId: turn.peerId, caption: turn.caption.slice(0, 1400), provenance: turn.provenance })), selectedMemories: memories, question: question.slice(0, 2000), speaker: activePeerId, demo };
  }
  function currentProfileWithPack(next: OfflineStudyPackV1) {
    const latest = profileRef.current ?? loadProfile().profile;
    return { ...latest, packs: [...latest.packs.filter((item) => item.id !== next.id), next], activePackId: next.id };
  }
  function updatePack(update: (pack: OfflineStudyPackV1) => OfflineStudyPackV1) {
    const current = activePackRef.current; if (!current) return false;
    const next = update(current); activePackRef.current = next; setActivePack(next);
    const saved = persist(currentProfileWithPack(next)); setBoardPersisted(saved); return saved;
  }
  function setHighlight(value: string) {
    if (!value) return;
    const next = [...highlightsRef.current.filter((item) => item !== value), value]; highlightsRef.current = next; setHighlights(next); updatePack((pack) => ({ ...pack, board: { ...pack.board, highlights: next } }));
  }
  function setBoardNotesPersisted(notes: string[]) { notesRef.current = notes; setBoardNotesState(notes); updatePack((pack) => ({ ...pack, board: { ...pack.board, notes } })); }
  function addBoardNote(note: string) { const clean = note.trim(); if (!clean) return; const next = [...notesRef.current, clean]; notesRef.current = next; setBoardNotesState(next); updatePack((pack) => ({ ...pack, board: { ...pack.board, notes: next } })); }
  function setSelectedTool(tool: BoardTool) { toolRef.current = tool; setSelectedToolState(tool); updatePack((pack) => ({ ...pack, board: { ...pack.board, selectedTool: tool } })); }
  function setPenMarksPersisted(marks: string[]) { penMarksRef.current = marks; setPenMarks(marks); updatePack((pack) => ({ ...pack, board: { ...pack.board, penMarks: marks } })); }

  async function runTurn(question: string, demo = false, material = materialRef.current) {
    setStatus("loading"); setCurrentQuestion(question); const controller = new AbortController(); activeRequest.current?.abort(); activeRequest.current = controller; const epoch = contextEpoch.current;
    try {
      const response = await fetch("/api/study-turn", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(requestBody(question, demo, material)), signal: controller.signal });
      if (!response.ok) { if (activeRequest.current === controller) setStatus(response.status === 429 ? "rate-limit" : "provider-error"); return false; }
      const data = await response.json() as StudyTurnResponse; if (activeRequest.current !== controller || contextEpoch.current !== epoch) return false;
      const next: StudyTurn = { id: crypto.randomUUID(), peerId: data.speaker, caption: data.response, provenance: data.supportStatus === "supported" && data.citedExcerpt ? { status: "cited", sourceCitation: material.citation } : { status: "general-knowledge" }, followUp: data.followUp, memorySuggestion: data.memorySuggestion, supportStatus: data.supportStatus };
      setTurns((items) => { const updated = [...items, next]; turnsRef.current = updated; return updated; }); if (data.citedExcerpt) setHighlight(data.citedExcerpt); if (data.boardAction?.type === "add-note") addBoardNote(data.boardAction.text);
      setInputState((draft) => draft === question ? "" : draft); setStatus(demo ? "demo" : "success"); return true;
    } catch (error) { if (activeRequest.current === controller) setStatus((error as { name?: string }).name === "AbortError" ? "success" : "provider-error"); return false; }
    finally { if (activeRequest.current === controller) activeRequest.current = null; }
  }
  async function submitTurn() {
    const question = inputRef.current;
    if (!question.trim()) { setStatus("empty"); return; }
    if (!online) { const current = profileRef.current; if (current && persist({ ...current, queuedQuestions: addToOutbox(current.queuedQuestions, question, activePackRef.current?.id ?? null, materialRef.current) })) { setInput(""); setStatus("waiting-for-connection"); } return; }
    await runTurn(question);
  }
  async function useDemo() {
    const question = inputRef.current || "Give me another example."; const material = materialRef.current; const data = demoTurn(requestBody(question, true, material));
    const next: StudyTurn = { id: crypto.randomUUID(), peerId: data.speaker, caption: data.response, provenance: { status: "cited", sourceCitation: material.citation }, followUp: data.followUp, memorySuggestion: data.memorySuggestion, supportStatus: data.supportStatus };
    setTurns((items) => { const updated = [...items, next]; turnsRef.current = updated; return updated; }); setHighlight(data.citedExcerpt ?? ""); setInput(""); setCurrentQuestion(question); setStatus("demo");
  }
  async function preparePack() {
    if (!online) { setStatus("offline-no-pack"); return; }
    setStatus("loading"); const controller = new AbortController(); activeRequest.current?.abort(); activeRequest.current = controller; const epoch = contextEpoch.current;
    try {
      const response = await fetch("/api/offline-pack", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(requestBody(inputRef.current || "Prepare offline study.", false)), signal: controller.signal });
      if (!response.ok) throw new Error(); const generated = await response.json() as OfflineStudyPackV1; if (activeRequest.current !== controller || contextEpoch.current !== epoch) return;
      const pack = { ...generated, board: { ...generated.board, notes: [...notesRef.current], highlights: [...highlightsRef.current], penMarks: [...penMarksRef.current], selectedTool: toolRef.current } };
      if (!persist(currentProfileWithPack(pack))) { setBoardPersisted(false); return; }
      activePackRef.current = pack; setActivePack(pack); setBoardPersisted(true); setStatus("success");
    } catch (error) { if (activeRequest.current === controller) setStatus((error as { name?: string }).name === "AbortError" ? "success" : "provider-error"); }
    finally { if (activeRequest.current === controller) activeRequest.current = null; }
  }
  async function sendQueued(id: string) {
    const item = profileRef.current?.queuedQuestions.find((question) => question.id === id); if (!item || !online || sending.current.has(id)) return;
    let origin = materialRef.current;
    if (item.packId && item.packId !== activePackRef.current?.id) { selectPack(item.packId); setStatus("waiting-for-connection"); return; }
    if (!item.packId && item.material) { origin = item.material; if (origin.title !== materialRef.current.title || origin.excerpt !== materialRef.current.excerpt) activateMaterial(origin); }
    sending.current.add(id); try { if (await runTurn(item.text, false, origin)) { const latest = loadProfile().profile; persist({ ...latest, queuedQuestions: removeFromOutbox(latest.queuedQuestions, id) }); } } finally { sending.current.delete(id); }
  }
  function deleteQueued(id: string) { const current = profileRef.current; if (current) persist({ ...current, queuedQuestions: removeFromOutbox(current.queuedQuestions, id) }); }
  function clearBoard() { notesRef.current = []; highlightsRef.current = []; penMarksRef.current = []; setBoardNotesState([]); setHighlights([]); setPenMarks([]); setCurrentQuestion(""); updatePack((pack) => ({ ...pack, board: { ...pack.board, notes: [], highlights: [], penMarks: [] } })); }
  function saveMemory(kind: "helpful" | "difficult", text: string) { const current = profileRef.current; if (current && text.trim()) persist({ ...current, memory: { ...current.memory, [kind]: [...current.memory[kind], { id: crypto.randomUUID(), text: text.trim().slice(0, 300), subjectTitle: materialRef.current.title }] } }); }
  function cancelTurn() { invalidateActiveWork(); setStatus("success"); }
  function applyMaterial(material: StudyMaterial) { setMaterialOverride(material); materialRef.current = material; activePackRef.current = null; setActivePack(null); turnsRef.current = []; setTurns([]); setCurrentQuestion(""); notesRef.current = []; highlightsRef.current = []; penMarksRef.current = []; setBoardNotesState([]); setHighlights([]); setPenMarks([]); toolRef.current = "pointer"; setSelectedToolState("pointer"); setBoardPersisted(false); }
  function applySubject(pack: OfflineStudyPackV1) { activePackRef.current = pack; setActivePack(pack); materialRef.current = { title: pack.title, excerpt: pack.excerpt, citation: "Saved prepared offline study pack" }; turnsRef.current = []; setTurns([]); setCurrentQuestion(""); notesRef.current = pack.board.notes; highlightsRef.current = pack.board.highlights; penMarksRef.current = pack.board.penMarks ?? []; toolRef.current = pack.board.selectedTool; setBoardNotesState(pack.board.notes); setHighlights(pack.board.highlights); setPenMarks(pack.board.penMarks ?? []); setSelectedToolState(pack.board.selectedTool); setBoardPersisted(true); }
  function activateMaterial(material: StudyMaterial) { invalidateActiveWork(); applyMaterial(material); setStatus(online ? "success" : "offline-no-pack"); }
  function activateSubject(pack: OfflineStudyPackV1) { invalidateActiveWork(); applySubject(pack); setStatus(online ? "success" : "offline-pack"); }
  function importPack(pack: OfflineStudyPackV1) { invalidateActiveWork(); const current = profileRef.current; if (current && !persist({ ...current, packs: [...current.packs.filter((item) => item.id !== pack.id), pack], activePackId: pack.id })) return; applySubject(pack); setStatus(online ? "success" : "offline-pack"); }
  function selectPack(id: string) { invalidateActiveWork(); const current = profileRef.current; const pack = current?.packs.find((item) => item.id === id); if (!pack || !current || !persist({ ...current, activePackId: id })) return; applySubject(pack); setStatus(online ? "success" : "offline-pack"); }
  function followOfflineBranch(id: string) { updatePack((pack) => followBranch(pack, id)); }
  function completePractice(id: string) { updatePack((pack) => ({ ...pack, progress: { ...pack.progress, completedPracticeIds: [...new Set([...pack.progress.completedPracticeIds, id])] } })); }
  return { session, activeMaterial, subjectIdentity, profile, online, setOnline, input, setInput, turns, currentQuestion, boardSaveNotice, activePeerId, setActivePeerId, status, boardNotes, setBoardNotes: setBoardNotesPersisted, addBoardNote, clearBoard, highlights, highlight, setHighlight, penMarks, setPenMarks: setPenMarksPersisted, selectedTool, setSelectedTool, activePack, activateMaterial, activateSubject, importPack, selectPack, followOfflineBranch, completePractice, outbox, submitTurn, cancelTurn, useDemo, preparePack, sendQueued, deleteQueued, saveMemory, setProfile };
}

export type StudySessionController = ReturnType<typeof useStudySession>;
