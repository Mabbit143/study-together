# Study Together Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship an accessible, no-login AI study group that discusses pasted text, PDF, or DOCX material through turn-based voice, a shared whiteboard, customizable familiar peers, and learner-controlled local memory.

**Architecture:** A Next.js 16.3 App Router application keeps document parsing and learner history in the browser and exposes narrow server routes for grounded Responses API output, transcription, and speech. A deterministic Old English demo uses the same contracts as live AI so judging remains possible during provider failure.

**Tech Stack:** Node.js 22 LTS; Next.js 16.3; React 19; TypeScript; Tailwind; Zod; OpenAI JavaScript SDK; `pdfjs-dist`; `mammoth`; Vitest + Testing Library; Playwright + Axe.

**Spec:** `docs/superpowers/specs/2026-11-10-study-together-design.md`

## Global Constraints

- No login, private student information, microphone, or live provider availability is required for the Old English demo.
- Accept pasted text, PDF, and DOCX; reject malformed, encrypted, empty, image-only, and oversized files with recovery guidance.
- Only learner-confirmed excerpts reach the server; files and raw audio are never persisted.
- One peer speaks at a time; captions and typing are full alternatives to audio.
- Supported answers visibly cite the supplied excerpt; unsupported/general-knowledge content is labeled.
- Jules facilitates, Rae checks sources, and Milo makes connections; all are labeled as AI.
- Peer changes preserve inspectable, editable, deletable study memory.
- No local AI model is installed; offline study uses a versioned AI-prepared text pack plus deterministic local tools.
- Queued offline questions are inspectable/deletable and require explicit confirmation before sending after reconnection.
- Live routes validate inputs, exclude content from logs, rate-limit anonymous sessions, and preserve input on failure.

## Review Focus

- Old English Unicode survives import, storage, rendering, AI round-trips, and captions without mojibake (Tasks 2 and 7).
- Invalid, encrypted, image-only, and oversized files never reach an AI route or trap the learner (Task 2).
- Provider timeout, quota, missing-key, and malformed-output failures preserve input and offer retry/demo mode (Tasks 4–5).
- Denied microphone permission and absent `MediaRecorder` retain the full typed flow (Tasks 5 and 7).
- Corrupt or older local storage resets safely with a visible notice and no startup crash (Task 3).
- Connection loss during pack generation or queued-question sync cannot corrupt the last complete pack or silently send an outbox item (Tasks 4, 6, and 7).

---

### Task 1: Application foundation and deterministic room

**Files:**
- Create: `package.json`, framework/config files, `.env.example`, `src/app/{layout,page,globals.css}`
- Create: `src/features/study/{types,demo-session}.ts`
- Create: `src/components/{landing/start-panel,study/{study-room,whiteboard,peer-list}}.tsx`
- Test: `src/features/study/demo-session.test.ts`, `src/components/study/study-room.test.tsx`

**Interfaces:**
- Produces: `PeerId`, `StudyMaterial`, `BoardState`, `Peer`, `StudyTurn`, `StudySession`, and `OLD_ENGLISH_DEMO: StudySession`.

- [ ] **Step 1: Scaffold Next.js and tests** — Run `npx create-next-app@16.3.0 . --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm`; add Vitest, Testing Library, jsdom, Playwright, and Axe.
- [ ] **Step 2: Write failing tests** — Assert exact Unicode `Sēo cwēn gesihþ þone cyning`, all three peer roles and AI labels, one active speaker, cited source, captions, and the four mockup board controls.
- [ ] **Step 3: Confirm failure** — Run `npm test -- src/features/study/demo-session.test.ts src/components/study/study-room.test.tsx`; expect missing modules.
- [ ] **Step 4: Implement the fixture and responsive shell** — Use semantic landmarks, visible focus, `aria-live="polite"` captions, and the mockup’s warm paper/green direction.
- [ ] **Step 5: Verify** — Run focused tests, `npm run lint`, and `npm run build`; all pass.
- [ ] **Step 6: Commit** — `git add . && git commit -m "feat: scaffold accessible study room demo"`.

### Task 2: Text, PDF, and DOCX import

**Files:**
- Create: `src/features/materials/{material-schema,extract-text,extract-pdf,extract-docx,select-excerpt}.ts`
- Create: `src/components/materials/{material-import,excerpt-preview}.tsx`
- Create: Unicode PDF/DOCX fixtures under `src/features/materials/__fixtures__/`
- Test: `src/features/materials/extract-text.test.ts`, `src/components/materials/material-import.test.tsx`

**Interfaces:**
- Produces: `AcceptedMaterialType`; `ExtractedMaterial { name, type, text, warnings }`; `extractMaterial(file: File): Promise<ExtractedMaterial>`; `confirmExcerpt(material, start, end): StudyMaterial`.

