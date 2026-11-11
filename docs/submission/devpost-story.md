# Devpost story — Study Together

## The learner and the barrier

Study groups are usually designed around synchronized schedules, popular courses, reliable connectivity, and people who process information in similar ways. That leaves working students, caregivers, commuters, disabled learners, and students in uncommon subjects studying alone when the group is unavailable.

## What Study Together changes

Study Together creates a small, familiar AI study room on the learner’s schedule. A learner brings a text, PDF, or DOCX passage, confirms exactly what the group may use, and enters a room with a shared whiteboard and three clearly labeled AI peers. Jules facilitates, Rae checks the source, and Milo makes connections. Each can be adjusted independently for voice, personality, and study approach—or replaced—without erasing the learner’s study history.

Before: the learner rereads a difficult passage alone and loses the thread when connectivity or time runs out. After: the learner asks a question, interrupts when the explanation is not working, sees the cited passage on the whiteboard, saves what was difficult, and returns later to a suggested practice topic.

## Access and offline design

Text is always the complete experience: captions render before optional speech, recording never starts automatically, the transcript is editable, and every control is keyboard reachable. The room works at 320px and 200% zoom and is tested with Axe.

While connected, a learner can download a validated study pack containing source-grounded questions, hints, explanations, examples, practice, and likely follow-up branches. Offline, the pack remains useful without downloading a local AI model: the learner can follow prepared paths, search the confirmed excerpt, highlight, take notes, and complete deterministic practice. New questions wait locally. Reconnection does not send them; the learner chooses Send now or Delete.

## How it was built

The Next.js app parses PDF and DOCX files in the browser, keeps local profile data in browser storage, and exposes narrow server routes for grounded structured responses, transcription, and optional speech. A second structured verification pass rejects unsupported generated material. Paid routes fail closed unless a shared durable limit is configured. A deterministic Old English mode keeps judging reliable without credentials.

## Challenges and learning

The hardest part was not adding chat—it was keeping every layer honest. The team separated the learner’s confirmed source from uploaded files, made peer customization affect wording and study structure without weakening factual standards, protected newer turns from stale interrupted requests, and made offline progress survive subject switching and reloads. Real browser tests caught a server/client hydration mismatch and verified downloaded JSON, service-worker reload, two separate school subjects, and explicit outbox approval.

## Evidence and limits

The synthetic verification subjects are Old English/language and cell biology/science. The prototype does not browse the web, read image-only PDFs, run a local language model, guarantee correctness, or claim improved grades. Live provider/deployment verification, the public walkthrough URL, and final submission confirmation must be recorded in the launch checklist before those claims are published.

## Credits

The pre-existing HTML mockup and visual concept are disclosed. AI tools assisted with planning, implementation, tests, review, and writing. Full dependencies and provider disclosures are in `docs/credits.md`.
