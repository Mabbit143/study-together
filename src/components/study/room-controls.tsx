"use client";

import { useState } from "react";
import { MaterialImport } from "@/components/materials/material-import";
import type { StudySessionController } from "@/features/study/use-study-session";

export function RoomControls({ study }: { study: StudySessionController }) {
  const [showFocus, setShowFocus] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [draftFocus, setDraftFocus] = useState(study.focusTopic);
  const [notice, setNotice] = useState("");
  return <section aria-labelledby="room-controls-heading" className="panel room-controls"><p className="eyebrow">Room controls</p><h2 id="room-controls-heading">Choose what happens next</h2><div className="study-actions"><button type="button" onClick={() => setShowFocus(value => !value)}>Select focus topic</button><button type="button" onClick={() => setShowUpload(value => !value)}>Upload more class materials</button></div>
    {showFocus && <form onSubmit={event => { event.preventDefault(); study.setFocusTopic(draftFocus); setNotice(draftFocus.trim() ? `The group will focus on ${draftFocus.trim()}.` : "The room focus was cleared."); setShowFocus(false); }}><label>Specific topic<input value={draftFocus} onChange={event => setDraftFocus(event.target.value)} /></label><button type="submit">Set room focus</button></form>}
    {study.focusTopic && <p><strong>Current focus:</strong> {study.focusTopic}</p>}
    {showUpload && <div className="room-upload"><h3>Upload additional class material</h3><p>The confirmed excerpt will be added to this room&apos;s current source.</p><MaterialImport onConfirm={material => { study.addMaterial(material); setShowUpload(false); setNotice(`${material.citation} was added to this room.`); }} /></div>}
    {notice && <p role="status">{notice}</p>}
  </section>;
}
