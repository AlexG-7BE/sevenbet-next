# GB OpenAI Data Controls and Account Checklist

- **Evidence date:** 19 August 2026
- **Status:** ACCOUNT-SPECIFIC PROVIDER EVIDENCE: DEFERRED BY FOUNDER
- **Owner:** OpenAI organisation owner with Privacy / Security review

## Classification

- **PUBLIC PROVIDER FRAMEWORK: VERIFIED.** The current OpenAI Data Processing Addendum (effective 1 January 2026) supplements/is incorporated into the applicable Services Agreement and publishes processor, subprocessor and UK transfer terms.
- **APPLICATION DATA-MINIMISATION CONTROL: VERIFIED.** The repository uses server-side requests, `store: false`, bounded inputs/outputs and no intentional narrative logging.
- **ACCOUNT-SPECIFIC ZDR/MAM/REGION EVIDENCE: DEFERRED BY FOUNDER.** No Zero Data Retention, Modified Abuse Monitoring, region or organisation/project control is claimed.

## Repository-enforced controls

### Detected

- All OpenAI calls are server-side and use `OPENAI_API_KEY`; no browser-to-OpenAI path exists.
- Real-provider activation requires the exact Programme/provider flags and an allowed model.
- Responses API requests set `store: false` and `background: false`, use strict bounded JSON schemas, expose no tools and have bounded timeouts.
- Audio uses one bounded in-memory multipart file for `/v1/audio/transcriptions`; B4GAMBLE does not save the recording.
- Logs contain fixed operation/model/result, duration, token counts, character/byte counts and correlation-safe technical metadata, not typed words, transcripts, audio or generated content.
- OpenAI output is a suggestion the user can review/edit. It cannot award XP, complete a Mission, determine age/eligibility, make a safety decision or control commercial content.

### Inferred

- `store: false` prevents Responses application-state storage, but does not prove Zero Data Retention or absence of default abuse-monitoring retention.
- Official current documentation says API inputs/outputs are not used to train models by default unless the organisation explicitly opts in; default abuse-monitoring logs may retain customer content for up to 30 days. Approved Zero Data Retention or Modified Abuse Monitoring changes that posture for eligible endpoints/projects.
- The official endpoint table lists `/v1/audio/transcriptions` with no abuse-monitoring or application-state retention and lists Responses as ZDR eligible; contracted/account-specific controls still require evidence.

### Not detected

- Organisation/project training opt-in state; applicable Services Agreement/DPA acceptance; transfer applicability; project region; approved ZDR or MAM; per-project retention policy; data-sharing/evaluation opt-ins; admin membership; key restrictions/rotation; or screenshots/API output proving the live configuration.

## Required account posture

| Control | Required value/evidence | Status |
|---|---|---|
| Organisation/project identity | Exact production organisation and isolated project; owner and purpose recorded; no secret values in evidence | DEFERRED BY FOUNDER |
| Model-training/data sharing | Capture every training, feedback and evaluation sharing control; do not infer the account state from the provider default | DEFERRED BY FOUNDER |
| Abuse monitoring | Capture whether default monitoring, approved ZDR or approved MAM applies to each used endpoint/model | DEFERRED BY FOUNDER |
| Responses application state | `store: false` retained in every request; no background mode, conversation/thread state or stored response retrieval | VERIFIED IN APPLICATION |
| Transcription | Reconcile the used endpoint with the current official retention table and account posture | DEFERRED BY FOUNDER |
| Data residency | Record configured region and whether each used endpoint/model is covered | DEFERRED BY FOUNDER |
| DPA and transfer | Capture applicable Services Agreement/DPA acceptance, subprocessors and exact UK transfer route | DEFERRED BY FOUNDER |
| Access and keys | Capture admins, project-scoped key handling and rotation/revocation owner; never record secret values | DEFERRED BY FOUNDER |
| Retention/deletion | Reconcile account retention, incident and offboarding/deletion procedures with Privacy/DPIA | DEFERRED BY FOUNDER |
| Code/log boundary | No intentional narrative content in app logs; bounded input/time/schema; no tools; server-only requests | VERIFIED IN APPLICATION |

## Evidence capture procedure

1. In the OpenAI Platform organisation/project, open Data Controls and capture the organisation/project name, date and every sharing/training/retention control. Redact credentials, billing data and unrelated personal information.
2. Capture the approved ZDR/MAM scope and any endpoint/model exclusions. If neither is approved, record the default up-to-30-day abuse-monitoring posture without describing it as zero retention.
3. Capture project data-residency configuration and reconcile coverage for Responses and audio transcription.
4. Retain the applicable DPA/transfer terms and current subprocessor list, then record the applicable UK transfer route in the processor register.
5. Review organisation/project members, service accounts and keys; remove unnecessary access and assign rotation/revocation owners.
6. Run deterministic synthetic requests and inspect provider/app logs to confirm no content persistence or logging beyond the approved posture. Do not use real user content for the check.
7. Privacy and Security sign the evidence packet and record its review/expiry date.

## Open account follow-up

Founder Office has deferred account-specific capture without converting any unknown into a verified control. The OpenAI organisation owner must preserve server-side minimisation, then capture the exact project, sharing/training controls, retention/ZDR/MAM, region, applicable agreement/DPA, transfer route, access and deletion evidence. Any captured conflict with the Privacy Notice or DPIA must be escalated to Internal Legal/Compliance and Security.

## Official OpenAI sources

- [OpenAI API — Your data and default retention](https://developers.openai.com/api/docs/guides/your-data#default-usage-policies-by-endpoint)
- [OpenAI Data Processing Addendum](https://openai.com/en-GB/policies/data-processing-addendum/)
- [OpenAI Admin API — organisation data retention](https://developers.openai.com/api/reference/typescript/resources/admin/subresources/organization/subresources/data_retention)

Provider documentation states defaults; the account evidence packet is the authority for 7BE Inc.'s actual controls.
