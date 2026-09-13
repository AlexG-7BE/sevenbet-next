# RFC-015: GB Commercial Partner Authority

- **Status:** Approved
- **Decision authority:** Founder Office COMM-01 authorization; amended by `COMMERCIAL-OPS-01` and RFC-050 Founder instructions
- **Approved:** 2026-08-08
- **Scope:** Great Britain commercial partner readiness and activation authority, plus the internal evidence-led commercial operating record that prepares—but never grants—that authority
- **Depends on:** RFC-003, RFC-004, RFC-014

## 14 September 2026 authority amendment

RFC-050 supersedes this RFC only where generic `AffiliateNetwork`,
`AffiliateProgram`, `AffiliateOffer` or `AffiliateTrackingLink` lifecycle,
connection or country-projection state was treated as runtime permission. The
exact canonical `MarketActivation` is now the business routing decision.
Agreement, operator, licence, exact domain, identity, effective dates,
tracking safety/freshness, optional Bonus and controlled-redirect evidence
remain cumulative and fail-closed. The current wording below reflects that
amendment; the original lifecycle implementation remains recoverable from Git
history.

## 1. Decision

SevenBet will implement a fail-closed, server-authoritative GB commercial readiness layer over the existing affiliate stack. It will not enable GB commercial or referral traffic. The current GB jurisdiction policy remains the sole top-level authority and continues to allow editorial access while denying commercial and referral use.

A GB destination is eligible only when every independent authority passes:

1. the current jurisdiction policy permits commercial and referral use;
2. an active, current, market-scoped partner agreement exists;
3. the exact Program and Offer are identity-matched, within any evidenced effective window and backed by Partner authority for GB direct linking;
4. operator, brand, casino and licence relationships are structured, exact and current;
5. the exact destination domain is active in current official UK Gambling Commission evidence;
6. the exact route-bound tracking link is safe, current, correctly owned and recently verified;
7. any linked bonus has complete and current technical terms; and
8. the global affiliate kill switch remains enabled.

Unknown, absent, inconsistent, stale or unmodelled facts deny readiness. Revenue-share value, payout value, protected safer-gambling data and Active Control Programme data never influence eligibility, ranking or routing.

## 2. Evidence and classification

### Detected

- `AffiliateProgram`, `AffiliateOffer`, `AffiliateTrackingLink` and `CasinoBonus` already model the programme, offer, destination and bonus layers.
- `AffiliateProgram.sourceOfTruth` is a field-level import-conflict policy map. It is not an agreement evidence store.
- `AffiliateProgram.metadata` is a bounded JSON extension point and is already transported through the server-side affiliate aggregate.
- Casino records can relate to structured `Operator`, `Brand`, `License` and `LicenseEvidence` records.
- RFC-014 already establishes exact-domain, licence and jurisdiction authority with a maximum seven-day official evidence age.
- Current GB policy permits editorial access and denies commercial and referral use.
- Current routing denies GB at the jurisdiction boundary before candidate resolution.
- Provider import can currently activate offers and links when `trustedAutoActivation` is set. That is not safe for a future GB-enabled programme.

### Inferred

- A database migration is not required for COMM-01 because the existing models and bounded metadata extension point can express the required agreement authority without changing ownership boundaries.
- Repository-controlled regulator evidence is preferable for the first activation because it is reviewable, deploy-coupled, testable and fail-closed without adding paid infrastructure.

### Planned

- `COMMERCIAL-OPS-01` adds a dedicated internal `CommercialEvidence` model and protected Admin workflow. It supplements agreement and readiness evidence; it does not replace or grant `gbCommercialAuthority`.
- A future operator may be activated only after real contracting, due diligence and evidence-entry work is complete and the GB jurisdiction policy is separately approved to change.

### Not detected

- No approved real GB partner agreement was established during COMM-01.
- No secure read-only Production database credential was established for COMM-01.
- No current GB commercial or referral authorization exists.

## 3. Partner agreement authority

Agreement authority is stored under `AffiliateProgram.metadata.gbCommercialAuthority`. It is parsed by a versioned server-side contract; arbitrary metadata never grants authority.

The version 1 contract requires:

- `authorityVersion: "gb-partner-authority.v1"`;
- `relationshipType: "DIRECT_OPERATOR" | "AFFILIATE_NETWORK"`;
- partner legal name and operator/programme identity;
- an opaque agreement reference, never a secret or full contract;
- `agreementStatus: "ACTIVE"`;
- effective and optional expiry timestamps;
- explicit `approvedMarkets` containing `GB`;
- non-empty approved channels;
- a declared commercial model;
- source type and opaque source reference;
- reviewer identity/reference and review timestamp; and
- an optional compliance contact reference.

