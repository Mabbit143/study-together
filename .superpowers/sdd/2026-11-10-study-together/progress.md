# SDD ledger — plan: docs/superpowers/plans/2026-11-10-study-together.md

Workspace: `C:/Users/mabbi/Documents/AccessEd/study-together-build`
Branch: `feature/study-together`
Baseline: `822d500`

## Pre-flight conflict scan

| Scope | Producer / requirement | Consumer / later use | Finding / ruling |
|---|---|---|---|
| Task 1 | Creates shared study types and deterministic room | Tasks 2–6 consume and extend them | Clean; Task 1 owns canonical contracts. |
| Task 1 ↔ Task 6 | Task 1 creates page/room/board/peer list | Task 6 modifies those files | Clean; Task 6 integrates later services without renaming Task 1 contracts. |
| Task 1 internal | Plan says scaffold into repository root | Root is non-empty with approved docs and README | Ruling: scaffold in a temporary child directory, copy generated framework files into root while preserving `docs/`, `.gitignore`, and repository history, then remove only that verified temporary directory. Wrong ruling cost: minor scaffolding rework; prevents create-next-app refusal or document overwrite. |
| Task 2 | Produces confirmed `StudyMaterial` and import interfaces | Tasks 4 and 6 consume confirmed excerpts | Clean; only confirmed excerpts may cross the network boundary. |
| Task 2 internal | Tests enumerate rejection cases | Parser/UI must block advance for each | Clean; no recovery case is optional. |
| Task 3 | Produces peer preferences, memory, and local-store APIs | Tasks 4 and 6 consume preferences/memories | Clean; versioned storage is the only persistence source. |
| Task 3 internal | Replacement changes identity/defaults but preserves memory | Storage and UI implementation | Clean; peer identity is separate from learner memory. |
| Task 4 | Produces grounded turn API and safe error envelope | Task 6 orchestrates turns; Task 7 acceptance tests | Clean; demo and live paths share one response schema. |
| Task 4 internal | Prompt tests require verbatim cited excerpt | Structured output schema and route | Clean; unsupported responses use explicit support status instead. |
| Task 5 | Produces audio routes/components and `RecorderState` | Task 6 integrates audio into the session | Clean; transcript confirmation precedes Task 4 submission. |
| Task 5 internal | Speech uses configured provider voices | Task 3 exposes three voice IDs | Clean; voice options map centrally and never affect behavior. |
| Task 6 | Produces `useStudySession()` orchestration | Task 7 exercises the full flow | Clean; it is the sole client orchestration boundary. |
| Task 6 internal | Preserve input across failures | Error states and retry/demo behavior | Clean; explicit discard is the only destructive action. |
| Task 7 | Modifies README/package/env and adds release docs/tests | Deployment, video, Devpost submission | Clean; external publishing remains approval-gated despite being in the plan. |
| Task 7 internal | Local verification precedes publish and submit | Public artifacts and final tag | Clean; tag is created only after read-back confirmation. |

## Rulings

- Ruling: Task 1 uses temporary-directory scaffolding because `create-next-app .` cannot safely own a non-empty approved repository — this preserves the design/plan and costs only a mechanical copy step if wrong.
- Ruling: Next.js remains pinned to 16.3.x, the current Active LTS line established during planning, rather than silently adopting a later major — this favors deadline stability; cost if wrong is a routine dependency update.
- Ruling: The isolated worktree was moved into the writable AccessEd workspace after the first implementer reported a hard sandbox block — the branch and ledger were preserved; cost if wrong is only path updates in workflow artifacts.
- Ruling: Task 1 will bypass npm 11's documented `npx` user-level `allow-scripts` forwarding bug with a task-local empty user config, then perform the project install directly with scripts disabled unless npm names a dependency whose required script can be explicitly reviewed and allowlisted — this preserves the user's global security policy; cost if wrong is another failed install, not weaker global policy.
- Ruling: Add an offline static-chat path through a downloadable AI study pack generated while connected, plus always-available local search, notes, highlights, and practice prompts; unexpected free-form questions queue until reconnection — this avoids a device-heavy local model while addressing the hackathon's low-connectivity barrier; cost if wrong is bounded rework in Tasks 3, 4, 6, and 7, with Task 1 unaffected.

## Tasks