- [ ] **Step 1: Add `pdfjs-dist`, `mammoth`, and `zod`** — Define 10 MiB file, 100,000 extracted-character, 20,000 confirmed-excerpt-character, and 15-second extraction limits.
- [ ] **Step 2: Write failing tests** — Cover Unicode fixtures, extension/content mismatch, malformed, encrypted, empty, image-only, oversized, and timeout cases; none may advance.
- [ ] **Step 3: Confirm failure** — Run `npm test -- src/features/materials`.
- [ ] **Step 4: Implement client-only parsing and confirmation** — Normalize whitespace without altering Unicode; preview extracted text and require confirmation before network use.
- [ ] **Step 5: Verify** — Run focused tests and `npm run build`; parsers must not enter the server bundle.
- [ ] **Step 6: Commit** — `git add . && git commit -m "feat: import and confirm study materials"`.

### Task 3: Familiar peers and local memory

**Files:**
- Create: `src/features/preferences/{peer-options,peer-preferences}.ts`, `src/features/memory/study-memory.ts`, `src/features/storage/local-store.ts`
- Create: `src/components/study/peer-settings.tsx`, `src/components/memory/memory-manager.tsx`, `src/components/landing/continue-panel.tsx`
- Test: storage, peer-settings, and memory-manager tests beside those modules.

**Interfaces:**
- Produces: `VoiceId = "alloy" | "coral" | "sage"`; `Personality = "encouraging" | "straightforward" | "playful"`; `StudyApproach = "question-led" | "example-led" | "explain-then-practice"`; `PeerPreferences`; `StudyMemory`; `OfflineStudyPackV1`; `QueuedQuestion`; `StudyProfileV1`; `loadProfile`, `saveProfile`, `deleteMemory`, `deletePack`, `queueQuestion`, `deleteQueuedQuestion`, `clearProfile`.

- [ ] **Step 1: Write failing tests** — Settings change independently; replacement preserves memory; helpful/difficult items, a complete offline pack, and queued questions round-trip; pack/question deletion and clear-all work; incomplete pack writes never replace the last complete pack; corrupt/unknown storage shows reset notice.
- [ ] **Step 2: Confirm failure** — Run the three focused test files.
- [ ] **Step 3: Implement versioned local storage and UI** — Use `study-together.profile.v1`; never store original files/audio; present `Bring material` and `Continue studying` equally.
- [ ] **Step 4: Verify keyboard behavior** — Open, change, reset, and close settings without a pointer; focused tests pass.
- [ ] **Step 5: Commit** — `git add . && git commit -m "feat: persist familiar peers and study memory"`.

### Task 4: Grounded peer-response engine

**Files:**
- Create: `src/features/ai/{turn-schema,build-study-prompt,demo-engine,openai-client,rate-limit}.ts`
- Create: `src/app/api/study-turn/route.ts`
- Test: prompt, demo-engine, and route tests beside those modules.

**Interfaces:**
- Consumes: confirmed material, peer preferences, recent turns, and selected memories.
- Produces: `StudyTurnRequest`; `StudyTurnResponse { speaker, response, supportStatus, citedExcerpt, boardAction, memorySuggestion, followUp? }`; `OfflinePackRequest`; `OfflineStudyPackV1` containing grounded peer branches, hints, explanations, examples, practice items, and answer checks; `POST /api/study-turn`; `POST /api/offline-pack`; safe error `{ code, message, canRetry, demoAvailable }`.

- [ ] **Step 1: Add the OpenAI SDK and write failing contract tests** — Only confirmed excerpt/selected memories enter prompts; coach-first behavior follows approach; supported claims require a verbatim excerpt; follow-up is optional and non-duplicative; offline packs are versioned, finite, grounded, and contain no network-only references.
- [ ] **Step 2: Write failure tests** — Missing key, timeout, connection loss, quota, invalid structured output, oversized request, rate excess, and prompt injection in source all return safe recovery with no content logs; partial generation never returns a storable pack.
- [ ] **Step 3: Confirm failure** — Run `npm test -- src/features/ai src/app/api/study-turn/route.test.ts`.
- [ ] **Step 4: Implement** — Use Responses API structured output, `OPENAI_TEXT_MODEL` default `gpt-5-mini`, 20-second timeout, 30 turns/session/hour, and deterministic demo through the same schema.
- [ ] **Step 5: Verify** — Run focused tests and build; logs contain no passages/transcripts.
- [ ] **Step 6: Commit** — `git add . && git commit -m "feat: add grounded peer response engine"`.

### Task 5: Turn-based transcription and speech

**Files:**
- Create: `src/features/audio/{recorder,audio-schema}.ts`, `src/components/audio/{turn-recorder,speech-player}.tsx`
- Create: `src/app/api/{transcribe,speech}/route.ts`
- Test: recorder and both route tests.

**Interfaces:**
- Produces: `RecorderState`; `POST /api/transcribe` → `{ transcript }`; `POST /api/speech` with `{ text, voice }` → MPEG audio.