The agreement is denied when it is not yet effective, expired, reviewed more than 90 days ago, missing a required fact, contains an unknown enum value, fails exact normalized identity matching, or does not include every channel required by the consuming action. `EDITORIAL_CONTENT`, `CASINO_REVIEW` and `BONUS_PAGE` do not imply outbound-link authority. Runtime referral readiness requires `DIRECT_LINK`. A network relationship proves only the contractual network relationship; it does not prove an operator, brand, licence, offer or domain relationship.

The 90-day review window is an internal operational control, not a regulatory claim. Reviews must also occur on material partner, programme, licence, domain, tracking, bonus, contract or policy change and before agreement expiry.

## 4. Regulator domain evidence

The initial source of truth is a versioned repository module containing typed evidence records. Production records start empty. A record must identify:

- casino, operator and optional brand IDs;
- licence ID and public licence account reference;
- the exact normalized destination domain;
- the official UK Gambling Commission register URL;
- official domain status;
- observation and mandatory revalidation timestamps; and
- whether the relationship is direct or white-label.

Only an exact-domain record with official status `ACTIVE`, a matching structured relationship, an observation age of at most seven days and an unexpired revalidation time can pass. `INACTIVE` denies. `WHITE_LABEL` is represented explicitly and denies automatic readiness until a separate documented legal and relationship review proves the licensed-operator chain. A parent domain, brand similarity or commercial-network membership is never sufficient.

Evidence addition is an activation-sensitive code change. It requires primary-source verification, review, tests and deployment. No real operator record may be added without a real approved agreement and completed due diligence.

## 5. Relationship chain

GB readiness requires:

- `AffiliateProgram.casinoId` to equal the candidate casino ID;
- a structured casino operator relation;
- any structured brand to resolve to that same operator;
- the programme operator identity to match the structured operator identity;
- the agreement operator/programme identity to match the programme and structured operator context;
- a structured GB licence and current official licence evidence under RFC-014; and
- the regulator domain evidence operator, brand, casino and licence IDs to match exactly.

Legacy free-text casino operator or brand fields do not grant GB readiness. Any structured-versus-legacy conflict denies.

## 6. Program and Offer evidence gate

Generic Affiliate lifecycle states are not canonical route permission. No
replacement status enum is introduced.

The exact route-bound Program must match the Casino and structured operator,
have current agreement evidence for `GB` and `DIRECT_LINK`, and have no
unresolved identity conflict. Provider connection and Program workflow values
may remain Admin/provider facts but are not runtime authority.

The exact route-bound Offer must be within its effective dates and belong to
the exact Program and Casino. The exact GB `MarketActivation`, not Offer GEO or
country metadata, expresses the Founder routing decision. Agreement channel
authority is rechecked at request time; content-channel approval alone never
grants outbound authority.

Payout model and payout value remain internal commercial fields. They can support reporting and reconciliation but cannot alter jurisdiction, compliance, eligibility, ranking or destination selection.

## 7. Tracking-link gate

A tracking link must be route-bound, credential-free HTTPS, effective,
unexpired and owned by the exact Offer. Both `verifiedAt` and `lastCheckedAt`
must be present and no more than seven days old. Missing, stale, unsafe or
mismatched evidence denies readiness. `AffiliateTrackingLink.active` and its
country projection are not additional runtime permission.

The affiliate kill switch is evaluated at request time. Route execution re-evaluates the same server-side authorities and never trusts client state or a previously rendered decision.

## 8. Bonus technical gate

An offer without a linked bonus does not require bonus evidence. A linked bonus must be active and effective, have a non-empty title and summary, use HTTPS official terms, identify an actual headline value, include eligibility and important conditions, and carry current verification evidence.

Time-limited bonuses must be verified within 24 hours. Evergreen bonuses must be verified within seven days. Where free spins or wagering apply, the corresponding structured facts and important conditions must be present. This is a technical completeness gate, not legal approval; Legal and Compliance remain external authorities.

## 9. Provider import and state transitions

`trustedAutoActivation` remains invalid for a Program represented as supporting
GB. Provider import may preserve external/provider status facts, but a provider
payload, webhook, sync job, account connection or lifecycle value can never
grant or veto an exact GB route.

Affiliate active states are neither necessary nor sufficient for runtime
readiness. The canonical route plus the factual central readiness evaluator is
authoritative.

## 10. Public and protected-data boundaries

Public affiliate DTOs continue to exclude raw destination URLs, tracking parameters, agreement references, payout terms and internal readiness evidence. Denied traffic uses the existing neutral unavailable behavior without exposing internal reason codes.

Commercial services must not import Active Control Programme, pause, Help, vulnerability, self-exclusion or protected safer-gambling data. Commercial targeting and personalization from those sources remain prohibited.

## 11. Auditability

