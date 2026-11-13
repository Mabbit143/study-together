# Privacy and data handling

Study Together is designed for synthetic or non-sensitive course material. Do not upload student records, grades, accommodations, health information, identifying information, confidential assignments, or material you do not have permission to use.

## In the browser

Text, PDF, and DOCX extraction happens locally. The app does not intentionally upload or retain the original file. The learner must confirm the excerpt used for study.

The browser stores peer preferences, learner-created notes, source highlights, compact helpful/difficult memories, prepared offline packs, subject selection, progress, and queued questions in local storage. These records remain on that browser and can be reviewed or deleted. There is no account or cross-device synchronization.

## Live AI routes

When live text services are configured, the confirmed excerpt and bounded, subject-selected context needed for the requested turn are sent to Google Gemini for generation and a separate grounding check. Google processes those requests under the Gemini API terms for the configured account and billing tier. Optional OpenAI transcription sends a bounded recording only after the learner explicitly starts and stops recording. Optional OpenAI speech sends visible caption text only after the learner presses Play AI voice.

Server routes are designed not to log excerpts, questions, transcripts, raw audio, or speech text. Vercel and configured service providers may still process operational metadata under their own policies. When configured, a durable Upstash counter uses a Vercel-provided client IP to enforce shared public usage limits; the application does not store that IP in the learner profile.

## Offline behavior

A prepared pack is grounded, precomputed JSON stored locally. It is not a downloaded AI model. Uncovered questions stay in a local outbox and are never transmitted merely because connectivity returns. The learner must approve each Send now action.

This prototype has no legal or institutional compliance certification. A school deployment would require its own privacy, security, records-retention, accessibility, and vendor review.
