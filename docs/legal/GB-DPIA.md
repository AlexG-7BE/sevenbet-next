# GB Data Protection Impact Assessment

- **Processing:** B4GAMBLE accounts, Active Control Programme, optional AI personalisation and voice transcription
- **Controller:** 7BE Inc., trading as B4GAMBLE
- **Assessment date:** 19 August 2026
- **Status:** FINAL — READY FOR CONTROLLER APPROVAL
- **Owner:** Chief Legal & Compliance Officer with Product and Security

## 1. Screening decision

A DPIA is required. The processing combines AI, systematic Programme progression/behaviour records, highly personal free text, possible health/special-category data and potentially vulnerable adults. ICO guidance identifies innovative AI combined with sensitive/highly personal data or tracking as a high-risk indicator.

This document is final as an implementation assessment. Controller approval must not authorise release until the external conditions in section 9 are evidenced. If those conditions do not reduce current high residual risks, consult the ICO before processing.

## 2. Evidence classification

### Detected

- Account data: name, email, image, provider identifier, session token/expiry, IP and user agent. Google provides identity only; OAuth tokens are transient and stripped before account relationship persistence.
- Programme entry has exactly two required checks: 18-or-over and Terms/Privacy. It does not perform DOB/KYC verification.
- A separate unchecked just-in-time authority appears immediately before typed or voice input. It names sensitive/health information, OpenAI AI/transcription, personalisation, non-use for offers/rankings and withdrawal consequences.
- Draft words remain in exact-subject browser `sessionStorage`; audio is in memory. The durable application saves confirmed structured Starting Point/progress, not the raw recording.
- Server endpoints require active authority, bounded bodies/rate limits, strict schemas and server-only OpenAI credentials. Responses set `store: false`; application logs exclude content.
- AI output is reviewable/editable and has no legal/similarly significant decision, diagnostic, safety, XP, completion or commercial authority.
- Protected Help is open without Programme consent and contains no casino, bonus or affiliate actions.
- Non-essential analytics is removed. Necessary storage is purpose-limited. Programme/Help/pause/vulnerability data is structurally separated from commercial selection/ranking/routing.

### Inferred

- Article 6(1)(b) supports account/core Programme delivery; optional AI personalisation relies on Article 6(1)(a) consent and Article 9(2)(a) explicit consent where content reveals special-category data. Security uses legitimate interests; legal duties use legal obligation. Final lawful-basis approval belongs to the controller/counsel.
- The service is not large-scale at the evidenced stage, but scale alone does not remove the need for this DPIA.
- An Article 27 UK representative is required. Vendor/transfer and OpenAI account evidence remain material release controls.

### Planned

- Obtain controller/counsel approval, Article 27 appointment, ICO fee execution, provider evidence and approved transfer routes.
- Run a synthetic Preview consent/withdrawal/provider/log/rights test at the exact release SHA.
- Review the DPIA on provider/model, purpose, data field, retention, commercial-use, scale, law or high-risk change and at least annually.

### Not detected

- Clinical treatment or diagnosis; solely automated significant decisions; children as intended users; behavioural advertising; Programme-driven commercial personalisation; saved audio; direct browser provider calls; or an active real GB affiliate recipient.

## 3. Processing description

| Stage | Data | Purpose and recipient | Storage / retention boundary |
|---|---|---|---|
| Public and access | Request/security data; adult and legal acknowledgements | Deliver and secure site/Programme; Vercel/application | Operational provider records; short-lived access authority |
| Account | Name/email/image/provider ID; session/security facts | Authenticate and maintain account; Google identity, Vercel, managed Postgres | Account lifecycle plus lawful security/backup needs |
| Programme draft | Typed words or audio/transcript, which may reveal health or vulnerability | Create a suggested Starting Point after explicit consent; OpenAI | Browser tab/in-memory at B4GAMBLE; provider posture subject to account evidence |
| Confirmed Programme | User-confirmed structured Starting Point, authority evidence, progress, XP and active-day facts | Deliver continuity/rewards; managed Postgres | Active account and documented deletion/backup process |
| Support/contact | Contact name/email/subject/message | Answer the person; Resend and support mailbox | Mailbox/provider retention to be account-approved |
| Protected Help | Ordinary request/security data only | Supply non-commercial safety/support information | No Help activity used for offers, rankings or Programme profiling |

## 4. Necessity and proportionality

- Identity and session data are necessary for a persistent account; Google is optional to email credentials and is identity-only.
- Free text is not required at the access gate and is requested only in context. The user may type instead of record audio, edit the suggested output, withdraw before saving or use protected Help without this consent.
- B4GAMBLE does not request diagnosis or medical history. A warning cannot prevent a person volunteering sensitive facts, so explicit consent, minimisation, local draft handling and provider controls are required.
- Only confirmed structured output and progression are durable. Raw audio and draft narrative are excluded from B4GAMBLE durable storage, URLs, analytics and logs.
- No AI output determines rights, access, gambling safety, reward authority or commerce.

## 5. Consultation

The Programme and consent copy reflects user control and protected Help access. Formal data-subject consultation is not evidenced. Before material expansion, the controller should consider a bounded usability/accessibility review of disclosure comprehension and withdrawal. No user research may use real sensitive narratives without a separate approved protocol.

