# Credits and disclosures

## Project work

Study Together was built for the 2026 AccessED Hackathon. The original `study-group-mockup.html` supplied the pre-existing product concept and warm paper/green study-room direction. The implementation, accessible interaction contracts, document import, grounded AI routes, offline pack format, tests, and release documentation were developed during the event unless the repository history states otherwise.

AI tools assisted with brainstorming, architecture, code generation, test creation, review, debugging, and drafting. The entrant directed product decisions and is responsible for final review, service configuration, submission claims, and credited collaborators.

## Libraries and services

- Next.js, React, TypeScript, Tailwind CSS, and PostCSS
- PDF.js (`pdfjs-dist`) for browser PDF text extraction
- Mammoth for DOCX text extraction
- Zod for runtime schemas
- Google Gemini API for optional live generation and grounding verification
- OpenAI JavaScript SDK and OpenAI models for optional transcription and speech
- Upstash Redis REST for deployment-wide operation counters when configured
- Playwright and Axe for browser and accessibility checks
- Vitest and Testing Library for component and contract tests
- Vercel as the intended deployment platform

The application uses a system font stack and includes no third-party imagery in the core interface. Test materials and screenshots must remain synthetic or redistributable. Provider and library trademarks belong to their owners.
