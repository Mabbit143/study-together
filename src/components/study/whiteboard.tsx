"use client";

import { useState } from "react";

import type { BoardState } from "@/features/study/types";

type WhiteboardProps = {
  board: BoardState;
};

const tools = [
  { id: "pointer", label: "Pointer" },
  { id: "pen", label: "Pen" },
  { id: "sticky", label: "Sticky note" },
] as const;

export function Whiteboard({ board }: WhiteboardProps) {
  const [selectedTool, setSelectedTool] = useState(board.selectedTool);
  const [notes, setNotes] = useState(board.notes);

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
              aria-pressed={selectedTool === tool.id}
              className="tool-button"
              key={tool.id}
              onClick={() => setSelectedTool(tool.id)}
              type="button"
            >
              {tool.label}
            </button>
          ))}
          <button className="tool-button danger" onClick={() => setNotes([])} type="button">
            Clear board
          </button>
        </div>
      </div>
      <div className="board-surface">
        {notes.length > 0 ? (
          notes.map((note) => (
            <p className="sticky-note" key={note}>
              {note}
            </p>
          ))
        ) : (
          <p className="empty-board">Board cleared. Choose a tool to add your next thought.</p>
        )}
      </div>
    </section>
  );
}
