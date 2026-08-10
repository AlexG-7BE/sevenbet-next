# PROGRAM-AI-ACTIVATE-01 Release Gates

Status date: **2026-08-10**

Authority: Founder Office package `PROGRAM-AI-ACTIVATE-01` and RFC-023. Base: `5a6ede5b45ad4cb3c71ac14190ad12286b335ac7`. Branch: `codex/program-ai-activate-01-openai-preview`.

This is the Mission-level Definition of Done record. The repository was scanned from its confirmed root with dependencies, generated/build/cache output and `tsconfig.tsbuildinfo` excluded from implementation conclusions.

## Detected and passing repository gates

- [x] OpenAI adapters implement only the existing provider-neutral `TranscriptionPort` and `ProgrammeAiPort`; provider types remain below domain/application boundaries.
- [x] Exact models: `gpt-4o-transcribe` and `gpt-5.6-terra`; Responses reasoning baseline `none`.
- [x] Every real request requires both exact server gates, `PROGRAM_AI_PROVIDER=openai` and a server-only key. Default/malformed state fails closed.
- [x] Responses request uses strict Structured Output, `store=false`, `background=false`, no tools, conversation, `previous_response_id`, durable thread or provider memory feature.
- [x] Completed-file voice is explicit, bounded to 90 seconds/8 MiB, accepts current WebM/Safari-compatible MP4 plus MP3/OGG/WAV server formats, exposes editable transcript and Type instead, and retains audio only for an explicit safe retry.
- [x] Situation text is at most 4,000 characters; two clarification answers are at most 1,000 characters each; clarification earns 0 XP.
- [x] A serializable metadata-only reservation caps Programme AI attempts at three per anonymous M1. Provider work is outside database transactions. No model work controls XP, completion, claim or formatting.
- [x] Strict local validation follows provider schema validation. Additional provider fields, hidden progression/risk authority and unsupported enum/generation values deny.
- [x] Provider timeouts are explicit (20 seconds AI; 25 seconds transcription), error taxonomy is closed and no automatic retry loop exists.
- [x] Technical logs contain only fixed provider/model/operation, latency/success/error and bounded count metadata. Automated tests prove fixture text, output text, raw errors and key material do not enter the log envelope.
- [x] M1 deterministic policy remains exactly `20 + 20`; clarification and registration remain 0; existing claim/idempotency tests pass.
- [x] Zero Prisma model, migration and runtime dependency changes in this activation package.
- [x] Commercial/safety separation and Protected Help behaviour remain unchanged.
- [x] Test-only synthetic corpus covers 20 required case families and is separately invoked through `npm run program-ai:openai-eval`; normal CI never needs a paid key.
- [x] Figma `954:6` recorder/intake authority was checked. No global token or generic component was added; implementation changes are limited to real recorder/transcription states, editable transcript and truthful provider fallback.

## Pending Preview release gates

- [ ] Confirm `OPENAI_API_KEY` is available in the intended Preview scope without printing or copying it.
- [ ] Compare Preview and Production database host/database identity plus safe fingerprints. A match or unknown result blocks activation.
- [ ] Confirm existing migration `0018_program_ai_m1_foundation` is applied to that isolated Preview database. Do not create a migration or touch Production.
- [ ] Configure both exact gates and fixed provider values in Preview only, then deploy the exact activation-branch head.
- [ ] Run the separate synthetic OpenAI eval and record aggregate pass/fail, token usage, latency and cost estimate without raw content.
- [ ] Complete controlled typed clear/ambiguous/sufficient, prompt-injection, casino-request, edit/confirm, exact XP/claim/logout and truthful failure QA.
- [ ] Complete controlled 20–30-second and approximately 60-second voice QA, microphone denial, transcription failure, editable transcript, track cleanup/cancel and mobile/desktop checks. Actual Safari/WebKit permission and encoding remain a manual/device gate.
- [ ] Verify Production `/program` still serves the legacy Programme and confirm Production Programme/provider flags and OpenAI credential were untouched.
- [ ] Exercise both Preview rollback switches and record feature-off behaviour. No database rollback is required.

## Current infrastructure and verification result

- **Detected:** local `.env`/`.env.local` and Vercel environment metadata contain no `OPENAI_API_KEY`; Vercel metadata contains no Programme AI/provider variables in Preview or Production. **CREDENTIAL REQUIRED.**
- **Detected:** a redacted Preview-only pull found provider-managed `ENVISO_*` database aliases present, but runtime `DATABASE_URL` and `DIRECT_URL` empty. No database connection or migration-0018 query was attempted. **PREVIEW DATABASE ISOLATION REQUIRED** before activation, because the runtime destination is not currently configured and a fresh Production fingerprint was not available for comparison.
- **Detected:** no Vercel environment variable was added, changed or removed; no deployment or migration was run; Production provider flags/credential remain absent from environment metadata.
- **Detected:** the separately invoked eval command loads successfully and fails closed with `CREDENTIAL REQUIRED` before any provider call while Preview configuration is absent.
- **Detected:** Production `https://b4gamble.com/program` returned the `ActiveControlProgramme` legacy implementation on 2026-08-10.
- **Passing locally:** typecheck, lint, focused Program AI Node suite (25/25), Prisma schema validation, production build, mocked Chromium recorder journey (1/1) and feature-off legacy Chromium regression (1/1).
- **Environment limitation:** the full database-backed Playwright lane could not run locally because the required disposable PostgreSQL service is absent and Docker/PostgreSQL tools are not installed. Its six tests remain a required PR CI gate against GitHub Actions PostgreSQL 16.

## Unrestricted Production gates — not satisfied

- **Not detected:** Founder acceptance of OpenAI default abuse-monitoring retention for unrestricted Production, or approved Zero Data Retention/Modified Abuse Monitoring.
- **Not detected:** completed OpenAI contracting entity/DPA, role, subprocessor, processing-location, support-access, deletion and UK transfer evidence.
- **Not detected:** final DPIA/counsel approval, production operational monitoring/human-review position or unrestricted user-data authority.
- **Not authorised:** any Production Program AI/provider flag or OpenAI credential activation.

Repository implementation can be reviewed and merged only under a later Founder action; this package explicitly says **DO NOT MERGE**. It cannot be declared Preview-live until every Preview release gate above has evidence.