## 6. Risk assessment

Scale: likelihood (L) 1–5 × severity (S) 1–5. `1–4 Low`, `5–9 Medium`, `10–25 High`.

| Risk | Initial | Existing/required controls | Current residual | Residual after external conditions |
|---|---:|---|---:|---:|
| Sensitive words exposed through provider retention, transfer or unauthorised access | 20 High | JIT explicit consent; server-only; minimised prompt; no identifiers; `store:false`; no content logs; require DPA/transfer plus ZDR or MAM evidence | 12 High | 8 Medium |
| Consent is bundled, unclear or cannot be withdrawn | 16 High | Separate unchecked JIT authority; two access checks only; exact purpose/provider/sensitive warning; server invalidation; clear-draft withdrawal; Help remains open | 6 Medium | 6 Medium |
| Audio persists or microphone starts unexpectedly | 16 High | User gesture; Type instead; 90-second/4MiB ceilings; memory-only Blob/file; track/chunk release; no B4GAMBLE audio save | 6 Medium | 6 Medium |
| AI output is wrong, over-relied upon or treated as clinical/safety advice | 16 High | Review/edit before save; bounded schemas; explicit non-clinical copy; no diagnosis/safety/eligibility/reward authority; protected Help/urgent boundary | 8 Medium | 8 Medium |
| Draft or one user's content crosses subjects/devices/logs/analytics | 20 High | Exact-subject `sessionStorage`; claim-only migration/source removal; memory clearing on subject change; no localStorage; no non-essential analytics; no body/content logs | 6 Medium | 6 Medium |
| Confirmed account/Programme data cannot be found, exported or erased | 15 High | Data-subject tooling, dry-run default, exact confirmations, bounded record graph, backup caveat; operational rehearsal still required | 10 High | 6 Medium |
| Provider/processor contracts or transfers are invalid/unknown | 20 High | Complete register and stop gate; require Article 28 terms, location, transfer route and TRA/data-protection test | 15 High | 8 Medium |
| Non-UK controller is unreachable to UK people/ICO | 15 High | Controller email/address published; Article 27 assessment and conditional public field | 12 High | 4 Low after signed appointment/publication |
| Necessary storage is repurposed for analytics/advertising/affiliate measurement | 16 High | Analytics package/root/flag removed; deterministic import/config tests; commercial firewall | 4 Low | 4 Low |
| Unknown/stale commercial evidence exposes a gambling action | 20 High | GB commercial/referral policy off; global redirect switch; cumulative server authorities; empty exact-domain evidence; legacy status stays `UNKNOWN` | 4 Low | 4 Low |
| Adult self-attestation is false | 15 High | Explicit unchecked 18+ control and server proof; Help open; no claim of KYC; commercial off | 9 Medium | 9 Medium |

## 7. Automated decision-making

No detected processing makes a solely automated decision producing legal or similarly significant effects. AI proposes wording; the user reviews/edits it. Server code, not AI, owns access, consent authority, XP, progress and completion. Commercial eligibility/routing is independent of Programme/AI data and remains off.

## 8. Data-subject and security controls

Public notice covers access, correction, erasure, restriction, objection, portability, consent withdrawal and ICO complaint. Identity verification and record discovery use bounded operational procedures. Credentials are server-only; secure/HTTP-only/same-site cookies, CSP, rate limits, strict request schemas, no content logs and managed backup/recovery controls reduce risk. Rights and incident rehearsals remain operational evidence gates.

## 9. Conditions before controller approval can authorise release

1. Signed Article 27 UK representative mandate and published particulars.
2. ICO registration/payment evidence and renewal owner.
3. Approved processor/transfer packet for Vercel, managed Postgres, Google identity, Resend, support mailbox and OpenAI.
4. OpenAI project evidence: training/sharing off; region recorded; ZDR or MAM scope proved; DPA/subprocessors/transfer approved.
5. Rights/deletion and incident-response rehearsal using synthetic data.
6. Exact-SHA Preview tests for consent, withdrawal, no-content logs, provider boundaries, Help, necessary-only technology and commercial denial.
7. Controller and counsel signatures below.

If any current residual risk remains High after these steps, processing must not proceed until the risk is reduced or the ICO is consulted under Article 36.

## 10. Approval record

| Role | Name | Decision/date |
|---|---|---|
| Controller / Founder |  |  |
| Legal / privacy reviewer |  |  |
| Security reviewer |  |  |
| Product owner |  |  |

## Primary sources

- [ICO — when a DPIA is required](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/accountability-and-governance/data-protection-impact-assessments-dpias/when-do-we-need-to-do-a-dpia/)
- [ICO — how to complete a DPIA](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/accountability-and-governance/data-protection-impact-assessments-dpias/how-do-we-do-a-dpia/)
- [ICO — consent](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/lawful-basis/consent/)
- [ICO — special-category data](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/special-category-data/)
- [ICO — consulting the ICO on residual high risk](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/accountability-and-governance/data-protection-impact-assessments-dpias/do-we-need-to-consult-the-ico/)
