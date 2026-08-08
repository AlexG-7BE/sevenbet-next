# GB Commercial Partner Authority

- **Status:** Implementation complete on COMM-01 delivery branch; Founder review required
- **Decision:** [RFC-015](../06_RFC/RFC-015-GB-Commercial-Partner-Authority.md)
- **Market authority:** [Great Britain Market Authority](Great-Britain-Market-Authority.md)
- **Operating procedure:** [GB Partner Onboarding Runbook](../06_Operations/GB-Partner-Onboarding-Runbook.md)
- **Research package:** [GB Partner Readiness Package](../08_Research/GB-Partner-Readiness-Package.md)
- **Reconciled:** 2026-08-08

## Current outcome

**Detected:** COMM-01 adds a server-owned GB commercial readiness authority over the existing affiliate models. It composes jurisdiction, partner agreement, structured operator/brand/casino, licence, exact domain, programme, offer, tracking-link, optional bonus and redirect facts. Every missing, stale, inconsistent or unknown required fact denies.

**Detected:** no Prisma model or migration was added. Partner agreement evidence uses the typed `AffiliateProgram.metadata.gbCommercialAuthority` namespace. Exact official-domain evidence uses a bounded repository store that is empty in Production code.

**Detected:** policy `gb-2026-08-08.1` still sets `editorialAllowed=true`, `commercialAllowed=false` and `referralAllowed=false`. `AFFILIATE_REDIRECT_ENGINE_ENABLED` still defaults to false. No real partner, agreement, programme, offer, tracking destination or redirect was added.

**Not verified:** Production affiliate and casino counts were not queried because no secure read-only Production database credential was established. Counts are not inferred from schema, local data or the RFC-012 temporary dataset.

## Repository evidence scope

The repository root was confirmed as `/Users/alex/Documents/Codex/2026-07-09/ns/sevenbet-next`. COMM-01 inventoried 782 tracked files and 760 active non-generated paths before documentation. Dependencies, `.next`, coverage, Playwright output, test output, caches and `tsconfig.tsbuildinfo` were excluded from implementation claims.

The following classifications apply throughout this document:

- **Detected:** directly supported by the active repository or an official primary source checked on 2026-08-08.
- **Inferred:** an architectural conclusion drawn from detected repository evidence.
- **Planned:** a future action that is not implemented or approved for activation.
- **Not detected:** evidence was sought but not found; it must not be treated as implemented.

## Commercial authority map

| Entity | Purpose | Source of truth | Current validation | Runtime consumer | Public exposure | Activation risk | Remaining gap |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Jurisdiction policy | GB capability ceiling | `lib/jurisdiction/policies/gb.ts` | Version, evidence IDs and validity window | Jurisdiction resolver and `/r` | Capability result only | A permissive change could enable evaluation | Separate Founder/Legal policy decision required |
| Casino | Canonical editorial identity/domain | Prisma `Casino` | Publication, lifecycle, exact structured relations | Casino domain repository and readiness service | Governed editorial DTO | Legacy strings can disagree | Real canonical operator data not verified in Production |
| Operator and brand | Legal/brand relationship | Prisma `CasinoOperator`, `CasinoBrand` | Structured IDs, lifecycle and brand-to-operator equality | GB readiness evaluator | Published operator context only | Name inference or relationship conflict | Real first-partner mapping absent |
| Licence/evidence | GB remote-casino authority | `CasinoLicense`, `CasinoLicenseEvidence` | Exact accepted authority, GB scope, active state, official source, seven-day freshness | Existing GB operator evaluator | Published licence context only | Stale or unofficial evidence | Real Production inventory not verified |
| Exact domain evidence | Proves destination domain relationship | `gbCommercialDomainEvidenceRecords` | Exact normalized domain, exact IDs, official source, active state, seven-day freshness | GB readiness service | Never exposed | Incorrect or stale record could grant authority | Store intentionally empty |
| Partner agreement | Proves real contractual permission | `AffiliateProgram.metadata.gbCommercialAuthority` | Versioned parser, active/effective state, 90-day review, market, required channel and identity | Programme/offer services and readiness evaluator | Never exposed | Content approval mistaken for outbound authority | No real agreement record |
| Affiliate programme | Commercial owner and provider state | `AffiliateProgram` | Active, published, exact casino/operator, explicit GB, agreement, no GB auto-activation | Offer save/import and readiness evaluator | Availability only | Active database state mistaken for contract | Real programme absent |
| Affiliate offer | Commercial terms and targeting | `AffiliateOffer` | Active/effective, exact programme/casino, explicit GB allow-list | Candidate resolver and readiness evaluator | Governed internal route only | Global targeting or stale terms | Real offer absent |
| Tracking link | Server-owned destination | `AffiliateTrackingLink` | Active, HTTPS, explicit GB, `verifiedAt` and `lastCheckedAt` under seven days, effective dates | Candidate resolver and readiness evaluator | Raw URL never projected | Unsafe/stale destination | Real link absent |
| Bonus | Significant-condition facts | `CasinoBonus` | Published/active/effective, headline value, eligibility, terms, conditions and freshness | Readiness evaluator when linked | Governed editorial terms | Incomplete or stale promotion | Legal approval and real terms absent |
| Redirect slug | Stable internal handoff | `AffiliateRedirectSlug` | Active, immutable casino ownership, current candidate and URL safety | `/r/[slug]` | Internal slug only | Stale rendered CTA used as authority | Engine remains disabled |
| Payout economics | Internal reporting/reconciliation | Affiliate offer fields | Format/model validation only | Admin/reporting; never readiness or ranking | Not exposed in public DTOs | Commission-driven eligibility/ranking | Real negotiated economics unknown |

