# Launch and submission checklist

Unchecked items are unverified. Do not turn them into claims without direct read-back evidence.

## Local release gate

- [x] Unit/component/API tests pass locally: 126/126 on November 12, 2026.
- [x] Lint and TypeScript pass locally.
- [x] Production build passes on Next.js 16.4.6 without network font fetches.
- [x] Chromium acceptance suite passes locally: 10/10, including both subjects and true offline reload.
- [x] Production dependency audit reports 0 vulnerabilities after the Next.js 16.4.6 security update.
- [x] Source secret/privacy scan found no key, private learner data, grade, uploaded source file, raw audio, transcript, test trace, screenshot, or video artifact.
- [x] README, privacy, limitations, credits, story, script, and screenshot list match the locally verified behavior.

## Account-authorized publication — not yet verified

- [ ] User approves the exact public GitHub repository/organization and license.
- [ ] Create or attach the GitHub remote; push the reviewed commit; record repository URL and commit SHA: ______.
- [ ] User approves Vercel project/account and live service spending controls.
- [ ] Configure Vercel, OpenAI, and Upstash secrets without placing values in source or chat.
- [ ] Configure provider hard spending limits/alerts and confirm the app fails closed when the limiter is unavailable.
- [ ] Verify text generation, transcription, and speech with synthetic data on the deployed environment.
- [ ] Verify the logged-out deployment URL in a clean browser; record URL, commit SHA, and UTC time: ______.
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
