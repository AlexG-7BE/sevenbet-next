# Global 14-casino worldwide market authority — 10 September 2026

**Status:** CANONICAL-RUNTIME INTEGRATION IMPLEMENTED — REVIEW REQUIRED — NOT
MERGED, NOT DEPLOYED, NO PRODUCTION MUTATION

**Authority:** [Founder global 14-casino market authority](../07_Decisions/FOUNDER-GLOBAL-14-CASINO-MARKET-AUTHORITY-2026-09-10.md)

**Implementation classification:** **DETECTED** for repository facts,
**AUTHORIZED TARGET** for target terminal states, and **UNKNOWN** where current
operator evidence is absent.

## Outcome

The branch contains an exhaustive, secret-free authority model in
`lib/current-partner-worldwide-authority/inventory.ts`. It covers exactly 14
casinos, all 249 assigned ISO 3166-1 alpha-2 countries and territories, all 24
Argentine first-level jurisdictions and all 13 Canadian provinces/territories.

The historical 25-GEO/540-row release remains factual Production history. It is
not the current authority universe for these 14 casinos.

| Matrix dimension | Rows |
| --- | ---: |
| Casinos | 14 |
| Country rows per casino | 249 |
| Exact subdivision rows per casino | 37 |
| Total rows | 4,004 |
| Supported | 134 |
| Operator/programme-restricted | 254 |
| Unknown | 3,616 |

`4,004 = 134 + 254 + 3,616`.

The 134 supported rows span 46 country roots, including markets beyond the old
25 labels. Country aggregates `AR` and `CA` are non-terminal: exact subdivision
rows carry authority.

| Supported-row evidence field | Rows |
| --- | ---: |
| Support DETECTED | 122 |
| Support INFERRED | 12 |
| Legal DETECTED | 94 |
| Legal INFERRED | 40 |

Inferred rows are explicit review inputs, not concealed Production clearance.

## Exact operator footprint

The lists below separate current source classification at field level. Most
support rows are **DETECTED** from first-party operator/programme terms, current
brand surfaces, the BGA payment-method matrix, exact regulator records and
existing route evidence. White Hat IE/MT support remains **INFERRED** from
operator licence/terms plus current repository routes pending a direct current
market selector capture. A separate legal evidence field is **DETECTED** or
**INFERRED** and must be closed before Production where inferred. `CA-*` means
every listed province is an individual row, never `CA` or `CA-OTHER`.

| Casino | Supported jurisdiction rows |
| --- | --- |
| Betsson | AR-B, AR-C, AR-X; 12 CA subdivisions excluding CA-ON; BO, BR, CL, CM, CO, CY, DO, DK, EC, EG, ES, FI, GR, IS, IE, LT, MV, MT, MC, MX, NZ, MK, PG, PY, PE, LK, SE, TH, UY |
| Betsafe | all 13 CA subdivisions; BO, CL, CY, DO, EG, EE, FI, IS, IE, LI, LT, LV, MG, MT, NZ, PG, PE, SE, UZ |
| Inkabet | PE |
| NordicBet | CL, CY, DK, EG, FI, IS, IE, KZ, MT, SE, TH, UY |
| Rizk | CA-BC, CA-MB, CA-NB, CA-NL, CA-NS, CA-NT, CA-NU, CA-PE, CA-QC, CA-SK, CA-YT; BN, CL, FI, DE, GG, IS, IM, JE, LI, LU, MT, NZ; RS local service |
| StarCasino | IT |
| SuperCasino | NZ |
| GoldenPlay | GB |
| 21 Privé, Diamond7, G'day Casino, Hello Casino, Skol Casino, Slotnite | GB, IE, MT for each brand |

Rizk v4.0 terms explicitly classify CA-AB and CA-ON as operator-restricted.
They are not supported Canadian rows. The same terms supply the broader Rizk
restricted-country set; the separate current Serbian service is an evidenced
local exception.

BGA Schedule D permits only Betsafe/GWN promotion in Ontario and expressly
excludes other Betsson Group brands. Betsson CA-ON is therefore programme-
restricted, while Betsafe CA-ON remains supported but requires current exact
provincial operator/domain authority.

**CONTRADICTION / DECISION REQUIRED:** a second-pass federal and provincial
source review found an open private registration path only in Alberta and
Ontario. It indicates that the other 33 supported Canadian subdivision rows
should be legal blocks under the provincial conduct-and-manage schemes, not
regulatory actions. This branch deliberately leaves those 33 rows in their
earlier fail-closed action state until the Founder explicitly approves that
legal reclassification. They cannot activate in the current state.

## Authorized target classification

These figures are target reconciliation outcomes, not claims about current
Production `MarketActivation` rows. A target `ACTIVE_HEALTHY` with inferred
legal/support evidence remains merge-gated until that evidence is closed.

| Target final state | Rows |
| --- | ---: |
| ACTIVE_HEALTHY | 38 |
| BLOCKED_BY_LAW | 35 |
| ACTION_REQUIRED_REGULATORY | 56 |
| BROKEN_ROUTE | 1 |
| MISSING_TRACKING_ROUTE | 4 |
| **Supported total** | **134** |

