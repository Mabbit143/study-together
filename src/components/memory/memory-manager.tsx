"use client";
import { useState } from "react";
import type { StudyMemory } from "@/features/memory/study-memory";
export function MemoryManager({ memory, onDelete, onEdit }: { memory: StudyMemory; onDelete: (kind: keyof StudyMemory, item: string) => void; onEdit?: (kind: keyof StudyMemory, item: string, replacement: string) => void }) {
 const [editing, setEditing] = useState<{ kind: keyof StudyMemory; item: string } | null>(null);
 const [value, setValue] = useState("");
 return <section aria-label="Study memory"><h2>Study memory</h2>{(["helpful", "difficult"] as const).map(kind => <div key={kind}><h3>{kind === "helpful" ? "Helpful" : "Difficult"}</h3><ul>{memory[kind].map((item, index) => <li key={`${item}-${index}`}>{item} {onEdit && <button type="button" onClick={() => { setEditing({ kind, item }); setValue(item); }}>Edit {item}</button>} <button type="button" onClick={() => onDelete(kind, item)}>Delete {item}</button></li>)}</ul></div>)}{editing && <form onSubmit={event => { event.preventDefault(); if (value.trim()) { onEdit?.(editing.kind, editing.item, value.trim()); setEditing(null); } }}><label>Edit memory<input value={value} onChange={event => setValue(event.target.value)} /></label><button type="submit">Save memory</button><button type="button" onClick={() => setEditing(null)}>Cancel</button></form>}</section>;
}
