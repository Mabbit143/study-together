"use client";
import { useState } from "react";
import type { StudySession } from "@/features/study/types";
import { useStudySession } from "@/features/study/use-study-session";
import { currentBranch, deterministicPractice, followBranch, searchExcerpt } from "@/features/offline/pack-runner";
import { PeerSettings } from "./peer-settings";
import { TurnComposer } from "./turn-composer";
import { SessionStatus } from "./session-status";
import { OfflineStatus } from "@/components/offline/offline-status";
import { PreparePack } from "@/components/offline/prepare-pack";
import { Outbox } from "@/components/offline/outbox";
import { downloadPack, parsePackFile } from "@/features/offline/pack-file";

export function StudyExperience({ session, initialOnline = true }: { session: StudySession; initialOnline?: boolean }) {
  const study = useStudySession(session, initialOnline); const [note, setNote] = useState(""); const [search, setSearch] = useState(""); const [localMessage, setLocalMessage] = useState("");
  const branch = study.activePack ? currentBranch(study.activePack) : null; const matches = searchExcerpt(session.material.excerpt, search);
  const activeTurn = study.turns.at(-1); const activeName = activeTurn && (study.profile?.peers[activeTurn.peerId].name ?? session.peers.find((peer) => peer.id === activeTurn.peerId)?.name);
  return <section aria-label="Interactive study session" className="integrated-flow">
    <SessionStatus status={study.status} /><OfflineStatus online={study.online} hasPack={Boolean(study.activePack)} />
    <div className="study-actions"><button type="button" onClick={() => study.setOnline(!study.online)}>{study.online ? "Simulate going offline" : "Reconnect"}</button><button type="button" onClick={() => void study.useDemo()}>Use reliable demo</button></div>
    <TurnComposer value={study.input} onChange={study.setInput} onSubmit={() => void study.submitTurn()} loading={study.status === "loading"} onCancel={study.cancelTurn} />
    {activeTurn && <section className="panel" aria-live="polite" aria-label="Current peer response"><h2>{activeName} is speaking</h2><p>{activeTurn.caption}</p><p>{activeTurn.provenance.status === "cited" ? `Grounded in ${activeTurn.provenance.sourceCitation}` : "General knowledge"}</p></section>}
    <section className="panel"><h2>Board and source tools</h2><label>Board note<input value={note} onChange={(event) => setNote(event.target.value)} /></label><button type="button" onClick={() => { study.addBoardNote(note); setNote(""); }}>Save board note</button><button type="button" onClick={() => { study.addBoardNote("Example: cwēn is the sentence subject."); setLocalMessage("Another example added to the board."); }}>Another example</button>{localMessage && <p role="status">{localMessage}</p>}<ul>{study.boardNotes.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul><label>Search confirmed excerpt<input value={search} onChange={(event) => setSearch(event.target.value)} /></label>{matches.map((match) => <button type="button" key={match} onClick={() => study.setHighlight(match)}>Highlight: {match}</button>)}{study.highlight && <mark>{study.highlight}</mark>}</section>
    <section className="panel"><h2>Peer controls</h2>{study.profile && session.peers.map((peer) => <div key={peer.id}><strong>{study.profile!.peers[peer.id].name}</strong><PeerSettings peerId={peer.id} preferences={study.profile!.peers[peer.id]} onChange={(value) => study.setProfile({ ...study.profile!, peers: { ...study.profile!.peers, [peer.id]: value } })} /></div>)}</section>
    <section className="panel"><h2>Remember for later</h2><button type="button" onClick={() => study.saveMemory("helpful", study.turns.at(-1)?.caption ?? "This explanation helped.")}>Save as helpful</button><button type="button" onClick={() => study.saveMemory("difficult", study.input || "This topic was difficult.")}>Practice this later</button></section>
    <section className="panel"><h2>Offline study</h2><PreparePack disabled={!study.online} onPrepare={() => void study.preparePack()} /><label>Import offline study pack<input type="file" accept="application/json,.json" onChange={(event) => { const file = event.currentTarget.files?.[0]; if (file) void file.text().then((text) => study.importPack(parsePackFile(text))).catch(() => setLocalMessage("That offline pack could not be validated.")); }} /></label>{branch && <div><button type="button" onClick={() => downloadPack(study.activePack!)}>Download offline study pack</button><h3>{branch.question}</h3><blockquote>{branch.sourceQuote}</blockquote><p>{branch.explanations[0]}</p><p>Hint: {branch.hints[0]}</p>{deterministicPractice(study.activePack!) && <p>Practice: {deterministicPractice(study.activePack!)!.prompt}</p>}{branch.followUpBranchIds.map((id) => <button key={id} type="button" onClick={() => study.setActivePack(followBranch(study.activePack!, id))}>Continue prepared path</button>)}</div>}</section>
    <Outbox items={study.outbox} online={study.online} onSend={(id) => void study.sendQueued(id)} onDelete={study.deleteQueued} />
  </section>;
}
