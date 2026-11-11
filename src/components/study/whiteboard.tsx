"use client";

import { useState } from "react";

import type { BoardState } from "@/features/study/types";

type WhiteboardProps = {
  board: BoardState;
  onNotesChange?: (notes: string[]) => void;
  onSelectedToolChange?: (tool: BoardState["selectedTool"]) => void;
};

const tools = [
  { id: "pointer", label: "Pointer" },
  { id: "pen", label: "Pen" },
  { id: "sticky", label: "Sticky note" },
] as const;

export function Whiteboard({ board, onNotesChange, onSelectedToolChange }: WhiteboardProps) {
  const [selectedTool, setSelectedTool] = useState(board.selectedTool);
  const [notes, setNotes] = useState(board.notes);
  const visibleNotes = onNotesChange ? board.notes : notes;
  const visibleTool = onSelectedToolChange ? board.selectedTool : selectedTool;

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
          <button className="tool-button danger" onClick={() => { setNotes([]); onNotesChange?.([]); }} type="button">
            Clear board
          </button>
        </div>
      </div>
      {board.highlights?.length ? <div aria-label="Grounded source highlights"><h3>Grounded highlights</h3>{board.highlights.map((value) => <mark key={value}>{value}</mark>)}</div> : null}
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
      </div>
      {onNotesChange && <form onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); const note = String(form.get("note") ?? "").trim(); if (note) { const next = [...visibleNotes, note]; onNotesChange(next); event.currentTarget.reset(); } }}><label>Add board note<input name="note" /></label><button type="submit">Save board note</button></form>}
    </section>
  );
}
