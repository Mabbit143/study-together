"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

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

type Point = { x: number; y: number };
const DRAWING_PREFIX = "drawing:";

function readDrawing(mark: string): Point[] | null {
  if (!mark.startsWith(DRAWING_PREFIX)) return null;
  try {
    const points = JSON.parse(mark.slice(DRAWING_PREFIX.length));
    return Array.isArray(points) && points.every((point) => Number.isFinite(point?.x) && Number.isFinite(point?.y)) ? points : null;
  } catch {
    return null;
  }
}

function pointOnBoard(event: ReactPointerEvent<HTMLDivElement>): Point {
  const rect = event.currentTarget.getBoundingClientRect();
  return {
    x: Math.max(0, Math.min(100, ((event.clientX - rect.left) / Math.max(rect.width, 1)) * 100)),
    y: Math.max(0, Math.min(100, ((event.clientY - rect.top) / Math.max(rect.height, 1)) * 100)),
  };
}

export function Whiteboard({ board, onNotesChange, onSelectedToolChange, onPenMarksChange, onClear, currentTask }: WhiteboardProps) {
  const [selectedTool, setSelectedTool] = useState(board.selectedTool);
  const [notes, setNotes] = useState(board.notes);
  const [penMarks, setPenMarks] = useState(board.penMarks ?? []);
  const [draftStroke, setDraftStroke] = useState<Point[] | null>(null);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const noteInput = useRef<HTMLInputElement>(null);
  const drawing = useRef<{ pointerId: number; points: Point[] } | null>(null);
  const visibleNotes = onNotesChange ? board.notes : notes;
  const visibleTool = onSelectedToolChange ? board.selectedTool : selectedTool;
  const visibleMarks = onPenMarksChange ? board.penMarks ?? [] : penMarks;
  useEffect(() => { if (visibleTool === "sticky") noteInput.current?.focus(); }, [visibleTool]);

  function updateMarks(marks: string[]) {
    setPenMarks(marks);
    onPenMarksChange?.(marks);
  }

  function selectItem(id: string) {
    if (visibleTool === "pointer") setSelectedItem((current) => current === id ? null : id);
  }

  function startDrawing(event: ReactPointerEvent<HTMLDivElement>) {
    if (visibleTool !== "pen") return;
    event.preventDefault();
    const points = [pointOnBoard(event)];
    drawing.current = { pointerId: event.pointerId, points };
    setDraftStroke(points);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function continueDrawing(event: ReactPointerEvent<HTMLDivElement>) {
    const active = drawing.current;
    if (!active || active.pointerId !== event.pointerId) return;
    event.preventDefault();
    if (active.points.length >= 500) return;
    const next = pointOnBoard(event);
    const previous = active.points.at(-1)!;
    if (Math.hypot(next.x - previous.x, next.y - previous.y) < 0.35) return;
    active.points = [...active.points, next];
    setDraftStroke(active.points);
  }

  function finishDrawing(event: ReactPointerEvent<HTMLDivElement>) {
    const active = drawing.current;
    if (!active || active.pointerId !== event.pointerId) return;
    event.preventDefault();
    const end = pointOnBoard(event);
    const points = [...active.points, end];
    drawing.current = null;
    setDraftStroke(null);
    if (points.length > 1) updateMarks([...visibleMarks, `${DRAWING_PREFIX}${JSON.stringify(points)}`]);
  }

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
              onClick={() => { setSelectedTool(tool.id); onSelectedToolChange?.(tool.id); setSelectedItem(null); }}
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
      <div
        aria-label={visibleTool === "pen" ? "Drawable whiteboard surface" : "Whiteboard surface"}
        className={`board-surface board-surface-${visibleTool}`}
        onPointerDown={startDrawing}
        onPointerMove={continueDrawing}
        onPointerUp={finishDrawing}
      >
        {visibleNotes.length > 0 ? (
          visibleNotes.map((note, index) => (
            <button aria-pressed={selectedItem === `note-${index}`} className="sticky-note board-item" key={`${note}-${index}`} onClick={() => selectItem(`note-${index}`)} type="button">
              {note}
            </button>
          ))
        ) : (
          <p className="empty-board">Board cleared. Choose a tool to add your next thought.</p>
        )}
        <svg aria-label="Pen drawings" className="drawing-layer" preserveAspectRatio="none" viewBox="0 0 100 100">
          {visibleMarks.map((mark, index) => {
            const points = readDrawing(mark);
            if (!points) return null;
            return <polyline aria-label={`Drawing ${index + 1}`} aria-pressed={selectedItem === `mark-${index}`} className="pen-stroke" key={`${mark}-${index}`} onClick={() => selectItem(`mark-${index}`)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); selectItem(`mark-${index}`); } }} points={points.map((point) => `${point.x},${point.y}`).join(" ")} role="button" tabIndex={0} />;
          })}
          {draftStroke && <polyline className="pen-stroke pen-stroke-draft" points={draftStroke.map((point) => `${point.x},${point.y}`).join(" ")} />}
        </svg>
        {visibleMarks.map((mark, index) => readDrawing(mark) ? null : <button aria-pressed={selectedItem === `mark-${index}`} className="pen-mark board-item" key={`${mark}-${index}`} onClick={() => selectItem(`mark-${index}`)} type="button">Pen mark: {mark}</button>)}
      </div>
      {visibleTool === "pointer" && <p aria-live="polite">Choose a note or drawing on the board to select it{selectedItem ? ". One board item is selected." : "."}</p>}
      {visibleTool === "pen" && <div aria-label="Pen controls"><p>Draw directly on the board with your mouse, pen, or finger.</p><form onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); const mark = String(form.get("mark") ?? "").trim(); if (mark) { updateMarks([...visibleMarks, mark]); event.currentTarget.reset(); } }}><label>Describe a pen mark for keyboard access<input name="mark" /></label><button type="submit">Add described pen mark</button></form><button type="button" disabled={!visibleMarks.length} onClick={() => updateMarks(visibleMarks.slice(0, -1))}>Undo pen mark</button></div>}
      {onNotesChange && visibleTool === "sticky" && <form onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); const note = String(form.get("note") ?? "").trim(); if (note) { const next = [...visibleNotes, note]; onNotesChange(next); event.currentTarget.reset(); } }}><label>Add board note<input ref={noteInput} name="note" /></label><button type="submit">Save board note</button></form>}
    </section>
  );
}
