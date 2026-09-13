# GB Commercial Partner Authority

- **Status:** RFC-050 lifecycle-collapse implementation is review-ready; not merged or deployed
- **Decision:** [RFC-015](../06_RFC/RFC-015-GB-Commercial-Partner-Authority.md), as amended by [RFC-050](../06_RFC/RFC-050-Affiliate-Lifecycle-Authority-Collapse.md)
- **Market authority:** [Great Britain Market Authority](Great-Britain-Market-Authority.md)
- **Operating procedure:** [GB Partner Onboarding Runbook](../06_Operations/GB-Partner-Onboarding-Runbook.md)
- **Research package:** [GB Partner Readiness Package](../08_Research/GB-Partner-Readiness-Package.md)
- **Reconciled:** 2026-09-14

## Current outcome

**DETECTED:** RFC-050 retains the server-owned GB commercial readiness
authority while removing generic Affiliate lifecycle from it. The exact
canonical route supplies factual Program, Offer and TrackingLink evidence; the
evaluator composes jurisdiction, Partner agreement, structured
operator/brand/Casino, licence, exact domain, effective dates, tracking-link
safety/freshness, optional Bonus and redirect facts. Every missing, stale,
unsafe, inconsistent or unknown required fact denies.

**DETECTED:** PR4 adds no Prisma model or migration. Partner agreement evidence
continues to use typed `AffiliateProgram.metadata.gbCommercialAuthority`.
Exact official-domain evidence remains in the bounded repository store.

**DETECTED:** PR4 does not change jurisdiction policy, the controlled redirect
kill switch or any evidence record. It changes only which existing facts may
act as runtime authority.

**DETECTED, READ ONLY:** the PR4 Production projector checked 81 canonical
routes and found 81 unchanged outcomes, zero legal or technical changes and an
empty difference list. Distribution evidence is recorded in the
[PR4 runbook](../06_Operations/Commercial-Core-PR4-Affiliate-Lifecycle-Collapse.md).

## Repository evidence scope

The repository root was confirmed as `/Users/alex/Documents/Codex/2026-07-09/ns/sevenbet-next`. COMM-01 inventoried 782 tracked files and 760 active non-generated paths before documentation. Dependencies, `.next`, coverage, Playwright output, test output, caches and `tsconfig.tsbuildinfo` were excluded from implementation claims.

The following classifications apply throughout this document:

- **DETECTED:** directly supported by the active repository or an official primary source checked on the stated evidence date.
- **INFERRED:** an architectural conclusion drawn from detected repository evidence.
- **PROPOSED:** a future action that is not implemented or approved for activation.
- **UNKNOWN:** current evidence is insufficient for a factual conclusion.
- **CONTRADICTION:** active evidence disagrees and requires reconciliation.

## Commercial authority map

