# Study Together — AccessED Hackathon Design

## Intent

Study Together gives nontraditional students the useful parts of a study group without requiring everyone to be available at the same time. A learner brings course material from any subject, joins a familiar group of AI peers, and works through it by voice on a shared whiteboard. Old English is the polished demonstration because uncommon courses make finding a compatible human group especially difficult.

The before-and-after is concrete: a student with an unusual schedule and uncommon class studies alone; with Study Together, they can explain, question, compare interpretations, and revisit difficult material with a consistent group whenever they are available.

## Goals

- Ship a public, accessible prototype judges can try without an account or private information.
- Accept pasted text, PDF, and DOCX materials from any subject.
- Provide turn-based spoken discussion with visible captions and a text fallback.
- Keep three distinct peers familiar across sessions while allowing individual customization or replacement.
- Preserve study history and difficult-topic memory when peers change.
- Let a learner bring new material or continue from a suggested prior topic.
- Ground discussion in the learner-confirmed excerpt and show it on a shared whiteboard.
- Support keyboard operation, readable contrast, captions, plain controls, and responsive layouts.

## Non-goals and anti-goals

- No human matching, scheduling, messaging, accounts, cross-device sync, or production database.
- No simultaneous free-flowing audio, automatic grading, assignment completion, plagiarism assistance, or outcome claims.
- No web research in v1 and no image-only document support; unsupported documents get recovery guidance.
- Do not build a generic chatbot with three names, a passive summarizer, or peers that invent unsupported facts.
- Do not require a microphone, login, OpenAI account, or personal student data to evaluate the demo.
- Do not hide that peers are AI or retain course files without consent.

## Experience

### Start or resume

The landing state offers equal **Bring material** and **Continue studying** paths. A learner can paste text or upload PDF/DOCX; a returning learner sees an editable suggestion based on local history. A synthetic Old English sample lets judges start instantly.

The browser extracts text, shows a preview, and requires confirmation of the study excerpt before any AI request. Unsupported, empty, encrypted, oversized, malformed, or image-only files show human-readable recovery guidance. Files are not stored; only learner-approved notes and memory are saved locally.

### Study room

The layout follows the supplied mockup: shared whiteboard left, familiar peers right, captions and controls below. Initial peers are:

- **Jules — facilitator:** keeps the session moving and asks the next useful question.
- **Rae — source checker:** returns to supplied material and distinguishes evidence from inference.
- **Milo — connector:** proposes comparisons, examples, and tests of understanding.

All are labeled as AI. Only one peer speaks at a time. The learner records a turn, reviews its transcript, then submits it, or types instead. Peer text renders before optional generated speech; captions remain visible with sound off.

Peers are coach-first: ask a focused question or offer a hint, use the source on the board, and explain directly when asked or when the learner remains stuck. Other peers may add one short, non-repetitive follow-up.

### Whiteboard and grounding

The board shows the active excerpt, learner notes, peer annotations, and current question. Learners can edit notes, highlight, ask why, request another example, or check the source. Substantive explanations highlight a supporting excerpt. If the material does not support an answer, the group says so and requests another source or offers a clearly labeled general-knowledge explanation.

### Familiarity, customization, and memory

The same group returns by default. Per peer, the learner can change voice, personality, study approach, reset one attribute, or replace the peer without deleting study history.

- **Voice:** three previewable provider voices; voice never changes behavior.
- **Personality:** encouraging, straightforward, or playful; changes wording, not factual standards.
- **Study approach:** question-led, example-led, or explain-then-practice; changes turn structure.
- **Replace:** regenerates display identity/defaults while preserving learner memory.

Compact local memory includes studied topics, learner-marked difficulties, helpful explanations, and suggested practice. Learners can inspect, edit, delete individual memories, or clear all data. Revisiting a topic is always a suggestion, never a silent direction change.

## Technical approach

Build a small Next.js/TypeScript/Tailwind app on Vercel. Parse PDF and DOCX in the browser, store preferences/history locally, and keep provider keys in server routes.

Voice is turn-based: audio capture → speech-to-text → transcript confirmation → grounded peer response → optional text-to-speech. Typed input and silent captions are complete alternatives. Structured responses include active speaker, response, board action, cited excerpt, memory suggestion, and optional follow-up.

Live OpenAI transcription, grounded responses, and optional speech use the entrant’s approved API budget. The included Old English scenario remains interactive through the same response contract when the provider is unavailable and is clearly labeled demo mode. Live failures preserve input and offer retry or demo mode. Per-session limits and rate protection prevent uncontrolled judging spend.

Turn-based voice was selected over free-flowing audio because captioning, transcript review, cost control, testing, and deadline reliability outweigh a slightly less natural rhythm.

Implementation choices left to the builder are limited to maintained PDF/DOCX libraries, current low-cost model configuration isolated in environment settings, conservative hosting-based limits displayed before upload, and exact presentation copy. Preserve the mockup’s warm paper/green direction and correct its broken Unicode.

## Error handling, privacy, and safety

- Upload, extraction, AI, transcription, and speech each have visible loading, success, empty, and recoverable error states.
- API errors are human-readable and server logs omit document contents, transcripts, and secrets.
- Validate content and extension; reject malformed or suspicious files.
- Never persist uploaded files server-side; send only confirmed excerpts needed for a turn.
- Warn against private student records, grades, or identifying information.
- Publish plain-language AI/data disclosures, limitations, and credits for libraries, assets, models, AI assistance, and pre-existing work.
- Keep judging links available through November 22, 2026.

## Hackathon package and success criteria

The package includes a public app, cleaned public source with setup documentation and secret/history review, synthetic screenshots, complete Devpost story, and a captioned 2–3 minute walkthrough. The story covers learner, barrier, before-and-after, tools, challenges, learning, credits, event work, pre-existing mockup, and limitations.

A judge without an account can:

1. Start the Old English sample or upload a valid PDF/DOCX.
2. Confirm an extracted passage and enter the room.
3. Speak or type and receive a grounded, captioned peer response.
4. See the supporting excerpt and study action on the board.
5. Change or replace one peer without losing progress.
6. Mark a difficulty, return later, and receive an optional continuation suggestion.
7. Review/delete memory and complete the whole flow with a keyboard.

## Constraints and assumptions

- Deadline: November 20, 2026 at 5:00 PM Eastern; judging links stay live through November 22.
- The entrant confirmed student, age, and geographic eligibility.
- The supplied HTML mockup is pre-existing concept work and will be credited/disclosed.
- No real learner data is needed for development, tests, screenshots, or judging.
- Optimize for one excellent end-to-end session rather than feature breadth.
- External publication and authenticated form submission require explicit account authorization and read-back verification.