- Task 1: fix round 1/5 (3 addressed, 0 open — required peers; answer provenance; single-speaker invariant; commits b7229cb..3a204fb)
- Task 1: complete (commits 822d500..3a204fb, review clean)
- Task 1: minor (deferred): tests assert control presence but not selected-tool and clear-note state changes; final review must triage before merge.
- Task 2: pending
- Task 2: fix round 1/5 (4 addressed, 1 open — renamed binary accepted as text; commits b2de54b..0948907)
- Task 2: fix round 2/5 (1 addressed, 1 open — new Netpbm false positive rejects ordinary text; commits 0948907..3e1a459)
- Task 2: fix round 3/5 (1 addressed, 0 open — plausible Netpbm validation preserves ordinary text; commits 3e1a459..a0ce308)
- Task 2: complete (commits 7399c01..a0ce308, review clean)
- Task 2: minor (deferred): real-browser extraction evidence is summarized but its temporary command/script was not retained for reproduction; final review must require permanent browser coverage before merge.
- Task 2: minor (deferred): real encrypted and image-only fixtures are not present; controlled parser/error tests cover recovery behavior.
- Task 3: pending
- Task 3: minor (deferred): initial RED output was not captured; final review should verify current behavior, not reconstruct missing process evidence.
- Task 3: minor (deferred): production build fetches Google fonts and failed offline; final review must remove external runtime/build font dependency for the offline-first release.
- Task 3: fix round 1/5 (5 addressed, 0 open — complete pack; three peers; actionable paths; memory IDs; keyboard focus; commits e39b88b..6ebf93b)
- Task 3: complete (commits a0ce308..6ebf93b, review clean)
- Ruling: Task 4 uses `gpt-6-luna` as the configurable default because official OpenAI documentation marks the planned `gpt-5-mini` default deprecated and identifies Luna as the current efficient focused-work model; cost if wrong is an environment-variable change, not an API contract rewrite.
- Ruling: Task 4 live provider calls fail closed unless a durable distributed rate-limit store is configured; demo responses remain available without that store and do not consume the paid-call limit. Client-selected session IDs and process-local counters cannot protect public hackathon spend.
- Ruling: Task 4 requires a separate structured grounding-verification pass for generated turns and offline packs, rejecting the whole result when any substantive claim, hint, explanation, example, practice item, or answer check is unsupported by the uploaded excerpt.
- Task 4: pending
- Task 4: minor (deferred): follow-up deduplication currently catches exact equality only; final review must decide whether normalized near-duplicate detection is required before release.
- Task 4: fix round 1/5 (5 addressed, 0 open — distributed live limiter; substantive grounding verification; prompt-injection recovery; demo bypass; explain-before-practice; commits 01cfae4..6f3d12d)
- Task 4: complete (commits fcb36ce..6f3d12d, review clean)
- Ruling: Task 5 uses current `gpt-transcribe` instead of the plan's deprecated `gpt-4o-mini-transcribe`. The configurable MPEG speech adapter temporarily uses `gpt-4o-mini-tts` because the current replacement requires a Realtime API architecture; document its January 6, 2027 shutdown and isolate the adapter for migration.
- Task 5: pending
- Task 5: minor (deferred): malformed JSON/multipart requests currently return generic 502 provider errors instead of a client-facing 400; final review must triage before release.
- Task 5: minor (deferred): speech route timeout/quota branches share tested helpers but lack direct route coverage; final review must triage before release.
- Task 5: fix round 1/5 (2 addressed, 0 open — consumable recording blob; microphone cleanup after startup failure; commits 95c0915..2f3b04a)
- Task 5: complete (commits 6f3d12d..2f3b04a, review clean)
- Task 6: pending
- Task 6: minor (deferred): the another-example action is hard-coded to Old English and must become subject-grounded before two-subject release verification.
- Task 6: minor (deferred): current accessibility unit coverage does not fully prove keyboard sequencing, async focus, 320px layout, or 200% zoom; Task 7 browser acceptance must cover them.
- Task 6: minor (deferred): pack download lacks focused filename, Blob-content, click, and object-URL cleanup coverage; final review must require browser download evidence.
- Task 6: fix round 1/5 (3 addressed, 2 open — persisted offline work, optional configured voice, interruption race addressed; stable multi-subject resume and full primary whiteboard state open; commits fccf99a..33f575c)
- Task 6: fix round 2/5 (1 addressed, 1 open — stable multi-subject resume addressed; primary whiteboard shows only newest persisted highlight; commits 33f575c..f751827)
- Task 6: fix round 3/5 (1 addressed, 0 open — complete grounded-highlight collection persisted and rendered once on primary whiteboard; commits f751827..59dd8c8)
- Task 6: complete (commits 2f3b04a..59dd8c8, review clean)
- Task 7: pending
- Task 7: minor (deferred): browser download verifies filename, contents, click, and re-import, but object-URL cleanup remains unit-level rather than browser-observed; acceptable if final whole-branch review finds no leak regression.
- Task 7: fix round 1/5 (6 addressed, 0 open — all-peer generation; exact two-subject proof; offline persistence/consent; real mic denial; keyboard flow; truthful release claims; commits 73d80bd..3438f62)
- Task 7: minor (deferred): public report wording says every peer preference was changed, while some browser selections match defaults and not every value is read back after reload; narrow wording or strengthen assertions before publication.
- Task 7: complete locally (commits 59dd8c8..3438f62, review clean); public push, deployment, live-provider verification, media upload, Devpost submission/read-back, and final tag remain external approval gates.