| Entity | Purpose | Source of truth | Current validation | Runtime consumer | Public exposure | Activation risk | Remaining gap |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Jurisdiction policy | GB capability ceiling | `lib/jurisdiction/policies/gb.ts` | Version, evidence IDs and validity window | Jurisdiction resolver and `/r` | Capability result only | A permissive change could enable evaluation | Separate Founder/Legal policy decision required |
| Casino | Canonical editorial identity/domain | Prisma `Casino` | Publication, lifecycle, exact structured relations | Casino domain repository and readiness service | Governed editorial DTO | Legacy strings can disagree | Per-route structured identity must remain current |
| Operator and brand | Legal/brand relationship | Prisma `CasinoOperator`, `CasinoBrand` | Structured IDs, lifecycle and brand-to-operator equality | GB readiness evaluator | Published operator context only | Name inference or relationship conflict | Per-route relationship must remain current |
| Licence/evidence | GB remote-casino authority | `CasinoLicense`, `CasinoLicenseEvidence` | Exact accepted authority, GB scope, active state, official source, seven-day freshness | Existing GB operator evaluator | Published licence context only | Stale or unofficial evidence | Per-route validity remains required |
| Exact domain evidence | Proves destination domain relationship | `gbCommercialDomainEvidenceRecords` | Exact normalized domain, exact IDs, official source, active state, seven-day freshness | GB readiness service | Never exposed | Incorrect or stale record could grant authority | Store intentionally empty |
| Partner agreement | Proves real contractual permission | `AffiliateProgram.metadata.gbCommercialAuthority` | Versioned parser, active/effective state, 90-day review, market, required channel and identity | Programme/offer services and readiness evaluator | Never exposed | Content approval mistaken for outbound authority | Per-route current agreement required |
| Affiliate Program | Partner/provider identity and agreement carrier | `AffiliateProgram` | Exact Casino/operator identity and current agreement; lifecycle/workflow/connection values are non-authoritative | Admin/provider writes and exact-route readiness evidence | Availability only | Lifecycle mistaken for contract | Evidence must remain exact and current |
| Affiliate Offer | Commercial terms and effective window | `AffiliateOffer` | Exact Program/Casino binding and effective dates; status/GEO values are non-authoritative | Admin/provider facts and exact-route readiness evidence | Governed internal route only | Status mistaken for route authority | Real terms must remain current |
| Tracking link | Server-owned destination endpoint | `AffiliateTrackingLink` | Exact Offer binding, credential-free HTTPS, effective dates, `verifiedAt` and `lastCheckedAt` under seven days | Exact canonical runtime and readiness evaluator | Raw URL never projected | Unsafe/stale destination | Current endpoint evidence required |
| Bonus | Significant-condition facts | `CasinoBonus` | Published/active/effective, headline value, eligibility, terms, conditions and freshness | Readiness evaluator when linked | Governed editorial terms | Incomplete or stale promotion | Per-bound Bonus terms must remain current |
| Redirect slug | Stable internal handoff | `AffiliateRedirectSlug` | Active, immutable casino ownership, current candidate and URL safety | `/r/[slug]` | Internal slug only | Stale rendered CTA used as authority | Engine remains disabled |
| Payout economics | Internal reporting/reconciliation | Affiliate offer fields | Format/model validation only | Admin/reporting; never readiness or ranking | Not exposed in public DTOs | Commission-driven eligibility/ranking | Real negotiated economics unknown |

## Authority composition

The request-time path is:

`/r/[slug]` → global kill switch → trusted country signal → exact canonical
`MarketActivation` → coherent route bindings/health → jurisdiction policy →
GB factual readiness → final URL validation → redirect or neutral unavailable
recovery.

The final result is a strict conjunction. A prior render, Preview result, active database status, provider payload, affiliate-network listing, brand similarity or high payout cannot replace any authority.

The central evaluator returns one `GbCommercialReadinessDecision` with independent `jurisdictionAuthority`, `partnerAuthority`, `operatorAuthority`, `domainAuthority`, `programAuthority`, `offerAuthority`, `trackingAuthority`, `bonusAuthority` and `redirectAuthority` booleans, plus `commercialReady`, `referralReady`, reason codes, `checkedAt`, evidence check time and the earliest `revalidateAt`. It returns deterministic internal reason codes grouped as:

- jurisdiction commercial/referral deny;
- Program/Casino and operator identity mismatch;
- agreement missing, invalid, not effective, expired, stale, wrong market, required channel absent or identity mismatch;
- structured operator/brand mismatch;
- Offer effective-date or Casino-binding failure;
- domain evidence missing, invalid, inactive, stale, white-label review or relationship mismatch;
- underlying operator/licence evidence denial;
- tracking-link ownership, URL safety, health, freshness or expiry failure;
- linked-bonus state, date, technical terms or freshness failure; and
- redirect-contract failure.

Reason codes are available to staff/tests and controlled diagnostics. Public failures use the existing neutral unavailable route and do not reveal evidence, contract, payout, URL or internal identity data.

## Partner agreement contract

