"use client";
import { useState } from "react";
import { approaches, personalities, voices } from "@/features/preferences/peer-options";
import { defaultPeerPreferences, replacePeer, type PeerPreferences } from "@/features/preferences/peer-preferences";
export function PeerSettings({ preferences, onChange }: { preferences: PeerPreferences; onChange: (value: PeerPreferences) => void }) {
 const [open, setOpen] = useState(false);
 return <section onKeyDown={event => { if (event.key === "Escape") setOpen(false); }}><button type="button" onClick={() => setOpen(!open)} aria-expanded={open}>Peer settings</button>{open && <div>
  {([ ["voice", "Voice", voices], ["personality", "Personality", personalities], ["approach", "Study approach", approaches] ] as const).map(([key, label, options]) => <div key={key}><label>{label}<select value={preferences[key]} onChange={event => onChange({ ...preferences, [key]: event.target.value })}>{options.map(option => <option key={option} value={option}>{option}</option>)}</select></label><button type="button" onClick={() => onChange({ ...preferences, [key]: defaultPeerPreferences[key] })}>Reset {label.toLowerCase()}</button></div>)}
  <button type="button" onClick={() => onChange(replacePeer(preferences))}>Replace peer</button><button type="button" onClick={() => setOpen(false)}>Close settings</button>
 </div>}</section>;
}
