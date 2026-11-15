"use client";

import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";

import type { BoardState } from "@/features/study/types";

type WhiteboardProps = {
  board: BoardState;
  onNotesChange?: (notes: string[]) => void;
  onSelectedToolChange?: (tool: BoardState["selectedTool"]) => void;
  onPenMarksChange?: (marks: string[]) => void;
  onClear?: () => void;
  onSaveSelection?: (text: string) => void;
  currentTask?: string;
};

const tools = [
  { id: "pointer", label: "Pointer" },
  { id: "pen", label: "Pen" },
  { id: "sticky", label: "Sticky note" },
] as const;

type Point = { x: number; y: number };
const DRAWING_PREFIX = "drawing:";
const SHAPE_PREFIX = "shape:";
const STICKY_PREFIX = "sticky:";
type BoardMode = BoardState["selectedTool"] | "rectangle" | "circle" | "eraser" | "group";
type StickyOwner = "you" | "jules" | "rae" | "milo";
type StyledSticky = { text: string; owner: StickyOwner; color: string; fontSize: number };
type Shape = { kind: "rectangle" | "circle"; x: number; y: number; width: number; height: number; color: string };
const memberColors: Record<StickyOwner, string> = { you: "#ffe08a", jules: "#bfe3d0", rae: "#cfe0ff", milo: "#e3cdf7" };

function readSticky(note: string, index: number): StyledSticky {
  if (note.startsWith(STICKY_PREFIX)) try { const parsed = JSON.parse(note.slice(STICKY_PREFIX.length)); if (parsed.text && parsed.owner in memberColors) return parsed; } catch { /* Old notes remain readable. */ }
  const owner = (["jules", "rae", "milo", "you"] as StickyOwner[])[index % 4];
  return { text: note, owner, color: memberColors[owner], fontSize: 16 };
}

function readShape(mark: string): Shape | null {
  if (!mark.startsWith(SHAPE_PREFIX)) return null;
  try { const shape = JSON.parse(mark.slice(SHAPE_PREFIX.length)); return shape && (shape.kind === "rectangle" || shape.kind === "circle") ? shape : null; } catch { return null; }
}

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

