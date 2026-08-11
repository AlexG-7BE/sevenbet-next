# RFC-023: OpenAI Preview Voice and Personalisation Activation

- **Status:** Approved for bounded Preview implementation
- **Decision authority:** Founder Office `PROGRAM-AI-ACTIVATE-01`
- **Approved:** 2026-08-10
- **Scope:** Real OpenAI transcription and Programme AI adapters for the RFC-022 Mission 01 Preview vertical slice
- **Base:** `5a6ede5b45ad4cb3c71ac14190ad12286b335ac7`
- **Depends on:** Product Vision & Principles v2.0, RFC-017, RFC-021, RFC-022, PROGRAM-AI-01 Product Direction v2.2, Programme Architecture Standards, Backend Programme Standards and Programme Definition of Done
- **Supersedes:** RFC-022 only where RFC-022 explicitly deferred selection and activation of a real provider

## 1. Decision and release ceiling

B4GAMBLE will connect the existing provider-neutral `TranscriptionPort` and `ProgrammeAiPort` to the OpenAI API for controlled Preview validation with Founder/team/developer and synthetic test data only.

The selected models and endpoints are:

| Operation | Model | Endpoint | Required request policy |
| --- | --- | --- | --- |
| Completed-file voice transcription | `gpt-4o-transcribe` | `POST /v1/audio/transcriptions` | one in-memory file, English hint, no diarisation or speaker reference |
| Mission 01 structured transformation | `gpt-5.6-terra` | `POST /v1/responses` | `store=false`, `background=false`, `reasoning.effort=none`, strict Structured Output, no tools |

OpenAI is the only provider in this package. No second vendor, agent framework, Assistants API, conversation, provider thread, `previous_response_id`, file search, web search, RAG, embedding, vector database, tool call, code execution, computer use, TTS or realtime voice path is introduced.

This decision does not authorise unrestricted real-user Production data. Production remains on the legacy Programme with the PROGRAM-AI and real-provider flags absent or false. Default OpenAI Responses abuse-monitoring retention remains an unrestricted-Production activation gate unless Founder Office separately accepts an approved Zero Data Retention, Modified Abuse Monitoring or another explicitly reviewed retention position.

