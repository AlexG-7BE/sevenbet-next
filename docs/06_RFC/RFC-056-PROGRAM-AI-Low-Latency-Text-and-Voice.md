# RFC-056: PROGRAM-AI Low-Latency Text and Voice

- **Status:** `ACTIVE` for Fast text generation; the voice sections are retired (Founder decision, 11 October 2026)
- **Decision authority:** Founder instructions, 25 and 26 September and 11 October 2026
- **Approved:** 2026-09-25
- **Scope:** Bounded latency reduction for Programme AI text generation and Mission 01 voice transcription
- **Base:** `3c95d276e8978ab0cb16a2add9e2c0d46cfe7092`
- **Depends on:** Product Vision & Principles, RFC-002, RFC-013, RFC-017, RFC-022, RFC-023 and RFC-025
- **Amends:** RFC-023 model/voice transport and RFC-025 provider-model/output-ceiling decisions only

## 11 October amendment — voice retired, text generation stands

The Founder decided on 11 October 2026 that Mission 01 takes answers picked
from a list, with no voice and no free text, and that the unused voice code
leaves the working project and stays recoverable under a tag
([ONE-SIGN-IN-FORM-2026-10-11](../07_Decisions/ONE-SIGN-IN-FORM-2026-10-11.md),
Parts 2 and 3).

**Still current authority:** the Fast text contract in the Decision table for
the Mission 01 Starting Point, Missions 02–10 guidance and Personal Review
regeneration (`gpt-6-luna`, Responses API, reasoning `none`, strict schemas,
the 320/320/620 output-token ceilings, Fast service tier, deterministic
initial Review read), with the observability, privacy and safety rules that
apply to those requests. Mission 01 now sends the picked answers as its text
input.

**Retired, with no runtime:** the 26 September unified composer amendment,
the two voice rows of the Decision table, the whole "Realtime voice boundary"
section, voice telemetry, and the WebRTC and voice parts of the verification
list. Both transcription routes, the realtime adapter and browser client, the
file adapter, the voice draft helper, their rate-limit buckets, the two
transcription model settings and the Programme microphone
`Permissions-Policy` were removed from the code. The tag
`archive/programme-voice-2026-10-11` marks the last commit where they worked
end to end.

The retired sections below are kept as the record of the decision as it was
taken. Bringing voice back needs a current Founder decision; the decision
record lists the steps.

## 26 September amendment — unified Mission 01 composer (retired 11 October 2026)

The current Founder instruction replaces the split voice/type presentation with
one Mission-owned editable composer. The situation textarea is always visible.
One microphone button starts and stops a voice session; partial and final text
use that same textarea. The only submission authority remains **Create my
Starting Point**. Mission 01 adds no age or consent prompt: it relies on the
already established Programme access boundary and the existing sensitive-input
authority service.

Each voice session owns only its provisional range in the draft. Partial updates
replace that range, the final reconciles it once, and another session appends a
new range. Manual changes outside the range are preserved; a manual change that
overlaps the provisional range wins and blocks subsequent provider text from
overwriting it. The existing 4,000-character situation limit applies without
deleting earlier text. File transcription fallback uses the same append and
reconciliation path.

All browser-originated Programme mutation requests derive age-attestation
evidence from the current exact subject's unexpired access authority at request
time. This includes the browser's direct SDP exchange. Missing, expired or
mismatched authority produces no header and therefore continues to fail closed
at middleware. This propagation carries existing authority; it does not create,
extend or replace authority.

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
| Mission 01 preferred voice (retired 11 October 2026) | `gpt-live-transcribe`, Realtime API over WebRTC | live partial in the editable composer, same-button manual commit, authoritative final reconciliation |
| Mission 01 voice fallback (retired 11 October 2026) | `gpt-4o-transcribe`, Audio Transcriptions API | current bounded in-memory completed file |

Explicit Review regeneration is a user-requested blocking interaction, so it uses
Fast rather than `auto`. The ordinary Review GET remains deterministic and
provider-free. Fast-tier response metadata is logged so a silent tier downgrade
can be detected. No provider call is added to render, navigation, XP, completion,
entitlement or commercial behaviour.

The output limits reduce the prior M1 `700`, guidance `500` and Review `700`
ceilings. Provider schemas are tightened to the smallest current presentation
contract while user-owned legacy/editable domain values keep their existing
accepted limits.

## Realtime voice boundary (retired 11 October 2026)

The browser obtains microphone permission and starts a `MediaRecorder` capture for
bounded fallback. When WebRTC is available, it also creates an SDP offer. A
Mission-owned server route validates the active sensitive-input authority, locale,
rate limit and a 32 KiB SDP ceiling, then exchanges the offer through
`POST /v1/realtime/calls` using the server-only OpenAI key and a hashed opaque
safety identifier. The browser receives only the SDP answer. No API key,
long-lived token or `NEXT_PUBLIC_` provider configuration enters client code.

The transcription session is `type: transcription`, uses
`gpt-live-transcribe`, the exact Programme language hint, `delay: minimal` and no
server VAD. Transcript deltas update only the current session-owned range in the
editable textarea. Pressing the same microphone button sends
`input_audio_buffer.commit`; only the matching completed event can reconcile that
range as the final. Partial or final text never auto-submits, creates a Starting
Point, completes an action or awards XP.

If WebRTC is unsupported, setup fails, the channel fails, the completed event is
invalid or finalization exceeds its bound, the already captured Blob goes through
the existing 4 MiB/90-second file route and appends through the same draft-range
logic. Stop, failure and unmount close the peer and release tracks; failed voice
leaves the prior draft intact. No audio or transcript is written to application
storage or content logs.

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
partial-versus-final reconciliation, access-header propagation and fail-closed
expiry/mismatch cases, SDP/key containment, repeated voice append, manual-edit
preservation, file fallback, typed input, guidance, Reviews, XP/progression
regressions and mobile layout.
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