The readiness evaluator returns deterministic reason codes for staff and automated tests. Those codes are not exposed publicly. Programme saves, provider sync, redirect decisions and evidence changes continue to use the existing audit and application logging boundaries; logs must contain identifiers and reason codes, never credentials, tokens, raw tracking parameters or contract contents.

## 12. Original COMM-01 rollout and rollback

This section records the original 8 August 2026 rollout state. COMM-01 shipped
with GB policy commercially disabled and the repository domain evidence store
empty, so no GB commercial route could become eligible at that checkpoint.
RFC-050 does not change evidence records or policy; current release evidence is
maintained in `CURRENT_STATE.md` and the PR4 runbook.

Rollback is the normal code rollback. The affiliate kill switch and GB jurisdiction policy provide independent containment. A future first-partner activation requires a separate approved policy decision, a real agreement record, completed diligence, regulator evidence, Preview validation and Production verification.

## 13. Verification obligations

The implementation must test every authority independently, composition across all authorities, route-time re-evaluation, stale evidence, exact domain matching, operator/brand conflicts, provider-import fail-closed behavior, kill-switch behavior, public DTO secrecy and payout independence.

No COMM-01 work is complete without lint, type checking, Prisma validation, structural checks, browser checks, GB market regression tests, affiliate regression tests, COMM-specific tests, build, documentation reconciliation, diff checks and secret scanning.

## 14A. `COMMERCIAL-OPS-01` operational authority amendment

Approved on 2026-08-19, the internal Commercial CRM uses one durable `CommercialOpportunity` from `PROSPECT` through relationship maturity. Its canonical stages are `PROSPECT`, `QUALIFIED`, `APPLICATION_READY`, `APPLIED`, `DUE_DILIGENCE`, `NEGOTIATING`, `APPROVED`, `ACTIVE`, `REJECTED` and `ON_HOLD`.

The CRM is evidence and workflow authority only:

- `APPROVED` requires an explicit human transition with direct `APPROVAL` evidence. A public programme page, submission or friendly response cannot satisfy it.
- `ACTIVE` is absent from the ordinary transition API and Admin control. No Partner Operations operation can propose or set it.
- an `APPROVED` or prepared record does not change any `AffiliateProgram`, `AffiliateOffer`, `AffiliateTrackingLink`, jurisdiction policy, kill switch or public DTO;
- any future operational activation must use a separately controlled activation service that invokes the existing central GB readiness evaluator and records explicit Founder evidence; that service is not part of this candidate implementation;
- `CommercialActivationPacket` has only `NOT_APPLICABLE`, `NOT_READY` and `READY_FOR_FOUNDER_REVIEW`. It is a preparation artifact, never runtime authority.

The additive CRM models are `CommercialOpportunity`, `CommercialEvidence`, `CommercialContact`, `CommercialActivity`, `CommercialApplication`, `CommercialTerm`, `CommercialTask`, `CommercialAgentRun`, `CommercialAgentOperation` and `CommercialActivationPacket`. Optional links reuse the canonical Casino, Operator, Brand, AffiliateNetwork and AffiliateProgram records; uncertain prospects are not forced into a canonical identity and possible duplicates are flagged rather than merged.

This amendment does not weaken the cumulative factual evaluator in sections
1–13. RFC-050 later removes generic Affiliate lifecycle from that evaluator;
CRM remains evidence/workflow only and no CRM state can establish a public
commercial route.

## 14. Primary sources

Checked on 2026-08-08:

- [UK Gambling Commission LCCP 1.1.2 — responsibility for third parties](https://www.gamblingcommission.gov.uk/licensees-and-businesses/lccp/condition/1-1-2-responsibility-for-third-parties-all-licences)
- [UK Gambling Commission — licensees' responsibilities for third parties](https://www.gamblingcommission.gov.uk/licensees-and-businesses/page/licensees-responsibilities-for-third-parties)
- [UK Gambling Commission — affiliates or third parties](https://www.gamblingcommission.gov.uk/licensees-and-businesses/guide/page/affiliates-or-third-parties)
- [UK Gambling Commission public business register](https://www.gamblingcommission.gov.uk/public-register/businesses)
- [UK Gambling Commission business register download](https://www.gamblingcommission.gov.uk/public-register/businesses/download)
- [ASA/CAP — Betting and gaming: general](https://www.asa.org.uk/advice-online/betting-and-gaming-general.html)
- [ASA/CAP — significant conditions for free bets and bonuses](https://www.asa.org.uk/news/hedge-your-bets-new-guidance-on-free-bets-and-bonuses.html)
- [ASA/CAP — Affiliate marketing](https://www.asa.org.uk/advice-online/affiliate-marketing.html)

These sources establish the regulatory and advertising-control baseline. SevenBet's freshness windows and readiness composition are internal controls chosen to fail closed; they are not presented as regulator-mandated intervals.
