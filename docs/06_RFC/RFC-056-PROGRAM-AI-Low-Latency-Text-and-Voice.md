# RFC-056: PROGRAM-AI Low-Latency Text and Voice

- **Status:** `ACTIVE`
- **Decision authority:** Founder instruction, 25 September 2026
- **Approved:** 2026-09-25
- **Scope:** Bounded latency reduction for Programme AI text generation and Mission 01 voice transcription
- **Base:** `3c95d276e8978ab0cb16a2add9e2c0d46cfe7092`
- **Depends on:** Product Vision & Principles, RFC-002, RFC-013, RFC-017, RFC-022, RFC-023 and RFC-025
- **Amends:** RFC-023 model/voice transport and RFC-025 provider-model/output-ceiling decisions only

## Decision

The Programme keeps its existing Mission-owned provider boundaries, deterministic
fallbacks, safety policy, reward authority and commercial firewall while reducing
user-visible latency:

| Operation | Current authority | Latency contract |
| --- | --- | --- |
| Mission 01 Starting Point | `gpt-6-luna`, Responses API, reasoning `none` | strict output schema, 320-token ceiling, Fast service tier |
| Missions 02–10 guidance | `gpt-6-luna`, Responses API, reasoning `none` | operation schema, 320-token ceiling, Fast service tier |
| Personal Review regeneration | `gpt-6-luna`, Responses API, reasoning `none` | operation schema, 620-token ceiling, Fast service tier |
| Initial Personal Review read | existing deterministic server result | no provider wait |
| Mission 01 preferred voice | `gpt-live-transcribe`, Realtime API over WebRTC | live partial display, manual commit, authoritative final only |
| Mission 01 voice fallback | `gpt-4o-transcribe`, Audio Transcriptions API | current bounded in-memory completed file |

Explicit Review regeneration is a user-requested blocking interaction, so it uses
Fast rather than `auto`. The ordinary Review GET remains deterministic and
provider-free. Fast-tier response metadata is logged so a silent tier downgrade
can be detected. No provider call is added to render, navigation, XP, completion,
entitlement or commercial behaviour.

The output limits reduce the prior M1 `700`, guidance `500` and Review `700`
ceilings. Provider schemas are tightened to the smallest current presentation
contract while user-owned legacy/editable domain values keep their existing
accepted limits.

## Realtime voice boundary

The browser obtains microphone permission and starts a `MediaRecorder` capture for
bounded fallback. When WebRTC is available, it also creates an SDP offer. A
Mission-owned server route validates the active sensitive-input authority, locale,
rate limit and a 32 KiB SDP ceiling, then exchanges the offer through
`POST /v1/realtime/calls` using the server-only OpenAI key and a hashed opaque
safety identifier. The browser receives only the SDP answer. No API key,
long-lived token or `NEXT_PUBLIC_` provider configuration enters client code.

The transcription session is `type: transcription`, uses
`gpt-live-transcribe`, the exact Programme language hint, `delay: minimal` and no
server VAD. Transcript deltas are display-only. Tapping Done sends
`input_audio_buffer.commit`; only the matching completed event can populate the
editable transcript. Partial text never auto-submits, creates a Starting Point,
completes an action or awards XP.

If WebRTC is unsupported, setup fails, the channel fails, the completed event is
invalid or finalization exceeds its bound, the already captured Blob goes through
the existing 4 MiB/90-second file route. Cancel, unmount and Type instead close the
peer, release tracks and discard the recording. No audio or transcript is written
to application storage or content logs.

## Observability, privacy and safety

Server logs remain metadata-only: fixed event, provider, model, operation,
latency, success/error category, token counts where returned, requested/actual
service tier and bounded input/audio counts. Client voice telemetry is limited to
mode, recording duration, first-partial latency, stop-to-final latency, file
request latency and a closed fallback category. Raw input, partial/final
transcripts, SDP, provider bodies and credentials are prohibited.

The current prompt-injection boundary, strict schemas, local output safety checks,
deterministic fallback, protected Help behaviour, commercial separation,
server-owned XP/progression and explicit consent remain unchanged. The OpenAI
Realtime and Responses endpoints have no application-state retention in the
selected configuration, but current default abuse-monitoring retention can still
be up to 30 days. Account-specific ZDR/MAM, contracting, location and transfer
evidence remain Production gates; code does not infer them.

## Verification and release ceiling

Normal CI uses provider and WebRTC doubles. It must cover exact model gates,
reasoning `none`, service tier, schema/token ceilings, no-content logging,
partial-versus-final authority, SDP/key containment, file fallback, cancellation,
typed fallback, guidance, Reviews, XP/progression regressions and mobile layout.
The existing 20-case synthetic evaluation remains the quality gate for live model
comparison; absence of an approved credential is recorded as `UNKNOWN`, never a
pass.

This RFC authorises one reviewable PR and isolated Preview validation. It does not
authorise merge, Production deployment, Production configuration or Production
data processing. Preview rollout must use an isolated database and existing
server-only gates. Rollback disables `PROGRAM_AI_REAL_PROVIDER_ENABLED` for
deterministic text/type fallback, or `PROGRAM_AI_V1_ENABLED` for the whole
PROGRAM-AI runtime. No schema or data rollback is required.

## Provider evidence checked for this decision

- [GPT-6 Luna model](https://developers.openai.com/api/docs/models/gpt-6-luna)
- [Fast mode](https://developers.openai.com/api/docs/guides/fast-mode)
- [Realtime transcription](https://developers.openai.com/api/docs/guides/realtime-transcription)
- [WebRTC](https://developers.openai.com/api/docs/guides/voice-webrtc)
- [Data controls](https://developers.openai.com/api/docs/guides/your-data)