## Final whole-branch review

- Final review at 3438f62: changes required — critical subject-state leakage and offline acceptance bypass; important provider retention/context privacy, service-worker scope, async persistence/races, incomplete turn/voice behavior, incompatible limits/provider schema, misleading whiteboard/accessibility claims, and insufficient paid-call bounds.
- Final review fix wave base: 3438f62. One consolidated local fix wave authorized by the execution workflow; external publish/deploy/service actions remain gated.
- Final fix wave: committed 3438f62..1b8f2bc; 119 unit/API checks, 10 production-browser scenarios, lint, TypeScript, build, audit, secret scan, and diff check green.
- Final scoped re-review: critical subject isolation, real offline preparation/use, provider privacy/context, service-worker scope, limits/provider schema/import safety, spend bounds, and docs were addressed.
- Final scoped re-review residual (load-bearing): stale async turn/preparation closures can overwrite newer board edits; failed pack persistence can still appear saved; packless queued questions can cross subjects.
- Final scoped re-review residual (load-bearing): pending speech fetch can resolve after unmount and leak an object URL; the answer is duplicated across captions/response panels with inconsistent uncertainty labels.
- Final scoped re-review residual (load-bearing): Pointer/Pen/Sticky note controls remain inert selectors rather than behavior-changing tools or truthfully relabeled modes.
- Ruling: The workflow permits no second hidden final fix wave. These residual load-bearing findings are surfaced to the user for an explicit next-cycle decision; public merge/push/deploy remains blocked. Cost if wrong: delaying publication for one explicit repair cycle rather than shipping known state-loss, cross-subject, audio-lifecycle, and misleading-control defects.
- Ruling update: the release is pinned to patched Next.js 16.4.6 after the production audit superseded the earlier 16.3.x stability ruling; transcription uses current `gpt-transcribe`. Cost if wrong is a routine compatible patch/model configuration change.
- Final fix wave: complete locally on November 12, 2026. Subject state is isolated; prepared-pack download/import is exercised in fresh storage with multi-branch offline traversal; no-pack offline practice includes flashcards and self-explanation; provider context, retention, retry, output, and spend boundaries are explicit; service-worker caching is same-origin/static/GET-only; request, transcription, storage, and outbox races fail safely; all three saved peer configurations complete browser turns; whiteboard and 320px/200% reflow claims are directly tested.
- Final gate: 119/119 unit/component/API tests, 10/10 production Chromium tests, lint, TypeScript, Next.js 16.4.6 production build, zero-vulnerability production audit, secret/content-log scan, and `git diff --check` passed. Real encrypted/image-only fixtures remain absent (controlled recovery tests cover them); live provider quality, provider hard account spending caps/alerts, deployment, media, Devpost read-back, and publication remain external gates.
- Residual repair cycle (base `1b8f2bc`): addressed all scoped re-review findings. Request ownership now protects newer board/draft state; pack preparation merges current state and cancels; failed persistence is visibly unsaved without discarding recoverable work; packless outbox items retain their originating subject; speech work aborts and releases URLs across lifecycle changes; answers render once with truthful uncertainty labels; and Pointer, Pen, and Sticky modes have distinct accessible behavior with persisted pen marks and complete board clearing.
- Residual repair evidence: focused RED exposed 7 failures; focused GREEN passed 35/35; final suite passed 126/126 unit/component/API tests and 10/10 production Chromium scenarios. Lint, TypeScript, Next.js production build, production audit (0 vulnerabilities), secret/content-log scan, and `git diff --check` passed. Remaining external gates are unchanged: live-provider quality and account spending controls, deployment, media, Devpost read-back, and publication.
