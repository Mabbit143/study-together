"use client";

import { useEffect, useRef, useState } from "react";

import type { BoardState } from "@/features/study/types";

type WhiteboardProps = {
  board: BoardState;
  onNotesChange?: (notes: string[]) => void;
  onSelectedToolChange?: (tool: BoardState["selectedTool"]) => void;
  onPenMarksChange?: (marks: string[]) => void;
  onClear?: () => void;
  currentTask?: string;
};

const tools = [
  { id: "pointer", label: "Pointer" },
  { id: "pen", label: "Pen" },
  { id: "sticky", label: "Sticky note" },
] as const;

export function Whiteboard({ board, onNotesChange, onSelectedToolChange, onPenMarksChange, onClear, currentTask }: WhiteboardProps) {
  const [selectedTool, setSelectedTool] = useState(board.selectedTool);
  const [notes, setNotes] = useState(board.notes);
  const [confirmClear, setConfirmClear] = useState(false);
  const noteInput = useRef<HTMLInputElement>(null);
  const visibleNotes = onNotesChange ? board.notes : notes;
  const visibleTool = onSelectedToolChange ? board.selectedTool : selectedTool;
  const visibleMarks = board.penMarks ?? [];
  useEffect(() => { if (visibleTool === "sticky") noteInput.current?.focus(); }, [visibleTool]);

  return (
    <section aria-labelledby="board-heading" className="panel whiteboard">
      <div className="section-heading board-heading">
        <div>
          <p className="eyebrow">Shared space</p>
          <h2 id="board-heading">Working board</h2>
        </div>
        <div aria-label="Whiteboard tools" className="board-tools">
          {tools.map((tool) => (
            <button
              aria-pressed={visibleTool === tool.id}
              className="tool-button"
              key={tool.id}
              onClick={() => { setSelectedTool(tool.id); onSelectedToolChange?.(tool.id); }}
              type="button"
            >
              {tool.label}
            </button>
          ))}
          <button className="tool-button danger" onClick={() => { if (onClear && !confirmClear) { setConfirmClear(true); return; } if (onClear) onClear(); else { setNotes([]); onNotesChange?.([]); onPenMarksChange?.([]); } setConfirmClear(false); }} type="button">
            {confirmClear ? "Confirm clear board" : "Clear board"}
          </button>
        </div>
      </div>
      {board.highlights?.length ? <div aria-label="Grounded source highlights"><h3>Grounded highlights</h3>{board.highlights.map((value) => <mark key={value}>{value}</mark>)}</div> : null}
      {currentTask ? <div aria-label="Current study task"><h3>Current question</h3><p>{currentTask}</p></div> : null}
      <div className="board-surface">
        {visibleNotes.length > 0 ? (
          visibleNotes.map((note) => (
            <p className="sticky-note" key={note}>
              {note}
            </p>
          ))
        ) : (
          <p className="empty-board">Board cleared. Choose a tool to add your next thought.</p>
        )}
        {visibleMarks.map((mark, index) => <p className="pen-mark" key={`${mark}-${index}`}>Pen mark: {mark}</p>)}
      </div>
      {visibleTool === "pointer" && <p>Pointer mode lets you review and select board items without editing them.</p>}
      {visibleTool === "pen" && <div aria-label="Pen controls"><h3>Pen controls</h3><form onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); const mark = String(form.get("mark") ?? "").trim(); if (mark) { onPenMarksChange?.([...visibleMarks, mark]); event.currentTarget.reset(); } }}><label>Pen mark<input name="mark" /></label><button type="submit">Add pen mark</button></form><button type="button" disabled={!visibleMarks.length} onClick={() => onPenMarksChange?.(visibleMarks.slice(0, -1))}>Undo pen mark</button></div>}
      {onNotesChange && visibleTool === "sticky" && <form onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); const note = String(form.get("note") ?? "").trim(); if (note) { const next = [...visibleNotes, note]; onNotesChange(next); event.currentTarget.reset(); } }}><label>Add board note<input ref={noteInput} name="note" /></label><button type="submit">Save board note</button></form>}
    </section>
  );
}
