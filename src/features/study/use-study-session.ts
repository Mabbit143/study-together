"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { StudySession, StudyTurn, PeerId } from "./types";
import type { StudyTurnResponse } from "@/features/ai/turn-schema";
import { loadProfile, saveProfile, type OfflineStudyPackV1 } from "@/features/storage/local-store";
import { addToOutbox, removeFromOutbox } from "@/features/offline/connection-sync";
import { registerStudyServiceWorker } from "@/features/offline/service-worker";
import { demoTurn } from "@/features/ai/demo-engine";
import { defaultPeers } from "@/features/preferences/peer-preferences";

export type SessionStatus = "empty" | "loading" | "success" | "offline-pack" | "offline-no-pack" | "waiting-for-connection" | "rate-limit" | "provider-error" | "demo";

export function useStudySession(session: StudySession, initialOnline = true) {
  const initial = useMemo(() => typeof window === "undefined" ? null : loadProfile().profile, []);
  const [profile, setProfile] = useState(initial);
  const [online, setOnlineState] = useState(initialOnline);
  const [input, setInput] = useState("");
  const [turns, setTurns] = useState(session.turns);
  const [status, setStatus] = useState<SessionStatus>(initialOnline ? "success" : initial?.packs[0] ? "offline-pack" : "offline-no-pack");
  const [boardNotes, setBoardNotes] = useState(session.board.notes);
  const [highlight, setHighlight] = useState("");
  const [activePack, setActivePack] = useState<OfflineStudyPackV1 | null>(initial?.packs[0] ?? null);
  const activeRequest = useRef<AbortController | null>(null);
  const outbox = profile?.queuedQuestions ?? [];

  useEffect(() => { void registerStudyServiceWorker(); }, []);
  const persist = useCallback((next: NonNullable<typeof profile>) => { setProfile(next); saveProfile(next); }, []);
  function setOnline(value: boolean) { setOnlineState(value); setStatus(value ? "success" : activePack ? "offline-pack" : "offline-no-pack"); }
  const requestBody = (question: string, demo: boolean) => ({ sessionId: session.id, material: session.material, peers: profile?.peers ?? defaultPeers, recentTurns: turns.slice(-12), selectedMemories: [...(profile?.memory.helpful ?? []), ...(profile?.memory.difficult ?? [])], question, speaker: "jules" as PeerId, demo });
  async function runTurn(question: string, demo = false) {
    setStatus("loading"); const controller = new AbortController(); activeRequest.current = controller;
    try {
      const response = await fetch("/api/study-turn", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(requestBody(question, demo)), signal: controller.signal });
      if (!response.ok) { setStatus(response.status === 429 ? "rate-limit" : "provider-error"); return false; }
      const data = await response.json() as StudyTurnResponse;
      const next: StudyTurn = { id: crypto.randomUUID(), peerId: data.speaker, caption: data.response, provenance: data.citedExcerpt ? { status: "cited", sourceCitation: session.material.citation } : { status: "general-knowledge" } };
      setTurns((items) => [...items, next]); if (data.citedExcerpt) setHighlight(data.citedExcerpt); if (data.boardAction?.type === "add-note") setBoardNotes((notes) => [...notes, data.boardAction!.text]);
      setInput(""); setStatus(demo ? "demo" : "success"); return true;
    } catch (error) { setStatus((error as { name?: string }).name === "AbortError" ? "success" : "provider-error"); return false; }
    finally { if (activeRequest.current === controller) activeRequest.current = null; }
  }
  async function submitTurn() {
    if (!input.trim()) { setStatus("empty"); return; }
    if (!online) { if (profile) persist({ ...profile, queuedQuestions: addToOutbox(outbox, input) }); setInput(""); setStatus("waiting-for-connection"); return; }
    await runTurn(input);
  }
  async function useDemo() {
    const data = demoTurn(requestBody(input || "Give me another example.", true));
    const next: StudyTurn = { id: crypto.randomUUID(), peerId: data.speaker, caption: data.response, provenance: { status: "cited", sourceCitation: session.material.citation } };
    setTurns((items) => [...items, next]); setHighlight(data.citedExcerpt ?? ""); setInput(""); setStatus("demo");
  }
  async function preparePack() {
    if (!online) { setStatus("offline-no-pack"); return; } setStatus("loading");
    try { const response = await fetch("/api/offline-pack", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(requestBody(input || "Prepare offline study.", false)) }); if (!response.ok) throw new Error(); const pack = await response.json() as OfflineStudyPackV1; if (profile) persist({ ...profile, packs: [...profile.packs.filter((item) => item.id !== pack.id), pack] }); setActivePack(pack); setStatus("success"); } catch { setStatus("provider-error"); }
  }
  async function sendQueued(id: string) { const item = outbox.find((question) => question.id === id); if (!item || !online) return; if (await runTurn(item.text)) { const latest = loadProfile().profile; persist({ ...latest, queuedQuestions: removeFromOutbox(latest.queuedQuestions, id) }); } }
  function deleteQueued(id: string) { if (profile) persist({ ...profile, queuedQuestions: removeFromOutbox(outbox, id) }); }
  function addBoardNote(note: string) { if (note.trim()) setBoardNotes((notes) => [...notes, note.trim()]); }
  function saveMemory(kind: "helpful" | "difficult", text: string) { if (profile && text.trim()) persist({ ...profile, memory: { ...profile.memory, [kind]: [...profile.memory[kind], { id: crypto.randomUUID(), text: text.trim() }] } }); }
  function cancelTurn() { activeRequest.current?.abort(); activeRequest.current = null; setStatus("success"); }
  function importPack(pack: OfflineStudyPackV1) { if (profile) persist({ ...profile, packs: [...profile.packs.filter((item) => item.id !== pack.id), pack] }); setActivePack(pack); setStatus(online ? "success" : "offline-pack"); }
  return { session, profile, online, setOnline, input, setInput, turns, status, boardNotes, addBoardNote, highlight, setHighlight, activePack, setActivePack, importPack, outbox, submitTurn, cancelTurn, useDemo, preparePack, sendQueued, deleteQueued, saveMemory, setProfile: persist };
}
