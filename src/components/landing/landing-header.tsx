"use client";

import { useState } from "react";

type LandingHeaderProps = {
  onHome(): void;
  onNewSession(): void;
  onPreviousSessions(): void;
};

export function LandingHeader({ onHome, onNewSession, onPreviousSessions }: LandingHeaderProps) {
  const [open, setOpen] = useState(false);
  function choose(action: () => void) { action(); setOpen(false); }
  return <header className="landing-header">
    <button aria-expanded={open} aria-label="Open navigation menu" className="menu-button" onClick={() => setOpen(value => !value)} type="button"><span aria-hidden="true">☰</span></button>
    <strong>Study Together</strong>
    {open && <nav aria-label="Main navigation" className="landing-menu">
      <button type="button" onClick={() => choose(onHome)}>Home</button>
      <button type="button" onClick={() => choose(onNewSession)}>Create new session</button>
      <button type="button" onClick={() => choose(onPreviousSessions)}>Previous sessions</button>
    </nav>}
  </header>;
}
