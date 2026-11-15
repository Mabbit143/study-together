"use client";
import { useEffect, useState } from "react";
import type { StudyMaterial } from "@/features/study/types";
import { StartPanel } from "./start-panel";
import { ContinuePanel } from "./continue-panel";
import { StudyPaths } from "./study-paths";
import { StudyRoom } from "@/components/study/study-room";
import { OLD_ENGLISH_DEMO } from "@/features/study/demo-session";
import { loadProfile, type StudyProfileV1 } from "@/features/storage/local-store";
import { LandingHeader } from "./landing-header";
import { NewSession } from "./new-session";
import { RecentSessions } from "./recent-sessions";
export function Landing() {
 const [material, setMaterial] = useState<StudyMaterial | null>(null);
 const [path, setPath] = useState<"new" | "continue" | null>(null);
 const [profile, setProfile] = useState<StudyProfileV1 | null>(null);
 const [notice, setNotice] = useState("");
 useEffect(() => { let active = true; Promise.resolve().then(() => { if (!active) return; const result = loadProfile(); setProfile(result.profile); if (result.resetNotice) setNotice(result.resetNotice); }); return () => { active = false; }; }, []);
 if (material) return <StudyRoom session={{ ...OLD_ENGLISH_DEMO, id: "imported-material", title: material.title, material }} />;
 const showNew = () => setPath("new"); const showPrevious = () => setPath("continue");
 return <><LandingHeader onHome={() => setPath(null)} onNewSession={showNew} onPreviousSessions={showPrevious} /><main className="landing">{notice && <p role="alert">{notice}</p>}{path === null && <><StartPanel onCreate={showNew} /><StudyPaths onCreateSession={showNew} onContinue={showPrevious} />{profile && <RecentSessions profile={profile} onError={setNotice} />}<aside className="landing-note" aria-label="How Study Together works"><p className="eyebrow">Built for clarity</p><p>Every contribution is named, every source is cited, and every shared moment can be read as captions.</p></aside></>}{path === "new" && <NewSession onEnter={setMaterial} />}{path === "continue" && <ContinuePanel />}</main></>;
}