Provider facts are grounded in the official [GPT-5.6 Terra model contract](https://platform.openai.com/docs/models/gpt-5.6-terra), [GPT-4o Transcribe model contract](https://platform.openai.com/docs/models/gpt-4o-transcribe), [Structured Outputs guide](https://platform.openai.com/docs/guides/structured-outputs) and [API data controls](https://platform.openai.com/docs/models/default-usage-policies-by-endpoint). `store=false` disables application-state storage for the Responses request; it is not represented as zero provider retention. No prompt-cache key or extended-retention setting is sent.

## 2. Fail-closed runtime authority

The existing exact-string gate remains:

```text
PROGRAM_AI_V1_ENABLED=true
```

Real provider calls additionally require all of:

```text
PROGRAM_AI_REAL_PROVIDER_ENABLED=true
PROGRAM_AI_PROVIDER=openai
OPENAI_API_KEY=<server-only secret>
```

Server-side model configuration defaults to the approved IDs. Optional `PROGRAM_AI_OPENAI_MODEL` and `PROGRAM_AI_TRANSCRIPTION_MODEL` values may only equal the approved IDs; other values fail closed. No provider configuration uses a `NEXT_PUBLIC_` name or enters a client bundle, response, log, snapshot or committed file.

If the foundation gate is enabled while the real-provider gate is absent, typed Mission 01 retains the truthful RFC-022 user-controlled fallback and voice reports provider unavailability with an immediate Type instead route. If the real-provider gate is enabled but its provider/model/credential contract is incomplete, no external request occurs.

## 3. Adapter and dependency decision

Concrete OpenAI adapters live below the existing provider-neutral Programme ports. OpenAI-specific request and response shapes stay inside the adapter module and do not enter Programme domain contracts.

The implementation uses the platform `fetch`, `FormData`, `File`, `Blob` and `AbortSignal` APIs available in the repository's Node 24 runtime rather than adding the OpenAI SDK. This keeps the two narrow endpoint calls explicit, avoids a new runtime dependency, permits injected fetch/logger/clock test doubles, and does not reduce schema or timeout enforcement. A future SDK adoption would require a maintenance justification but not a Product decision if it preserves this RFC exactly.

## 4. Transcription contract

The browser records only after an explicit action. It stops automatically at 90 seconds and releases every media track. The completed in-memory Blob is uploaded once to the B4GAMBLE server, transcribed, presented in a visibly labelled editable transcript field, and released when replaced, cancelled, submitted or the component unmounts.

The server accepts only the bounded browser formats required by the current path: WebM, MP4/M4A, MPEG/MP3, OGG and WAV audio. The file limit is 8 MiB and the declared duration limit is 90 seconds. Requests outside the allow-list or either limit fail before an OpenAI call with `INPUT_TOO_LARGE` or a bounded validation error. The server sends `language=en` because GB v1 is English and the OpenAI transcription contract states that an ISO-639-1 language hint improves latency and accuracy.

Audio is never written to disk or object storage, persisted in Prisma, copied into analytics or logs, or sent to `ProgrammeAiPort`. There is no diarisation, known-speaker sample, speaker identity, voiceprint, acoustic emotion analysis or automatic submit on silence.

## 5. Programme AI contract

The Programme AI request contains only the current bounded situation, zero to two bounded clarification answers, input mode and the fixed policy prompt. User input is delimited as data and cannot alter the schema, policy, reward, commercial firewall or tool availability.

The strict Structured Output root is an object containing one nested closed result union:

```text
CLARIFICATION_REQUIRED
  type
  question
  reasonCode = DESIRED_CHANGE_UNCLEAR | CONTEXT_UNCLEAR | CONTRADICTION

STARTING_POINT_CANDIDATE
  type
  startingPoint
  desiredChange
  broadContext
  continuationCue
  chosenBoundaryAction = string | null
```

Every object rejects additional properties. All OpenAI output remains untrusted and must also pass the existing local closed validators and length/enum rules. Provider output cannot contain progression, XP, completion, entitlement, legal authority, diagnosis, risk, affordability or commercial destination authority.

Clarification defaults to zero and is allowed only when a useful Starting Point cannot be grounded without the user's desired change, context or resolution of a material contradiction. The maximum is two clarification turns. The server-owned structural draft enforces a maximum of three Programme AI calls per Mission 01; a failed or timed-out provider attempt consumes its call reservation so retry cannot exceed the cost ceiling. Transcription is a separate maximum-one call for each explicit completed recording attempt. No provider call occurs for XP, completion, registration, claim, formatting, analytics or deterministic validation.

## 6. Error, timeout and fallback policy

The bounded provider taxonomy is:

```text
PROVIDER_UNAVAILABLE
PROVIDER_TIMEOUT
PROVIDER_RATE_LIMIT
PROVIDER_INVALID_OUTPUT
TRANSCRIPTION_FAILED
INPUT_TOO_LARGE
```

Programme AI has a 20-second request timeout. Transcription has a 25-second request timeout. There is no automatic retry loop in this package. A Programme AI provider failure produces the truthful `USER_CONTROLLED_FALLBACK` draft; it is never labelled provider-generated. A transcription failure retains the current in-memory recording for one explicit user retry where available and always exposes Type instead. Raw OpenAI error bodies and request content are never returned to users or logs.

## 7. Observability and cost envelope

Provider logs contain only a fixed event name and bounded technical metadata: provider, approved model ID, operation, latency milliseconds, success/failure, bounded provider error category, audio byte count or input character count, input/output token counts when returned, and clarification count. Audio, transcript, situation, clarification answer, Starting Point text, health/support content, request body, provider response body and credentials are prohibited.

The Product limits are 90 seconds of recording, 4,000 situation characters, two 1,000-character clarification answers, three Programme AI calls, one transcription call per explicit recording submission and a small structured output ceiling. Paid live evaluation is separate from normal CI and uses only approved Preview test data.

## 8. Database, privacy and commercial containment

This package adds zero Prisma models and zero migrations. Migration `0018_program_ai_m1_foundation` must already exist on the isolated Preview database before feature-on live validation. No provider message, transcript, audio, original situation, clarification conversation, hidden reasoning or candidate is added to application persistence.

RFC-017/RFC-022 local-first lifecycle remains authoritative. Only the exact user-confirmed Starting Point becomes durable during the existing exact claim transaction. OpenAI output and protected Programme data remain unreachable by casino/bonus ranking, affiliate routing, retargeting, paid audiences and commercial personalisation.

Before enabling feature-on Preview, operators compare Preview and Production database destinations through safe host/database identity and non-secret fingerprints only. An identical destination blocks Preview activation and migrations. Production database configuration and data are not changed.

## 9. Verification, rollout and rollback

Normal CI uses deterministic provider doubles and does not require `OPENAI_API_KEY`. Coverage includes exact gates, adapter request shape, `store=false`, no provider memory/continuation, strict schema, timeout/error mapping, no-content logging, prompt-injection structure, input/audio limits, browser recorder cleanup, editable transcript, clarification/call ceilings, reward/claim regressions, commercial firewall and feature-off legacy behavior.

Live OpenAI evaluation is separately invoked and records aggregate schema/quality/safety outcomes, latency and usage/cost observations without printing fixture input or provider output. Feature-on Preview validation additionally requires an isolated non-Production database with migration 0018, controlled credentials and Founder/team/test-only access.

Rollback is immediate by setting either `PROGRAM_AI_REAL_PROVIDER_ENABLED=false` or `PROGRAM_AI_V1_ENABLED=false` in Preview. No schema or data rollback is required. Production flags, credentials, Google OAuth and database configuration remain untouched by this package.