export function Whiteboard({ board, onNotesChange, onSelectedToolChange, onPenMarksChange, onClear, onSaveSelection, currentTask }: WhiteboardProps) {
  const [notes, setNotes] = useState(board.notes);
  const [penMarks, setPenMarks] = useState(board.penMarks ?? []);
  const [draftStroke, setDraftStroke] = useState<Point[] | null>(null);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [mode, setMode] = useState<BoardMode>(board.selectedTool);
  const [color, setColor] = useState("#255b45");
  const [fontSize, setFontSize] = useState(16);
  const [selectionBox, setSelectionBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const noteInput = useRef<HTMLInputElement>(null);
  const drawing = useRef<{ pointerId: number; points: Point[] } | null>(null);
  const visibleNotes = onNotesChange ? board.notes : notes;
  const visibleMarks = onPenMarksChange ? board.penMarks ?? [] : penMarks;
  useEffect(() => { if (mode === "sticky") noteInput.current?.focus(); }, [mode]);

  function updateMarks(marks: string[]) {
    setPenMarks(marks);
    onPenMarksChange?.(marks);
  }

  function selectItem(id: string) {
    if (mode === "eraser") {
      if (id.startsWith("note-")) onNotesChange?.(visibleNotes.filter((_, index) => `note-${index}` !== id));
      else updateMarks(visibleMarks.filter((_, index) => `mark-${index}` !== id));
      setSelectedItems((items) => items.filter((item) => item !== id));
      return;
    }
    if (mode === "group") setSelectedItems((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]);
    if (mode === "pointer") setSelectedItem((current) => current === id ? null : id);
  }

  function startDrawing(event: ReactPointerEvent<HTMLDivElement>) {
    if (!["pen", "rectangle", "circle", "group"].includes(mode)) return;
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
    if (points.length <= 1) return;
    if (mode === "pen") updateMarks([...visibleMarks, `${DRAWING_PREFIX}${JSON.stringify(points)}`]);
    else if (mode === "rectangle" || mode === "circle") {
      const start = points[0]; const shape: Shape = { kind: mode, x: Math.min(start.x, end.x), y: Math.min(start.y, end.y), width: Math.abs(end.x - start.x), height: Math.abs(end.y - start.y), color };
      updateMarks([...visibleMarks, `${SHAPE_PREFIX}${JSON.stringify(shape)}`]);
    } else {
      const start = points[0]; const box = { x: Math.min(start.x, end.x), y: Math.min(start.y, end.y), width: Math.abs(end.x - start.x), height: Math.abs(end.y - start.y) };
      setSelectionBox(null);
      const selected = visibleMarks.flatMap((mark, index) => { const shape = readShape(mark); const drawingPoints = readDrawing(mark); const candidates = shape ? [{ x: shape.x, y: shape.y }, { x: shape.x + shape.width, y: shape.y + shape.height }] : drawingPoints; if (!candidates?.length) return []; const xs = candidates.map((point) => point.x); const ys = candidates.map((point) => point.y); const overlaps = Math.max(Math.min(...xs), box.x) <= Math.min(Math.max(...xs), box.x + box.width) && Math.max(Math.min(...ys), box.y) <= Math.min(Math.max(...ys), box.y + box.height); return overlaps ? [`mark-${index}`] : []; });
      setSelectedItems(selected);
    }
  }

  function chooseMode(next: BoardMode) {
    setMode(next); setSelectedItem(null); setSelectedItems([]); setSelectionBox(null);
    if (next === "pointer" || next === "pen" || next === "sticky") onSelectedToolChange?.(next);
  }

  function selectionText() {
    const noteText = selectedItems.flatMap((id) => { const match = /^note-(\d+)$/.exec(id); return match ? [readSticky(visibleNotes[Number(match[1])], Number(match[1])).text] : []; });
    const markText = selectedItems.flatMap((id) => { const match = /^mark-(\d+)$/.exec(id); if (!match) return []; const mark = visibleMarks[Number(match[1])]; const shape = readShape(mark); return [shape ? `${shape.kind} diagram` : readDrawing(mark) ? "hand-drawn board note" : mark]; });
    return [...noteText, ...markText].join("\n");
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
              aria-pressed={mode === tool.id}
              className="tool-button"
              key={tool.id}
              onClick={() => chooseMode(tool.id)}
              type="button"
            >
              {tool.label}
            </button>
          ))}
          <button aria-pressed={mode === "rectangle"} className="tool-button" onClick={() => chooseMode("rectangle")} type="button">Rectangle</button>
          <button aria-pressed={mode === "circle"} className="tool-button" onClick={() => chooseMode("circle")} type="button">Circle</button>
          <button aria-pressed={mode === "eraser"} className="tool-button" onClick={() => chooseMode("eraser")} type="button">Eraser</button>
          <button aria-pressed={mode === "group"} className="tool-button" onClick={() => chooseMode("group")} type="button">Select group</button>
          <button className="tool-button danger" onClick={() => { if (onClear && !confirmClear) { setConfirmClear(true); return; } if (onClear) onClear(); else { setNotes([]); onNotesChange?.([]); onPenMarksChange?.([]); } setConfirmClear(false); }} type="button">
            {confirmClear ? "Confirm clear board" : "Clear board"}
          </button>
        </div>
      </div>
      <div className="board-format-controls">
        <label>Board color <input aria-label="Board color" type="color" value={color} onChange={(event) => setColor(event.target.value)} /></label>
        <label>Sticky-note font size <select value={fontSize} onChange={(event) => setFontSize(Number(event.target.value))}><option value="14">Small</option><option value="16">Medium</option><option value="20">Large</option><option value="24">Extra large</option></select></label>
      </div>
      <div aria-label="Sticky-note color key" className="member-color-key">{(Object.entries(memberColors) as [StickyOwner, string][]).map(([owner, value]) => <span key={owner}><i aria-hidden="true" style={{ backgroundColor: value }} />{owner === "you" ? "You" : owner[0].toUpperCase() + owner.slice(1)}</span>)}</div>
      {board.highlights?.length ? <div aria-label="Grounded source highlights"><h3>Grounded highlights</h3>{board.highlights.map((value) => <mark key={value}>{value}</mark>)}</div> : null}
      {currentTask ? <div aria-label="Current study task"><h3>Current question</h3><p>{currentTask}</p></div> : null}
      <div
        aria-label={["pen", "rectangle", "circle", "group"].includes(mode) ? "Drawable whiteboard surface" : "Whiteboard surface"}
        className={`board-surface board-surface-${mode}`}
        onPointerDown={startDrawing}
        onPointerMove={(event) => { continueDrawing(event); if (mode === "group" && drawing.current) { const start = drawing.current.points[0]; const point = pointOnBoard(event); setSelectionBox({ x: Math.min(start.x, point.x), y: Math.min(start.y, point.y), width: Math.abs(point.x - start.x), height: Math.abs(point.y - start.y) }); } }}
        onPointerUp={finishDrawing}
      >
        {visibleNotes.length > 0 ? (
          visibleNotes.map((note, index) => {
            const sticky = readSticky(note, index); const id = `note-${index}`;
            return <button aria-pressed={selectedItem === id || selectedItems.includes(id)} className="sticky-note board-item" data-author={sticky.owner} key={`${note}-${index}`} onClick={() => selectItem(id)} style={{ backgroundColor: sticky.color, fontSize: `${sticky.fontSize}px` }} title={`${sticky.owner === "you" ? "Your" : `${sticky.owner}'s`} sticky note`} type="button">
              <span>{sticky.text}</span>
            </button>
          })
        ) : (
          <p className="empty-board">Board cleared. Choose a tool to add your next thought.</p>
        )}
        <svg aria-label="Pen drawings" className="drawing-layer" preserveAspectRatio="none" viewBox="0 0 100 100">
          {visibleMarks.map((mark, index) => {
            const shape = readShape(mark); const id = `mark-${index}`;
            if (shape) { const common = { "aria-label": `${shape.kind} ${index + 1}`, "aria-pressed": selectedItem === id || selectedItems.includes(id), className: "board-shape", fill: "transparent", onClick: () => selectItem(id), onKeyDown: (event: ReactKeyboardEvent<SVGElement>) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); selectItem(id); } }, role: "button", stroke: shape.color, tabIndex: 0 }; return shape.kind === "circle" ? <ellipse {...common} key={`${mark}-${index}`} cx={shape.x + shape.width / 2} cy={shape.y + shape.height / 2} rx={shape.width / 2} ry={shape.height / 2} /> : <rect {...common} key={`${mark}-${index}`} height={shape.height} width={shape.width} x={shape.x} y={shape.y} />; }
            const points = readDrawing(mark);
            if (!points) return null;
            return <polyline aria-label={`Drawing ${index + 1}`} aria-pressed={selectedItem === id || selectedItems.includes(id)} className="pen-stroke" key={`${mark}-${index}`} onClick={() => selectItem(id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); selectItem(id); } }} points={points.map((point) => `${point.x},${point.y}`).join(" ")} role="button" style={{ stroke: color }} tabIndex={0} />;
          })}
          {draftStroke && <polyline className="pen-stroke pen-stroke-draft" points={draftStroke.map((point) => `${point.x},${point.y}`).join(" ")} />}
        </svg>
        {selectionBox && <div aria-hidden="true" className="selection-box" style={{ left: `${selectionBox.x}%`, top: `${selectionBox.y}%`, width: `${selectionBox.width}%`, height: `${selectionBox.height}%` }} />}
        {visibleMarks.map((mark, index) => readDrawing(mark) ? null : <button aria-pressed={selectedItem === `mark-${index}`} className="pen-mark board-item" key={`${mark}-${index}`} onClick={() => selectItem(`mark-${index}`)} type="button">Pen mark: {mark}</button>)}
      </div>
      {mode === "pointer" && <p aria-live="polite">Choose a note or drawing on the board to select it{selectedItem ? ". One board item is selected." : "."}</p>}
      {mode === "group" && <div><p aria-live="polite">Click items or drag across drawings to select a group. {selectedItems.length} selected.</p><button type="button" disabled={!selectedItems.length || !onSaveSelection} onClick={() => onSaveSelection?.(selectionText())}>Save selection as study material</button></div>}
      {mode === "eraser" && <p>Choose any note, drawing, or shape to erase it.</p>}
      {mode === "pen" && <div aria-label="Pen controls"><p>Draw directly on the board with your mouse, pen, or finger.</p><form onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); const mark = String(form.get("mark") ?? "").trim(); if (mark) { updateMarks([...visibleMarks, mark]); event.currentTarget.reset(); } }}><label>Describe a pen mark for keyboard access<input name="mark" /></label><button type="submit">Add described pen mark</button></form><button type="button" disabled={!visibleMarks.length} onClick={() => updateMarks(visibleMarks.slice(0, -1))}>Undo pen mark</button></div>}
      {(mode === "rectangle" || mode === "circle") && <p>Drag on the board to add a {mode}.</p>}
      {onNotesChange && mode === "sticky" && <form onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); const text = String(form.get("note") ?? "").trim(); const owner = String(form.get("owner") ?? "you") as StickyOwner; if (text) { const note = `${STICKY_PREFIX}${JSON.stringify({ text, owner, color: memberColors[owner], fontSize })}`; onNotesChange([...visibleNotes, note]); event.currentTarget.reset(); } }}><label>Note author<select name="owner" defaultValue="you"><option value="you">You</option><option value="jules">Jules</option><option value="rae">Rae</option><option value="milo">Milo</option></select></label><label>Add board note<input ref={noteInput} name="note" /></label><button type="submit">Save board note</button></form>}
    </section>
  );
}
