"use client";
import { useRef, useState } from "react";
import type { PeerId } from "@/features/study/types";
import { approaches, personalities, voices } from "@/features/preferences/peer-options";
import { defaultPeers, replacePeer, type PeerPreferences } from "@/features/preferences/peer-preferences";
export function PeerSettings({ preferences, onChange, peerId = "jules" }: { preferences: PeerPreferences; onChange: (value: PeerPreferences) => void; peerId?: PeerId }) {
 const [open, setOpen] = useState(false); const trigger = useRef<HTMLButtonElement>(null);
 function close() { setOpen(false); trigger.current?.focus(); }
 return <section onKeyDown={event => { if (event.key === "Escape" && open) { event.preventDefault(); close(); } }}><button ref={trigger} type="button" onClick={() => open ? close() : setOpen(true)} aria-expanded={open}>Peer settings</button>{open && <div>
  <label>Display name<input key={preferences.name} defaultValue={preferences.name} onBlur={event => { const name = event.currentTarget.value.trim(); if (name && name !== preferences.name) onChange({ ...preferences, name }); else event.currentTarget.value = preferences.name; }} /></label>
  {([ ["voice", "Voice", voices], ["personality", "Personality", personalities], ["approach", "Study approach", approaches] ] as const).map(([key, label, options]) => <div key={key}><label>{label}<select value={preferences[key]} onKeyDown={event => { if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); const index = options.indexOf(preferences[key] as never); const next = Math.max(0, Math.min(options.length - 1, index + (event.key === "ArrowDown" ? 1 : -1))); onChange({ ...preferences, [key]: options[next] }); } }} onChange={event => onChange({ ...preferences, [key]: event.target.value })}>{options.map(option => <option key={option} value={option}>{option}</option>)}</select></label><button type="button" onClick={() => onChange({ ...preferences, [key]: defaultPeers[peerId][key] })}>Reset {label.toLowerCase()}</button></div>)}
  <button type="button" onClick={() => onChange(replacePeer(preferences, peerId))}>Replace peer</button><button type="button" onClick={close}>Close settings</button>
 </div>}</section>;
}