Legal/regulatory classification takes precedence over route presence. Current
source-backed blocks include Brunei, Chile, Cyprus, Ecuador, Finland, Iceland,
Italy, Kazakhstan, Latvia, Lithuania, Luxembourg, New Zealand and Uruguay as
applicable to supported rows. Egypt, Sri Lanka and Thailand remain conservative
**INFERRED** legal blocks whose exact retrievable official provision is a merge
gate, not a completed current-source claim. Maldives' unsupported Penal Code
claim and Monaco's unsupported online-registration action were removed; both
remain inferred and fail-closed rather than being presented as law. Exact mandatory authority actions
include Canadian provincial conduct-and-manage authority under Criminal Code
section 207, the Greek affiliate suitability registration, and specified local
operator registers.

Inkabet PE is the only target `BROKEN_ROUTE`. Missing link targets are limited
to supported, legally allowed markets with no detected partner URL; no link is
manufactured.

## Tracking normalization

- Tracking data is represented only by bounded identities; raw partner URLs,
  tokens and query strings are absent.
- Every casino has at most one generic tracking identity.
- Betsson Latin-American row 54 is recorded as physical `REGIONAL_REUSE`; the
  English row 18 remains the single generic default. Exact CL, IS, PE and SE
  identities override both.
- Rizk's Canada row is `REGIONAL_REUSE`; its ROW identity is the single generic
  default.
- A present link receives only the neutral `Visit Casino` internal offer label.

The permanent tracking-registration mechanism merged through PR #234 at commit
`95b47be`. This branch was rebased on that commit. Its 134 supported rows are
now the exact 14-casino portion of the registrar's canonical current-partner
inventory. `REGIONAL_REUSE` is a first-class registration scope between exact
and generic, and the old 540-row one-time rollout inventory remains explicitly
historical inside the retired reconciler. There is still one route writer: the
permanent `PartnerTrackingRegistrationService` and its RFC-042 controller
boundary.

## GB reconciliation

**DETECTED:** the six exact White Hat domains are active under current UKGC
account 52894 and the operator records MGA authority for other supported
customers. The target matrix therefore classifies GB as legally allowed for
the six exact brands. GoldenPlay has current UK-facing campaign evidence but no
exact current UKGC domain record, so its supported GB row requires that exact
regulatory authority.

**CONTRADICTION:** `lib/jurisdiction/policies/gb.ts` is expired and still carries
the older country-wide internal `commercialAllowed=false` and
`referralAllowed=false` values. The current Founder decision removes that old
internal deny for the exact six brands, but a global policy flip would exceed
this rollout's scope. The implemented path bypasses only
`COMMERCIAL_NOT_ACTIVE` or `POLICY_STALE` for those exact six slugs when the
worldwide matrix contains detected GB support and legal evidence. It continues
to require exact UKGC/domain/operator/partner/offer/tracking/redirect and
RFC-042 route readiness. Other Casinos and every other jurisdiction denial
remain fail-closed. The target rows are not yet live.

## Exact subdivision runtime

**IMPLEMENTED TARGET:** [RFC-045](../06_RFC/RFC-045-Exact-Subdivision-Market-Activation.md)
extends RFC-042 with exact `marketCode` while retaining parent `countryCode`
for jurisdiction and factual authority. Additive migration
`0035_market_activation_exact_market_code` backfills existing rows, replaces
only activation uniqueness indexes and activates nothing. Runtime resolution,
public commercial projections and redirects consume the trusted Vercel region
header; no query, locale or account value can manufacture it.

For a subdivision, parent jurisdiction approval remains necessary but is not
sufficient. The exact 14-casino manifest must also contain `SUPPORTED`, legal
`ALLOWED`, detected support evidence, detected legal evidence and matching
Founder authority. Missing or invalid exact evidence fails closed as an
internal readiness action, never as invented law. The migration and runtime
remain undeployed.

## Required gates before merge or Production

1. **COMPLETE:** PR #234 merged and this branch is rebased onto its permanent
   registration mechanism.
2. **COMPLETE IN CODE:** the worldwide supported rows use the canonical
   inventory/service; the historical reconciler cannot act as a second writer.
3. **COMPLETE IN CODE:** RFC-045, migration 0035, trusted-region propagation and
   exact request/runtime tests implement subdivision identity.
4. **COMPLETE IN CODE:** the six scoped GB rows can pass only the stale internal
   deny while every cumulative operator/commercial/route gate remains required.
5. **MERGE GATE:** close 12 inferred support classifications and 40 inferred
   legal classifications with current authoritative evidence, and explicitly
   decide the proposed 33-row Canadian closed-market reclassification; no
   unresolved row may be described as Production-cleared.
6. **RELEASE GATE:** full CI, clean-database migration and PostgreSQL integration
   suites must pass for the review SHA.
7. **PRODUCTION GATE:** capture the pre-mutation snapshot, verify exact current
   route/partner evidence, execute only through the canonical registrar and
   RFC-042 controller, then prove there is no active country-wide AR/CA row or
   applicable `ZZ` fallback for these 14 Casinos.
8. **ACCEPTANCE GATE:** deployment and live postflight must succeed before
   actual final-state totals are written to `CURRENT_STATE.md`.

The tracking-mechanism dependency is closed. The PR remains open because the
evidence, migration/CI and Production acceptance gates above are not closed.
