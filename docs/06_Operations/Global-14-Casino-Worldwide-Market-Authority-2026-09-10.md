# Global 14-casino worldwide market authority — 10 September 2026

**Status:** IMPLEMENTATION STAGED — NOT MERGED, NOT DEPLOYED, NO PRODUCTION MUTATION

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
| Legal DETECTED | 91 |
| Legal INFERRED | 43 |

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

## Authorized target classification

These figures are target reconciliation outcomes, not claims about current
Production `MarketActivation` rows. A target `ACTIVE_HEALTHY` with inferred
legal/support evidence remains merge-gated until that evidence is closed.

| Target final state | Rows |
| --- | ---: |
| ACTIVE_HEALTHY | 37 |
| BLOCKED_BY_LAW | 35 |
| ACTION_REQUIRED_REGULATORY | 57 |
| BROKEN_ROUTE | 1 |
| MISSING_TRACKING_ROUTE | 4 |
| **Supported total** | **134** |

Legal/regulatory classification takes precedence over route presence. Current
source-backed blocks include Brunei, Chile, Ecuador, Finland, Iceland, Italy,
Lithuania, New Zealand and Uruguay as applicable to supported rows. Cyprus,
Egypt, Kazakhstan, Luxembourg, Maldives, Sri Lanka and Thailand are conservative
**INFERRED** legal blocks whose exact retrievable official provision is a merge
gate, not a completed current-source claim. Exact mandatory authority actions
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

The branch deliberately contains no route writer. After the concurrent
registration service merges, this manifest must be adapted into its current
partner inventory and all tracking registration must pass through that service.
The old rollout reconciler must not become a second registrar.

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
this rollout's scope. Before merge, the implementation must establish a scoped,
reviewed path that preserves every exact UKGC/domain/operator/contract/route
gate. Until then the target rows are not live.

## Subnational runtime gap

**DETECTED:** RFC-042 currently accepts only two-letter `countryCode` values;
its schema uses `Char(2)`, its database constraint enforces alpha-2, and public
request authority reads only `x-vercel-ip-country`. The concurrent registrar
accepts some hyphenated labels syntactically but converts every subdivision
into a regulatory action instead of activating it. That technical limitation
must not be presented as law.

Exact Canada/Argentina activation therefore requires a material RFC/amendment
and additive migration that keeps parent country law/policy separate from an
exact market code, consumes trusted `x-vercel-ip-country-region`, and fails
closed when a required region is missing or invalid.

## Required gates before merge or Production

1. The concurrent tracking-registration mechanism is merged to `main`.
2. This branch is updated from current `main`; the manifest is integrated into
   that mechanism, with no competing route-registration path.
3. Subnational market authority is implemented through an approved durable
   design and exact request/runtime tests.
4. The six scoped GB rows can pass without weakening exact operator evidence.
5. Exact supported rows reconcile only through RFC-042; restricted/unknown,
   legal-blocked and regulatory-action rows cannot expose a CTA.
6. No active country-wide AR/CA row and no active `ZZ` fallback exists for the
   14 casinos after exact convergence.
7. Full tests, Production snapshot, guarded reconciliation, deployment and live
   postflight complete before actual final-state totals are written to
   `CURRENT_STATE.md`.

Until those gates pass: **WAITING FOR TRACKING REGISTRATION MECHANISM MERGE**.
