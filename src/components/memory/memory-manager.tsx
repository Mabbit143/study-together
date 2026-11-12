"use client";
import { useState } from "react";
import type { StudyMemory } from "@/features/memory/study-memory";
export function MemoryManager({ memory, onDelete, onEdit }: { memory: StudyMemory; onDelete: (kind: keyof StudyMemory, id: string) => void; onEdit?: (kind: keyof StudyMemory, id: string, replacement: string) => void }) {
 const [editing, setEditing] = useState<{ kind: keyof StudyMemory; id: string } | null>(null); const [value, setValue] = useState("");
 return <section aria-label="Study memory"><h2>Study memory</h2>{(["helpful", "difficult"] as const).map(kind => <div key={kind}><h3>{kind === "helpful" ? "Helpful" : "Difficult"}</h3><ul>{memory[kind].map(item => <li key={item.id}>{item.text} {onEdit && <button type="button" onClick={() => { setEditing({ kind, id: item.id }); setValue(item.text); }}>Edit {item.text}</button>} <button type="button" onClick={() => onDelete(kind, item.id)}>Delete {item.text}</button></li>)}</ul></div>)}{editing && <form onSubmit={event => { event.preventDefault(); if (value.trim()) { onEdit?.(editing.kind, editing.id, value.trim()); setEditing(null); } }}><label>Edit memory<input value={value} onChange={event => setValue(event.target.value)} /></label><button type="submit">Save memory</button><button type="button" onClick={() => setEditing(null)}>Cancel</button></form>}</section>;
}
