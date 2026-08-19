# GB OpenAI Data Controls and Account Checklist

- **Evidence date:** 19 August 2026
- **Status:** BLOCKED — EXTERNAL ACTION REQUIRED
- **Owner:** OpenAI organisation owner with Privacy / Security review

## Repository-enforced controls

### Detected

- All OpenAI calls are server-side and use `OPENAI_API_KEY`; no browser-to-OpenAI path exists.
- Real-provider activation requires the exact Programme/provider flags and an allowed model.
- Responses API requests set `store: false` and `background: false`, use strict bounded JSON schemas, expose no tools and have bounded timeouts.
- Audio uses one bounded in-memory multipart file for `/v1/audio/transcriptions`; B4GAMBLE does not save the recording.
- Logs contain fixed operation/model/result, duration, token counts, character/byte counts and correlation-safe technical metadata, not typed words, transcripts, audio or generated content.
- OpenAI output is a suggestion the user can review/edit. It cannot award XP, complete a Mission, determine age/eligibility, make a safety decision or control commercial content.

### Inferred

- `store: false` prevents Responses application-state storage, but does not by itself prove absence of default abuse-monitoring retention.
- Official current documentation says API data is not used to train models unless the organisation opts in; default abuse-monitoring logs may retain customer content for up to 30 days. Approved Zero Data Retention or Modified Abuse Monitoring changes that posture for eligible endpoints/projects.
- The official endpoint table lists `/v1/audio/transcriptions` with no abuse-monitoring or application-state retention and lists Responses as ZDR eligible; contracted/account-specific controls still require evidence.

### Not detected

- Organisation/project training opt-in state; DPA/transfer terms; subprocessor list; project region; approved ZDR or MAM; per-project retention policy; data-sharing/evaluation opt-ins; admin membership; key restrictions/rotation; or screenshots/API output proving the live configuration.

## Required account posture

| Control | Required value/evidence | Status |
|---|---|---|
| Organisation/project identity | Exact production organisation and isolated project; owner and purpose recorded; no secret values in evidence | BLOCKED — EXTERNAL ACTION REQUIRED |
| Model-training/data sharing | All training, feedback and evaluation sharing opt-ins off unless a later DPIA/RFC expressly approves them | BLOCKED — EXTERNAL ACTION REQUIRED |
| Abuse monitoring | Approved ZDR, or approved MAM combined with repository `store: false`, for every eligible Responses model/endpoint handling Programme content | BLOCKED — EXTERNAL ACTION REQUIRED |
| Responses application state | `store: false` retained in every request; no background mode, conversation/thread state or stored response retrieval | COMPLETE |
| Transcription | Confirm endpoint/account retention matches the official no-retention table; retain evidence | BLOCKED — EXTERNAL ACTION REQUIRED |
| Data residency | Record configured region and whether each used endpoint/model is covered | BLOCKED — EXTERNAL ACTION REQUIRED |
| DPA and transfer | Applicable executed/accepted DPA; subprocessors; DPF or UK Addendum/IDTA; TRA/data-protection test where required | BLOCKED — EXTERNAL ACTION REQUIRED |
| Access and keys | Least-privilege organisation/project admins; project-scoped key; secret-store only; rotation/revocation owner; no key in browser/repo/logs | BLOCKED — EXTERNAL ACTION REQUIRED |
| Retention/deletion | Account retention policy, provider evidence, incident route and offboarding/deletion procedure reconciled with Privacy/DPIA | BLOCKED — EXTERNAL ACTION REQUIRED |
| Code/log boundary | No user content in app logs; bounded input/time/schema; no tools; server-only requests | COMPLETE |

## Evidence capture procedure

1. In the OpenAI Platform organisation/project, open Data Controls and capture the organisation/project name, date and every sharing/training/retention control. Redact credentials, billing data and unrelated personal information.
2. Capture the approved ZDR/MAM scope and any endpoint/model exclusions. If neither is approved, stop: Controller/Legal must explicitly assess the default up-to-30-day abuse-log exposure before release.
3. Capture project data-residency configuration and reconcile coverage for Responses and audio transcription.
4. Retain the applicable DPA/transfer terms and current subprocessor list, then record the applicable UK transfer route in the processor register.
5. Review organisation/project members, service accounts and keys; remove unnecessary access and assign rotation/revocation owners.
6. Run deterministic synthetic requests and inspect provider/app logs to confirm no content persistence or logging beyond the approved posture. Do not use real user content for the check.
7. Privacy and Security sign the evidence packet and record its review/expiry date.

## Stop conditions

Do not approve the Programme provider posture if: training/data sharing is on; the project or region is unidentified; DPA/transfer evidence is absent; ZDR/MAM scope is assumed rather than proved; a used model/endpoint is outside the approved scope; content appears in application logs; or the captured retention conflicts with the Privacy Notice/DPIA.

## Official OpenAI sources

- [OpenAI API — Your data and default retention](https://developers.openai.com/api/docs/guides/your-data#default-usage-policies-by-endpoint)
- [OpenAI Admin API — organisation data retention](https://developers.openai.com/api/reference/typescript/resources/admin/subresources/organization/subresources/data_retention)

Provider documentation states defaults; the account evidence packet is the authority for 7BE Inc.'s actual controls.
