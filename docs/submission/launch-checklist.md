# Launch and submission checklist

Unchecked items are unverified. Do not turn them into claims without direct read-back evidence.

## Local release gate

- [x] Unit/component/API tests pass locally: 132/132 on November 12, 2026.
- [x] Lint and TypeScript pass locally.
- [x] Production build passes on Next.js 16.4.6 without network font fetches.
- [x] Chromium acceptance suite passes locally: 10/10, including both subjects and true offline reload.
- [x] Production dependency audit reports 0 vulnerabilities after the Next.js 16.4.6 security update.
- [x] Source secret/privacy scan found no key, private learner data, grade, uploaded source file, raw audio, transcript, test trace, screenshot, or video artifact.
- [x] README, privacy, limitations, credits, story, script, and screenshot list match the locally verified behavior.

## Account-authorized publication — partially verified

- [x] User approved the public `Mabbit143/study-together` repository and MIT license.
- [x] Created the GitHub remote and pushed the reviewed app: https://github.com/Mabbit143/study-together at `c8aecf284681686427df72e663e3ac4464e8990f`.
- [x] User approved and linked the `mabbit143/study-together` Vercel project.
- [x] Deployed and verified the credential-free demo mode at https://study-together-one.vercel.app on November 12, 2026 at 21:35:20 UTC.
- [x] Configured the protected Gemini secret in Vercel without placing its value in source or chat.
- [ ] Configure provider spending limits/alerts; optionally add Upstash for an application-level shared request cap.
- [ ] Verify text generation, transcription, and speech with synthetic data on the deployed environment.
- [x] Verified the logged-out landing page returns HTTP 200 and the deployed demo API returns a supported, cited response.
- [ ] Verify service-worker offline reload on the deployed origin and a second device/browser.

## Walkthrough and assets — not yet verified

- [ ] Capture the nine synthetic screenshots; record asset URLs and dimensions.
- [ ] Record the 2:00–3:00 walkthrough from the reviewed deployment.
- [ ] Verify visible/burned-in or platform captions, audio clarity, keyboard focus, synthetic data, and no personal information.
- [ ] Upload public/unlisted video and verify logged-out playback URL: ______.

## Devpost — not yet verified

- [ ] User reviews and approves final story, contributor list, credits, AI-assistance disclosure, pre-existing mockup disclosure, limitations, screenshots, repository, deployment, and video links.
- [ ] Submit before November 20, 2026 at 5:00 PM Eastern.
- [ ] Reopen the saved entry and read back every field, link, contributor, asset, disclosure, and submitted-state confirmation.
- [ ] Keep repository, app, and video links available through November 22, 2026.
- [ ] Record Devpost entry URL and confirmation time: ______.
- [ ] Only after all read-back checks pass, create and push annotated tag `accessed-2026-submission` at the verified commit.
