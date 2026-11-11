# Privacy and data handling

Study Together is designed for synthetic or non-sensitive course material. Do not upload student records, grades, accommodations, health information, identifying information, confidential assignments, or material you do not have permission to use.

## In the browser

Text, PDF, and DOCX extraction happens locally. The app does not intentionally upload or retain the original file. The learner must confirm the excerpt used for study.

The browser stores peer preferences, learner-created notes, source highlights, compact helpful/difficult memories, prepared offline packs, subject selection, progress, and queued questions in local storage. These records remain on that browser and can be reviewed or deleted. There is no account or cross-device synchronization.

## Live AI routes

When live services are configured, the confirmed excerpt and the minimum context needed for the requested turn may be sent to OpenAI. Transcription sends a bounded recording only after the learner explicitly starts and stops recording. Optional speech sends visible caption text only after the learner presses Play AI voice.

Server routes are designed not to log excerpts, questions, transcripts, raw audio, or speech text. Vercel and configured service providers may still process operational metadata under their own policies. A durable Upstash counter uses a Vercel-provided client IP to enforce shared public usage limits; the application does not store that IP in the learner profile.

## Offline behavior

A prepared pack is grounded, precomputed JSON stored locally. It is not a downloaded AI model. Uncovered questions stay in a local outbox and are never transmitted merely because connectivity returns. The learner must approve each Send now action.

This prototype has no legal or institutional compliance certification. A school deployment would require its own privacy, security, records-retention, accessibility, and vendor review.