## Authority composition

The request-time path is:

`/r/[slug]` → global kill switch → trusted Vercel country signal → jurisdiction policy → current stored redirect/candidate → GB commercial readiness → final URL validation → redirect or neutral unavailable recovery.

The final result is a strict conjunction. A prior render, Preview result, active database status, provider payload, affiliate-network listing, brand similarity or high payout cannot replace any authority.

The central evaluator returns one `GbCommercialReadinessDecision` with independent `jurisdictionAuthority`, `partnerAuthority`, `operatorAuthority`, `domainAuthority`, `programAuthority`, `offerAuthority`, `trackingAuthority`, `bonusAuthority` and `redirectAuthority` booleans, plus `commercialReady`, `referralReady`, reason codes, `checkedAt`, evidence check time and the earliest `revalidateAt`. It returns deterministic internal reason codes grouped as:

- jurisdiction commercial/referral deny;
- programme state, market, casino and unsafe automatic activation;
- agreement missing, invalid, not effective, expired, stale, wrong market, required channel absent or identity mismatch;
- structured operator/brand mismatch;
- offer state, date, casino or GB targeting failure;
- domain evidence missing, invalid, inactive, stale, white-label review or relationship mismatch;
- underlying operator/licence evidence denial;
- tracking-link state, URL, market, health, freshness or expiry failure;
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

## State-transition gates

The onboarding progression is an operational interpretation of existing state combinations, not a new persisted enum:

| Operational stage | Existing state/evidence interpretation |
| --- | --- |
| Discovered | Research record only; no `AffiliateProgram` required |
| Due diligence | Draft programme may exist; evidence collection incomplete |
| Agreement pending | Programme `DRAFT`; agreement absent/pending and non-authoritative |
| Approved | External agreement approved/active, but programme remains non-public while setup is incomplete |
| Technical setup | Draft/in-review programme, provider/account configuration and inactive offers/links |
| Ready | Agreement and technical evidence pass; programme may be active with workflow `APPROVED`, but referral remains denied until published and policy/kill-switch authority exists |
| Active | Programme `ACTIVE`, workflow `PUBLISHED`, connected where applicable, all runtime layers pass and separate policy/Founder activation exists |
| Paused | Programme/offer `PAUSED`, suspended lifecycle or inactive link; referral denies immediately |
| Terminated | Programme/offer `EXPIRED` or `ARCHIVED`; retained for audit and never selected |

An operational label never overrides the canonical database states or the request-time readiness decision.

### Programme

A GB-supporting programme cannot be saved into `ACTIVE` or `PUBLISHED` activation state unless it has an exact casino, structured operator, coherent optional brand relation, matching operator identity and current agreement evidence. `trustedAutoActivation=true` is rejected for every GB-supporting programme.

### Offer

An active offer under a GB-supporting programme requires the programme to be active/published, exact casino ownership, current agreement evidence explicitly containing `DIRECT_LINK`, explicit `ALLOW` targeting containing `GB`, and at least one active explicitly GB-scoped link with current verification and health evidence. Content-only agreement channels cannot authorize an active outbound offer. Draft offer/evidence preparation remains available before that channel is approved.

### Provider import

Provider preview and repository apply independently calculate `allowAutoActivation = trustedAutoActivation && !supportsGb`. A GB-supporting provider record is projected and persisted as draft/inactive even when an unsafe historical trust flag is present. Provider status, connection success, webhook or payload never grants agreement/domain/licence authority.

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

## Current activation status

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