- [ ] **Step 1: Write failing interaction tests** — Explicit start/stop, 60-second cap, editable transcript review, permission denial, unsupported-browser fallback, empty audio, invalid MIME, and no automatic mic activation.
- [ ] **Step 2: Write provider/abuse tests** — Timeout, quota, malformed output, speech text over 1,500 chars, and over 20 audio operations/session/hour recover without content logs.
- [ ] **Step 3: Confirm failure** — Run focused audio/route tests.
- [ ] **Step 4: Implement** — Browser `MediaRecorder`; `gpt-4o-mini-transcribe`; `gpt-4o-mini-tts`; three configured voices; render captions before optional audio.
- [ ] **Step 5: Verify** — Focused tests and build pass; API key is absent from client bundles.
- [ ] **Step 6: Commit** — `git add . && git commit -m "feat: add accessible turn-based voice"`.

### Task 6: Integrated study loop, offline static chat, and accessibility

**Files:**
- Create: `src/features/study/use-study-session.ts`, `src/features/offline/{pack-runner,connection-sync,service-worker}.ts`, `src/components/study/{turn-composer,session-status}.tsx`, `src/components/offline/{prepare-pack,offline-status,outbox}.tsx`
- Modify: page, room, whiteboard, and peer-list components.
- Test: `src/features/study/use-study-session.test.tsx`, `src/components/study/study-flow.test.tsx`

**Interfaces:**
- Produces: `useStudySession()` as the only orchestration boundary for material, input, live responses, offline-pack branches, fallback, board actions, memory proposals, outbox confirmation, and retry.

- [ ] **Step 1: Write failing flow tests** — Sample/import start; typed/transcribed turn; transcript edit; one speaker; source highlight; note edit; another example; retry/demo fallback; helpful/difficult save; peer replacement; return suggestion; prepare pack; lose connection; traverse static chat; use local search/highlight/notes; queue an uncovered question; reconnect; explicitly approve or delete queued send.
- [ ] **Step 2: Confirm failure** — Run both focused tests.
- [ ] **Step 3: Implement orchestration/states** — Preserve input until success/discard; cache the app shell with a service worker; expose loading, empty, success, offline-pack, offline-no-pack, waiting-for-connection, rate-limit, provider-error, and demo states; never auto-send outbox items.
- [ ] **Step 4: Add accessibility assertions** — No serious Axe violations; logical tabs; visible focus; correct labels/live regions; reduced motion; usable at 320px and 200% zoom.
- [ ] **Step 5: Verify** — Run `npm test`, lint, and build; all pass.
- [ ] **Step 6: Commit** — `git add . && git commit -m "feat: complete grounded study session flow"`.

### Task 7: Acceptance tests and submission package

**Files:**
- Create: `e2e/{study-together,accessibility}.spec.ts`, `playwright.config.ts`
- Create: `README.md`, `LICENSE`, `docs/{privacy,limitations,credits}.md`
- Create: `docs/submission/{devpost-story,demo-script,launch-checklist}.md`
- Modify: `.env.example`, `package.json`

**Interfaces:**
- Produces: reproducible setup, privacy/limitations/credits, verified deployment record, Devpost copy, screenshot list, and captioned walkthrough script.

- [ ] **Step 1: Write failing Playwright acceptance tests** — Cover all eight design success criteria plus Unicode, denied mic, provider outage, keyboard-only settings, memory return, 320px layout, Axe, cached app reload offline, static-chat pack use, deterministic no-pack tools, and explicit outbox send/delete after reconnection.
- [ ] **Step 2: Confirm gaps** — Run `npx playwright test`.
- [ ] **Step 3: Write public documentation/disclosures** — Document setup, environment, limits, online/offline data flow, study-pack and outbox controls, synthetic data, AI assistance, dependencies, pre-existing mockup, scanned-PDF limitation, no local AI model, and no outcome claims.
- [ ] **Step 4: Create submission assets** — Devpost story addresses all four criteria; screenshot list and 2–3 minute captioned script show barrier, before/after, import, grounded turn, board, peer change, memory, limitations, and credits.
- [ ] **Step 5: Verify release candidate** — Run unit tests, lint, build, Playwright, and `npm audit --omit=dev`; no unresolved high/critical production finding without written rationale.
- [ ] **Step 6: Review secrets/history** — Confirm no keys, private learner data, grades, uploaded files, or raw audio; only `.env.example` is tracked.
- [ ] **Step 7: Commit** — `git add . && git commit -m "docs: prepare Study Together hackathon release"`.
- [ ] **Step 8: Publish with explicit account authorization** — Create/attach GitHub remote, push, import into Vercel, add secrets, verify logged-out URL, and record commit SHA/time.
- [ ] **Step 9: Record walkthrough** — Use synthetic material; verify captions, public/unlisted playback, keyboard focus, and 2:00–3:00 duration.
- [ ] **Step 10: Submit and read back** — Fill Devpost, add contributors/assets/credits/disclosures, submit before Nov 20 at 5 PM ET, reopen and verify every saved field, link, and confirmation; keep links live through Nov 22.
- [ ] **Step 11: Tag verified submission** — Create/push annotated tag `accessed-2026-submission` only after all public artifacts and the submitted state are verified.