The only recognized metadata namespace is `gbCommercialAuthority`. Version 1 requires:

```json
{
  "authorityVersion": "gb-partner-authority.v1",
  "relationshipType": "DIRECT_OPERATOR",
  "partnerLegalName": "External legal entity",
  "operatorOrProgrammeIdentity": "Exact structured operator identity",
  "agreementReference": "opaque-document-reference",
  "agreementStatus": "ACTIVE",
  "effectiveAt": "2026-08-08T00:00:00.000Z",
  "expiresAt": "2027-08-08T00:00:00.000Z",
  "approvedMarkets": ["GB"],
  "approvedChannels": ["CASINO_REVIEW", "DIRECT_LINK"],
  "commercialModel": "CPA",
  "sourceType": "EXTERNAL_DOCUMENT_REFERENCE",
  "sourceReference": "opaque-source-reference",
  "reviewedAt": "2026-08-08T00:00:00.000Z",
  "reviewedBy": "role-or-staff-reference",
  "complianceContactReference": "opaque-contact-reference"
}
```

Allowed relationship types are `DIRECT_OPERATOR` and `AFFILIATE_NETWORK`. A network contract proves only the network relationship; the exact operator, casino, licence, domain, programme, offer and link remain independently required.

Allowed agreement status is `ACTIVE`; inactive or unknown values fail parsing. Effective time, optional expiry, explicit `GB`, known acquisition channels, model, source and reviewer are required. The parser recognizes `EDITORIAL_CONTENT`, `CASINO_REVIEW`, `BONUS_PAGE` and `DIRECT_LINK`, but it does not infer one from another. Each consumer supplies its required channels and every required channel must be present. Request-time outbound readiness and active GB offer validation require `DIRECT_LINK`; failure maps to `GB_PARTNER_CHANNEL_NOT_APPROVED` and makes partner/referral authority false. Programme/draft evidence preparation does not require outbound authority. Review older than 90 days denies. Material contract/operator/programme/domain/offer/link changes require event-driven review before that interval.

The JSON stores references and control metadata only. Signed agreements, contract text, banking/tax records, personal identification, personal phone numbers, passwords, credentials, secret URLs and API tokens are prohibited.

## Exact domain and licence contract

`lib/affiliate-commercial/gb-domain-evidence.ts` defines version `gb-domain-evidence.v1` and the repository evidence record. A record contains exact casino/operator/brand/licence identifiers, public licence account reference, exact domain, official source URL, register status, relationship type, observation and revalidation time.

Normalization is limited to lowercase, a trailing dot and an optional leading `www.`. There is no substring, suffix, wildcard, registrable-parent or redirect-chain inference.

Only official status `ACTIVE` can pass. `INACTIVE` denies. `WHITE_LABEL` is modelled explicitly and denies automatic readiness until a separately documented legal and operator-chain review approves the relationship. The record and underlying `CasinoLicenseEvidence` must both remain current; the maximum runtime evidence age is seven days.

