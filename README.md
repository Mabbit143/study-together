# Study Together

Study Together is an accessible AI study room for learners whose schedules, subjects, or access needs make ordinary study groups difficult. Bring confirmed course material, work with three customizable AI study partners on a shared whiteboard, and prepare a grounded text study pack for low-connectivity use.

The public prototype requires no account. The included Old English sample is synthetic and deterministic, so judges can complete the core flow even when paid AI services are unavailable.

## What works

- Paste text or import text, PDF, and DOCX files in the browser.
- Review and confirm an excerpt before it is sent to any AI route.
- Study with Jules, Rae, and Milo. Each peer has an independent voice, personality, and study approach and can be replaced without deleting learner history.
- Type or explicitly record a turn, review the transcript, interrupt a response, and keep captions visible before optional AI-generated speech.
- Keep notes, source highlights, examples, and the selected tool on one shared whiteboard.
- Save helpful explanations and difficult topics locally, then resume an explicitly selected subject.
- Download and re-import a validated offline study pack. Offline tools include prepared branches, search, highlights, notes, and deterministic practice.
- Queue uncovered offline questions locally. Reconnection never sends them automatically; each item requires Send now or Delete.

## Local setup

Requirements: Node.js 22.13+ (or 24.15+), npm 11+, and a current Chromium-based browser.

```powershell
npm install --ignore-scripts
npx playwright install chromium
npm test
npm run build
npm run start
```

Open `http://localhost:3000`. Run release browser checks after a production build:

```powershell
npm run test:e2e
```

## Optional live services

The deterministic demo and prepared local tools work without credentials. Live generation fails closed unless the deployment has all required secrets and a trusted Vercel client-IP header:

- `OPENAI_API_KEY`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `OPENAI_TEXT_MODEL` (defaults to `gpt-6-luna`)
- `OPENAI_TRANSCRIBE_MODEL` (defaults to `gpt-transcribe`)
- `OPENAI_SPEECH_MODEL` (temporary default `gpt-4o-mini-tts`)

Never place real values in `.env.example` or client code. The temporary speech adapter must migrate to `gpt-realtime-2.1-mini` through the Realtime API before the documented January 6, 2027 shutdown of `gpt-4o-mini-tts`.

## Data flow

- File parsing happens in the browser. Uploaded files are not retained by this app.
- Only the learner-confirmed excerpt, current question, selected peer settings, bounded recent turns, and bounded memories scoped to the current subject are sent to live server routes. OpenAI API storage is disabled for generation and grounding verification.
- Server logs intentionally omit excerpts, transcripts, speech text, raw audio, and secrets.
- Preferences, memory, prepared packs, whiteboard state, and queued questions stay in browser local storage until the learner deletes them.
- Prepared offline study is precomputed text, not a local AI model. Free-form offline questions wait for explicit approval after reconnection.

Read [Privacy](docs/privacy.md), [Limitations](docs/limitations.md), and [Credits](docs/credits.md) before deployment.

## Verification

The release suite covers real PDF and DOCX extraction, Unicode, two distinct subjects (Old English/language and cell biology/science), peer settings, interruption, memory return, whiteboard persistence, downloaded pack contents and re-import, service-worker offline reload, explicit outbox approval, 320px layout, 200% zoom, denied microphone fallback, provider outage recovery, and serious/critical Axe checks.

No claim is made that Study Together improves grades, replaces instructors, or guarantees factual correctness. Learners should compare important guidance with course materials and qualified educators.

## Release status

Local source and tests can be release-ready independently of publication. GitHub push, Vercel configuration, live-provider verification, walkthrough upload, Devpost submission/read-back, and the final release tag remain explicitly account-authorized steps in [the launch checklist](docs/submission/launch-checklist.md).

## License

MIT. See [LICENSE](LICENSE).

