# GB Partner Onboarding Runbook

- **Status:** Ready for Founder review; no partner activation authorized
- **Authority:** [RFC-015](../06_RFC/RFC-015-GB-Commercial-Partner-Authority.md)
- **Technical contract:** [GB Commercial Partner Authority](../05_Engineering/GB-Commercial-Partner-Authority.md)
- **Candidate/application evidence:** [GB Partner Readiness Package](../08_Research/GB-Partner-Readiness-Package.md)
- **Last reviewed:** 2026-08-08

## Purpose and boundary

This runbook governs application, due diligence, evidence entry, Preview proof, first activation, recurring review, pause and incident response for a GB commercial partner. It does not authorize outreach, acceptance of terms, account creation, credential creation, Production data mutation, policy change or live traffic.

Only Founder Office may submit or accept a commercial application. Legal / Compliance owns final regulatory and contract interpretation. Technical owners cannot infer approval from an active provider account or database state.

## Roles

| Role | Responsibility |
| --- | --- |
| Founder Office / Commercial | Select candidate, authorize outreach, negotiate economics, approve commercial intent and name account manager |
| Legal / Compliance | Review counterparty, LCCP/advertising obligations, significant conditions, data/consent, channels and final launch authority |
| Technical owner | Configure the existing programme/offer/link stack, implement evidence references, run validation and release safely |
| Evidence reviewer | Verify exact current licence, domain, operator, offer and terms from primary sources and record timestamps |
| Partner account manager | Maintain external relationship, change notices, creatives, links, reporting and incident escalation |

Use role names until an authoritative individual assignment exists.

## Phase 0 — Founder decision before outreach

1. Select a candidate from the readiness package based on evidence, accessibility, fit and operating burden, not payout alone.
2. Confirm the legal B4GAMBLE applicant entity, registration, business address, tax status, beneficial-owner information and authorized signatory outside Git.
3. Confirm the authoritative website/domain, business and compliance contacts, current audience evidence and proposed traffic channels.
4. Choose the proposed commercial model and negotiation limits. Do not store banking, tax or identity documents in Git or general metadata.
5. Obtain Founder authorization to submit. COMM-01 itself does not grant it.

Stop if applicant identity, website ownership, intended channels or the candidate's official application path cannot be verified.

## Phase 1 — Application

1. Use only the candidate's official programme page or an independently verified official contact.
2. Use the truthful application pack; replace every `FOUNDER INPUT REQUIRED` before submission.
3. State that B4GAMBLE is an information, education and comparison publisher, not a gambling operator, clinical service or recovery provider.
4. State only current channels. Do not claim paid ads, email, SMS, push, retargeting, traffic volume, conversions or markets without evidence and approval.
5. Do not accept unpublished side terms or insert API credentials into notes, email drafts, screenshots, repository files or programme metadata.
6. Retain the submitted application and response in the approved external document system; record only opaque references later.

## Phase 2 — Contract and compliance review

Legal / Compliance must resolve and record:

- exact contracting entity and its relationship to the licensed operator;
- the exact GB operator/programme/casino/domain scope;
- approved websites, markets and acquisition channels;
- LCCP 1.1.2 third-party obligations and termination/suspension rights;
- CAP/BCAP and operator-specific creative/significant-condition requirements;
- prohibited content, keywords, channels, placements and audience targeting;
- tracking/cookie/consent, postback, personal-data and processor responsibilities;
- payment model, definitions, deductions, negative carryover, chargebacks, term and termination;
- creative and link change-control obligations;
- audit/monitoring access and incident-notification obligations; and
- the exact evidence that permits B4GAMBLE to promote each casino/domain.

An application acceptance or dashboard login is not enough. The agreement must be executed/active according to the actual contract and represented as `ACTIVE` in the B4GAMBLE evidence contract only after approval.

## Phase 3 — Due diligence and primary evidence

The evidence reviewer must independently collect:

1. exact operator/legal and trading names;
2. current remote casino licence and account reference in the official Gambling Commission register;
3. exact destination domain and current register status;
4. casino → brand → operator relationship;
5. contract/network programme → exact operator/casino relationship;
6. current offer and full operator terms;
7. official affiliate link/creative and allowed GB scope;
8. tracking link destination, HTTPS safety and health evidence; and
9. approval/review timestamps and next revalidation date.

Official licence/domain and tracking evidence must be less than seven days old at activation. Time-limited bonus evidence must be less than 24 hours old; evergreen bonus evidence less than seven days old. Agreement review must be less than 90 days old and is also event-driven.

White-label status requires a separate Legal review and explicit licensed-operator relationship. It is never treated as the domain holding an independent licence.

## Phase 4 — Evidence entry

### Partner agreement

Enter only the typed `metadata.gbCommercialAuthority` facts described in the technical contract. Record channels exactly as approved; do not infer `DIRECT_LINK` from editorial, review or bonus-page permission. Store external document/source/contact references, not documents or personal/secret contents.

### Domain evidence

Add one reviewed typed record to `lib/affiliate-commercial/gb-domain-evidence.ts` only after the real agreement and due diligence are approved. The record must use exact internal casino/operator/brand/licence IDs and the official public account reference/domain.

Every real record change requires:

