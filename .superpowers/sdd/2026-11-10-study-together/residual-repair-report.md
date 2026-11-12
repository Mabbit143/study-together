# Residual repair report

Date: November 12, 2026  
Base: `1b8f2bc`  
Scope: final scoped re-review residuals only

## Findings and resolutions

1. **Async board and turn ownership** — Response completion now reads current refs and applies only response-owned changes. Newer notes, highlights, pen marks, selected tool, current task, and draft are preserved. Overlap tests edit board and draft state while a response is pending.
2. **Pack preparation ownership** — Preparation has request identity and an abort signal, merges against current board/profile state when it completes, and is cancelled by the visible interrupt action. Tests cover edits during preparation and cancellation.
3. **Persistence truth** — Pack writes complete before the UI claims they are saved. Storage write/parse/quota failures retain recoverable in-memory work, expose a clear unsaved/error notice, and never show the saved-pack claim. Failure and recovery paths are tested.
4. **Packless outbox subject binding** — Queued questions carry their originating material identity and full bounded material context. Explicit send after a subject switch restores and sends against that original subject; serialization and duplicate protection remain intact. A two-subject test proves the binding.
5. **Speech lifecycle** — Speech requests use both `AbortController` and request identity. New turns, stop, peer/subject changes, and unmount invalidate pending work. Stale responses cannot update state or create object URLs, and every created URL is revoked once. Deferred/unmount/new-turn tests cover the lifecycle.
6. **Answer presentation** — The answer appears only in the canonical captions/peer-response region, with one support label. `uncertain` is labeled as uncertainty rather than general knowledge. Follow-up and memory actions remain without a duplicate live region. DOM and Axe coverage prove uniqueness and labeling.
7. **Whiteboard controls** — Pointer is a non-edit/select mode; Pen exposes keyboard-operable add, undo, and clear behavior with persisted marks; Sticky exposes and focuses note creation. Clear board removes notes, highlights, the current task, and pen marks. Production-browser coverage proves each mode changes behavior and saved pen state survives offline reload.

## Verification evidence

- Focused RED: 7 expected failures across ownership, persistence, subject binding, speech, answer uniqueness, and board controls.
- Focused GREEN: 35/35 tests passed across study session, study flow, offline, and local storage suites.
- Full unit/component/API suite: 126/126 passed across 27 files.
- ESLint: passed.
- TypeScript (`tsc --noEmit --incremental false`): passed.
- Next.js 16.4.6 production build: passed, 8/8 pages generated.
- Playwright production Chromium: 10/10 passed, including both subjects and saved offline board-mode behavior.
- Production dependency audit: 0 vulnerabilities.
- Secret/content-log scan: no matches.
- `git diff --check`: passed (Git emitted only configured LF-to-CRLF conversion warnings).

## Remaining gates

No listed residual implementation issue remains. External/account-authorized gates are unchanged: live-provider quality verification, provider hard spending limits/alerts, deployment, walkthrough media, Devpost submission/read-back, and publication.