The source is the [UK Gambling Commission business register](https://www.gamblingcommission.gov.uk/public-register/businesses) and its [official downloadable business-licence data](https://www.gamblingcommission.gov.uk/public-register/businesses/download). Records are activation-sensitive code changes. No record may be added merely because a candidate appears in the register.

## Admin/provider lifecycle display

The onboarding progression is an operational interpretation for backoffice
coordination, not a persisted or runtime permission machine:

| Operational stage | Existing state/evidence interpretation |
| --- | --- |
| Discovered | Research record only; no `AffiliateProgram` required |
| Due diligence | Draft programme may exist; evidence collection incomplete |
| Agreement pending | Programme `DRAFT`; agreement absent/pending and non-authoritative |
| Approved | External agreement approved/active, but programme remains non-public while setup is incomplete |
| Technical setup | Draft/in-review programme, provider/account configuration and inactive offers/links |
| Ready | Agreement and technical evidence appear complete for review; no route authority is implied |
| Active | An exact canonical `MarketActivation` exists and every factual runtime layer passes; Affiliate labels may describe provider/Admin state only |
| Paused | Admin/provider record indicates a pause; routing changes only through the canonical activation controller or an independent legal/technical blocker |
| Terminated | Admin/provider record is retained for audit; every affected canonical route must be explicitly disabled rather than inferred from the label |

An operational label never overrides the exact canonical route or the
request-time factual readiness decision.

### Programme

Admin writes continue to require an exact Casino, structured operator,
coherent optional brand relation, matching operator identity and current
agreement evidence before presenting a GB Program as active/published.
`trustedAutoActivation=true` remains rejected for GB-supporting Programs. These
are evidence-quality controls, not route authority.

### Offer

Admin presentation of a GB Offer as active continues to require exact Casino
ownership, current agreement evidence explicitly containing `DIRECT_LINK` and
a recently verified safe TrackingLink. Content-only agreement channels cannot
authorize outbound use. At runtime, the exact GB route supplies market scope;
Program/Offer/Tracking status and GEO fields are ignored.

### Provider import

Provider preview/import may calculate and persist provider-facing lifecycle
facts. A GB-supporting record remains protected from automatic activation.
Provider status, connection success, webhook or payload never grants
agreement/domain/licence or route authority.

### Bonus

No linked bonus means no bonus-specific authority is required. A linked time-limited bonus requires technical verification under 24 hours; an evergreen bonus under seven days. The gate requires a published active/effective record, headline value, summary, eligibility, HTTPS terms and important conditions, including free-spin/wagering facts where applicable. The terms source must match the exact normalized casino domain; a separately hosted official source needs an explicit future authority decision. This is technical completeness, not Legal approval.

## Editorial and protected-data independence

Partner payout does not affect Editor Score, publication, ordering or readiness. Partner/programme pause does not delete or unpublish a review. Commercial denial removes only the action.

The commercial authority imports no Active Control Programme, Moment Map, goals, urge data, boundaries, Self-Check, Limit Tracker, Protected Help, XP or streak module. Those facts cannot target, rank, personalize or grant a commercial action.

## Runtime and public safety

- `/r/[slug]` re-evaluates the current policy, stored route, commercial evidence and URL on every click.
- `/go/[slug]` always uses the neutral unavailable flow and has no external authority.
- `AFFILIATE_REDIRECT_ENGINE_ENABLED` remains the immediate server kill switch and defaults to false.
- Raw destination/tracking URLs, partner references, payout terms, external IDs and credentials remain outside public DTOs.
- Unknown jurisdiction, evidence-store error, missing agreement/domain/licence, stale link or unsafe destination fails closed with no fallback operator.

## Operational ownership

| Responsibility | Role owner |
| --- | --- |
| Commercial candidate and agreement owner | Founder Office / Commercial |
| Contract, advertising and regulatory interpretation | Legal / Compliance |
| Runtime authority, evidence implementation and release | Technical owner |
| Official licence/domain and terms revalidation | Evidence reviewer |
| Day-to-day external programme coordination | Partner account manager |

Names must be added only from an authoritative company source; COMM-01 does not invent them.

## Original COMM-01 activation status

The following table is the historical 8 August 2026 COMM-01 checkpoint, not a
current Production inventory. Current PR4 route/distribution evidence is in
the PR4 runbook and `CURRENT_STATE.md`.

| Fact | State |
| --- | --- |
| Real partner | **Not detected** |
| Real agreement | **Not detected** |
| Repository domain evidence records | **Detected: 0** |
| Real programme/offer/link activated by COMM-01 | **Detected: no** |
| GB commercial policy | **Detected: off** |
| GB referral policy | **Detected: off** |
| Redirect engine | **Detected default: off** |
| Production commercial inventory | **Not verified** |

Commercial machinery is ready for Founder review, not for live traffic. First activation remains blocked by real partner contracting, real data/evidence, LEGAL-02, a separate policy decision and the runbook release gates.