- primary-source links and check timestamps in the PR;
- evidence-review sign-off;
- exact-domain and relationship tests;
- Legal acknowledgement for white-label or ambiguous structures;
- Preview proof; and
- no policy activation in the same change unless separately authorized.

### Programme

Use the existing `AffiliateProgram`; do not create a parallel partner model. Link the exact casino, use the exact structured operator identity, select explicit `GB`, keep `trustedAutoActivation=false`, and record opaque account/provider/credential references only.

Credentials belong in the approved encrypted secret system. They never belong in Prisma JSON, Git, public APIs, logs or screenshots.

### Offer and link

Use an explicit GB allow-list. Do not use `GLOBAL` as GB authority. Keep imported offers draft and links inactive until reviewed. An active GB offer requires the agreement to approve `DIRECT_LINK`; content-only channel approval is insufficient. Record `verifiedAt`, `lastCheckedAt`, effective dates and current terms. A linked bonus must meet the technical/significant-condition gate.

## Phase 5 — Preview proof

Use the isolated Preview environment. Never copy Production data. Test records must be disposable `.invalid` fixtures or real approved partner data entered under separate authority.

Prove all of the following on the exact candidate commit:

- current jurisdiction deny still overrides every lower gate;
- missing/invalid/stale agreement denies;
- editorial-only, casino-review-only and bonus-page-only agreements deny outbound readiness with `GB_PARTNER_CHANNEL_NOT_APPROVED`;
- operator/brand/casino/licence/domain exact chain passes only when complete;
- inactive, white-label or stale domain evidence denies;
- programme/offer/link pause and expiry deny without changing editorial publication;
- provider sync cannot activate the GB offer/link;
- bonus technical terms and freshness deny independently;
- high payout cannot bypass missing authority;
- raw destination and evidence do not appear in public DTOs;
- `/r` rechecks at click time;
- `/go` remains unavailable; and
- global kill switch denies.

Required local and CI checks are maintained in RFC-015. Preview must be `READY`, public pages must remain healthy, and no real click may be executed before authorization.

## Phase 6 — First-partner activation gate

Activation needs every item below and an explicit Founder `GO`:

1. real agreement active and current;
2. agreement explicitly approves `DIRECT_LINK` for the intended outbound action;
3. Legal / Compliance approval recorded externally;
4. exact structured operator/brand/casino relation;
5. current remote casino licence and official evidence;
6. exact active domain evidence;
7. approved programme, offer, link and optional bonus terms;
8. approved public disclosure/significant-condition surfaces;
9. current Production smoke and healthy logs;
10. Preview validation at the exact release head;
11. recovery/closed-beta gates where stateful scope requires them;
12. a separately approved permissive GB policy change;
13. explicit authorization to enable the redirect engine; and
14. Founder explicit `GO` after reviewing the final real destination.

There is no hidden or single activation toggle. The policy, evidence and global kill switch are independent controls.

## Review cadence

| Evidence | Maximum interval | Event-driven review |
| --- | --- | --- |
| Licence and official licence evidence | 7 days | Regulatory action, status/operator change |
| Exact domain register evidence | 7 days | Domain/status/operator/white-label change |
| Tracking verification and health | 7 days | Redirect, certificate, destination or provider change |
| Time-limited bonus | 24 hours | Any creative/term/value/date change |
| Evergreen bonus | 7 days | Any creative/term/value change |
| Partner agreement | 90 days and before expiry | Contract/entity/market/channel/model/termination change |
| Jurisdiction policy | Existing policy validity window | Regulatory/legal/operational change |

Intervals are B4GAMBLE internal fail-closed controls, not claims that regulators mandate those exact periods.

## Routine pause and rollback

- **Partner contract suspended:** pause/expire the programme. Do not delete history.
- **Offer uncertain or expired:** pause the offer and remove the CTA. Keep editorial content unless its own authority changes.
- **Tracking link unsafe/stale:** deactivate the link immediately.
- **Licence/domain issue:** remove/expire exact evidence and deny the operator.
- **Regulatory/legal uncertainty:** apply policy deny or global kill switch as needed.
- **Deployment regression:** keep the kill switch off/disable it, deploy the prior safe application, and leave additive historical data in place.

Never substitute another operator, link or offer. Never restore `/go` as a fallback.

## Incident flow

1. Technical owner disables the smallest safe commercial scope; use the global kill switch when scope or confidence is uncertain.
2. Record internal IDs, controlled reason code, first observed time and evidence state without raw credentials, personal data or tracking query values.
3. Notify Founder Office / Commercial and Legal / Compliance.
4. Evidence reviewer checks the official regulator, contract notice, operator terms and destination.
5. Keep editorial publication separate unless its own factual/publication authority is affected.
6. Resume only after new evidence, review and explicit approval; never auto-resume on timeout.

## Production verification after an authorized release

Run read-only Production smoke and inspect current deployment logs. Confirm the deployment SHA, policy version, redirect-engine state and current evidence timestamps. Do not perform a test gambling registration/deposit. A safe technical click test, if ever needed, requires separate Founder/Legal authorization and an agreed method that does not create misleading affiliate activity.

## Current runbook state

COMM-01 performed no outreach, submission, acceptance, account creation, credential creation, Production commercial data mutation, policy change, redirect enablement or real destination test. The next authorized action is Founder selection and submission to a top candidate, not technical activation.
