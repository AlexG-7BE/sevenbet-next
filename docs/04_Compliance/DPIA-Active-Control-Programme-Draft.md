# Draft DPIA — Active Control Programme

- **Status:** Draft for Privacy/legal review; not final approval
- **Last updated:** 2026-08-10
- **Decision baseline:** RFC-017, RFC-022 and RFC-023 Preview ceiling

## Processing summary

The Programme provides adult users with education, private reflection, decision support and boundary planning. The account stores identity/authentication, enrolment, task and mission completion, XP, streak, achievements and minimum structured continuity. Raw personal narrative is processed in browser memory or subject-isolated, tab-scoped `sessionStorage` and is rejected from durable server writes. RFC-023 permits raw voice/transcript/current-turn text to transit B4GAMBLE server memory and OpenAI only for controlled Founder/team/synthetic Preview validation; it does not authorise unrestricted Production users.

Self-Check and Personal Limit Tracker values remain local. Help remains open and separated from commercial eligibility. Programme, Help, pause and vulnerability data are prohibited from casino/bonus ranking, affiliate routing and commercial personalisation.

## Necessity and proportionality

- Account identity is necessary only for requested cross-request progression and rewards.
- Raw narrative is not necessary for server progression and therefore stays local.
- Exact server allow-lists and neutral legacy-column markers reduce collection without a destructive migration.
- 18+ self-attestation gates account creation and Programme mutation; no date of birth or KYC is collected.
- Users can clear local narrative, request export and request active-database erasure.
- Dashboard presenters do not repopulate historic raw narrative into active inputs.

## Principal risks and controls

| Risk | Current control | Residual/open action |
|---|---|---|
| Free text reveals health, vulnerability or gambling-harm information | Local-first session storage; exact server deny-list; reflection POST retired before parsing | Browser/session restoration behaviour; verify with browser network/storage tests |
| Protected data affects commercial experience | Separate module boundaries, DTO tests, GB/referral disabled, affiliate engine off | Continue structural checks on every commercial change |
| Cross-account disclosure | Server session ownership and enrollment scoping; authenticated export | Complete authenticated browser penetration/regression exercise |
| Historic server narrative remains | Hidden from active dashboard; export/erasure available; no new writes | Quantify Production population and approve legacy cleanup/notice plan |
| Under-18 persistent access | Unchecked self-attestation plus server mutation/signup enforcement | **AGE ATTESTATION PERSISTENCE — P1 OPEN**; legal review of proportionality/evidence |
| Cross-user local narrative or age inheritance | Random journey and exact user-ID namespaces; fail-closed subject transition; exact claim-only migration; source removal; User A/B regression | Reassess if authentication/session architecture changes |
| DSAR export or deletion error | Exact lookup; claim/session capture; dry-run relation counts; mode-0600 exclusive output; isolated User A/B erasure test; exact confirmation in every environment and a second Production confirmation | Approve secure delivery and case-management system |
| Provider/log/backup exposure | Data minimisation and bounded error responses | Verify provider retention, regions, subprocessors, transfers, backup expiry and log controls |
| Preview OpenAI processing of sensitive narrative/audio | Dual default-off server gates; server-only key; `store=false`; no background/conversation/previous response/tools; bounded current-turn data; no raw application logs/database retention; isolated Preview test data only | Verify account training/data-sharing control, DPA/entity/subprocessors/locations/transfer path and default abuse-monitoring retention; unrestricted Production remains blocked pending approved ZDR/MAM or another reviewed position |
| Model output creates clinical/commercial/progression authority | Strict closed schema plus local validation; prompt prohibits diagnosis/safety/affordability/commercial/XP decisions; provider has no tools or Prisma; deterministic rewards remain server-owned; commercial firewall tests | Complete controlled live safety corpus and human review before any wider activation; retain immediate provider kill switch |
| Re-identification or sensitive inferences from structured boundary values | No commercial use; minimum fields; access scoped to account service | Review whether numeric boundary retention remains necessary after product validation |

## Lawful-basis and special-category review

Contract necessity is the current product basis for requested account/progression features; legitimate interests may apply to bounded security and reliability processing. This draft does not determine that voluntarily entered gambling-control information is or is not special-category data in every context. The local-first design avoids intentionally retaining raw health/vulnerability narrative while that legal analysis remains open. Explicit consent is not inferred from accepting Terms.

## Consultation and sign-off gates

Required before final DPIA approval: qualified UK privacy counsel; named Privacy/Security owners; processor and transfer evidence, including the exact OpenAI account/data-control position; appointment of the required UK representative; ICO assessment; legacy-data population/cleanup decision; retention periods; secure rights-delivery method; breach tabletop; accessibility and browser privacy verification.

This draft must not be cited as completed regulatory approval.
