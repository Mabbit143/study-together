# Limitations

- AI study partners can be wrong. Grounding validation reduces unsupported output but cannot guarantee truth, completeness, or pedagogical quality.
- Answers are limited to the learner-confirmed excerpt unless clearly labeled as general knowledge. The app does not browse the web.
- PDF and DOCX extraction supports text-based documents. Scanned or image-only PDFs need OCR elsewhere; encrypted, malformed, suspicious, empty, or oversized files are rejected with recovery guidance.
- Voice is turn-based, not simultaneous conversation. The learner explicitly records, stops, reviews the transcript, and submits. Microphone access is optional.
- Optional speech is AI-generated and may pronounce specialized material poorly. The current isolated `gpt-4o-mini-tts` adapter is deprecated and must migrate before January 6, 2027.
- Prepared offline study contains only generated branches and deterministic local tools. It cannot answer a new free-form question without reconnecting and explicit approval.
- Data is local to one browser. Clearing browser data removes preferences, memories, packs, progress, and queued questions; there is no recovery or cross-device sync.
- Public live text requires a correctly configured Gemini key. Optional Upstash limiting adds a shared per-IP cap; otherwise the configured Gemini project quota is the cap.
- IP-based limits can affect learners on shared networks and are not a complete deployment budget control. One text operation uses generation plus a separate grounding-verification call. Provider budgets, alerts, and deployment monitoring should be configured before broader public use.
- Browser extraction, service-worker storage, microphone behavior, and audio playback vary by device and browser.
- The prototype makes no claims about grades, retention, accessibility certification, or learning outcomes and does not replace instructors, disability services, tutoring, or academic policies.
