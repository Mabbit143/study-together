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

export type SessionStatus = "empty" | "loading" | "success" | "offline-pack" | "offline-no-pack" | "waiting-for-connection" | "rate-limit" | "provider-error" | "demo";

export function useStudySession(session: StudySession, initialOnline = true) {
  const initial = useMemo(() => typeof window === "undefined" ? null : loadProfile().profile, []);
  const [profile, setProfile] = useState(initial);
  const [online, setOnlineState] = useState(initialOnline);
  const [input, setInput] = useState("");
  const [turns, setTurns] = useState(session.turns);
  const [status, setStatus] = useState<SessionStatus>(initialOnline ? "success" : initial?.packs[0] ? "offline-pack" : "offline-no-pack");
  const [boardNotes, setBoardNotes] = useState(initial?.packs[0]?.board.notes ?? session.board.notes);
  const [highlight, setHighlightState] = useState(initial?.packs[0]?.board.highlights.at(-1) ?? "");
  const [activePack, setActivePack] = useState<OfflineStudyPackV1 | null>(initial?.packs[0] ?? null);
  const activeRequest = useRef<AbortController | null>(null);
  const outbox = profile?.queuedQuestions ?? [];
  const activeMaterial = activePack ? { title: activePack.title, excerpt: activePack.excerpt, citation: "Saved prepared offline study pack" } : session.material;

  useEffect(() => { void registerStudyServiceWorker(); }, []);
  const persist = useCallback((next: NonNullable<typeof profile>) => { setProfile(next); saveProfile(next); }, []);
  function setOnline(value: boolean) { setOnlineState(value); setStatus(value ? "success" : activePack ? "offline-pack" : "offline-no-pack"); }
  const requestBody = (question: string, demo: boolean) => ({ sessionId: session.id, material: activeMaterial, peers: profile?.peers ?? defaultPeers, recentTurns: turns.slice(-12), selectedMemories: [...(profile?.memory.helpful ?? []), ...(profile?.memory.difficult ?? [])], question, speaker: "jules" as PeerId, demo });
  async function runTurn(question: string, demo = false) {
    setStatus("loading"); const controller = new AbortController(); activeRequest.current = controller;
    try {
      const response = await fetch("/api/study-turn", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(requestBody(question, demo)), signal: controller.signal });
      if (!response.ok) { if (activeRequest.current === controller) setStatus(response.status === 429 ? "rate-limit" : "provider-error"); return false; }
      const data = await response.json() as StudyTurnResponse;
      if (activeRequest.current !== controller) return false;
      const next: StudyTurn = { id: crypto.randomUUID(), peerId: data.speaker, caption: data.response, provenance: data.citedExcerpt ? { status: "cited", sourceCitation: activeMaterial.citation } : { status: "general-knowledge" } };
      setTurns((items) => [...items, next]); if (data.citedExcerpt) setHighlight(data.citedExcerpt); if (data.boardAction?.type === "add-note") setBoardNotesPersisted([...boardNotes, data.boardAction.text]);
      setInput(""); setStatus(demo ? "demo" : "success"); return true;
    } catch (error) { if (activeRequest.current === controller) setStatus((error as { name?: string }).name === "AbortError" ? "success" : "provider-error"); return false; }
    finally { if (activeRequest.current === controller) activeRequest.current = null; }
  }
  async function submitTurn() {
    if (!input.trim()) { setStatus("empty"); return; }
    if (!online) { if (profile) persist({ ...profile, queuedQuestions: addToOutbox(outbox, input) }); setInput(""); setStatus("waiting-for-connection"); return; }
    await runTurn(input);
  }
  async function useDemo() {
    const data = demoTurn(requestBody(input || "Give me another example.", true));
    const next: StudyTurn = { id: crypto.randomUUID(), peerId: data.speaker, caption: data.response, provenance: { status: "cited", sourceCitation: activeMaterial.citation } };
    setTurns((items) => [...items, next]); setHighlight(data.citedExcerpt ?? ""); setInput(""); setStatus("demo");
  }
  async function preparePack() {
    if (!online) { setStatus("offline-no-pack"); return; } setStatus("loading");
    try { const response = await fetch("/api/offline-pack", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(requestBody(input || "Prepare offline study.", false)) }); if (!response.ok) throw new Error(); const pack = await response.json() as OfflineStudyPackV1; if (profile) persist({ ...profile, packs: [...profile.packs.filter((item) => item.id !== pack.id), pack] }); setActivePack(pack); setBoardNotes(pack.board.notes); setHighlightState(pack.board.highlights.at(-1) ?? ""); setStatus("success"); } catch { setStatus("provider-error"); }
  }
  async function sendQueued(id: string) { const item = outbox.find((question) => question.id === id); if (!item || !online) return; if (await runTurn(item.text)) { const latest = loadProfile().profile; persist({ ...latest, queuedQuestions: removeFromOutbox(latest.queuedQuestions, id) }); } }
  function deleteQueued(id: string) { if (profile) persist({ ...profile, queuedQuestions: removeFromOutbox(outbox, id) }); }
  function updatePack(update: (pack: OfflineStudyPackV1) => OfflineStudyPackV1) {
    if (!activePack || !profile) return; const next = update(activePack); setActivePack(next); persist({ ...profile, packs: [...profile.packs.filter((item) => item.id !== next.id), next] });
  }
  function setHighlight(value: string) { setHighlightState(value); if (value) updatePack((pack) => ({ ...pack, board: { ...pack.board, highlights: [...pack.board.highlights.filter((item) => item !== value), value] } })); }
  function setBoardNotesPersisted(notes: string[]) { setBoardNotes(notes); updatePack((pack) => ({ ...pack, board: { ...pack.board, notes } })); }
  function addBoardNote(note: string) { if (note.trim()) setBoardNotesPersisted([...boardNotes, note.trim()]); }
  function saveMemory(kind: "helpful" | "difficult", text: string) { if (profile && text.trim()) persist({ ...profile, memory: { ...profile.memory, [kind]: [...profile.memory[kind], { id: crypto.randomUUID(), text: text.trim() }] } }); }
  function cancelTurn() { activeRequest.current?.abort(); activeRequest.current = null; setStatus("success"); }
  function importPack(pack: OfflineStudyPackV1) { if (profile) persist({ ...profile, packs: [...profile.packs.filter((item) => item.id !== pack.id), pack] }); setActivePack(pack); setBoardNotes(pack.board.notes); setHighlightState(pack.board.highlights.at(-1) ?? ""); setStatus(online ? "success" : "offline-pack"); }
  function followOfflineBranch(id: string) { updatePack((pack) => followBranch(pack, id)); }
  function completePractice(id: string) { updatePack((pack) => ({ ...pack, progress: { ...pack.progress, completedPracticeIds: [...new Set([...pack.progress.completedPracticeIds, id])] } })); }
  return { session, activeMaterial, profile, online, setOnline, input, setInput, turns, status, boardNotes, setBoardNotes: setBoardNotesPersisted, addBoardNote, highlight, setHighlight, activePack, setActivePack, importPack, followOfflineBranch, completePractice, outbox, submitTurn, cancelTurn, useDemo, preparePack, sendQueued, deleteQueued, saveMemory, setProfile: persist };
}

export type StudySessionController = ReturnType<typeof useStudySession>;
