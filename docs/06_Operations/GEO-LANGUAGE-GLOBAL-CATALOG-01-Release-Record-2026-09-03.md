# GEO-LANGUAGE-GLOBAL-CATALOG-01 Release Record — 3 September 2026

**Status:** **DETECTED — COMPLETE**  
**Authority:** explicit Founder execution instruction `GEO-LANGUAGE-GLOBAL-CATALOG-01` and subsequent `GO — CREATE PR, MERGE AFTER GREEN GATES, DEPLOY PRODUCTION, VERIFY, AND COMPLETE`  
**Production origin:** `https://b4gamble.com`  
**Accepted application runtime:** `f7f1251558ca6be773863023f01d2a8a1a054543`  
**Accepted Production deployment:** `dpl_Guy4E9LLYKQpws5MHWjQ7GYTibKZ`

No credential, connection URL, raw IP, private partner value, tracking token or
secret is included in this record. Production database inspection was performed
inside an enforced PostgreSQL `REPEATABLE READ, READ ONLY` transaction.

## Executive result

**DETECTED:** the public product now has independent language and commercial
market dimensions. Canonical public presentation uses language-only paths;
language, cookies, `Accept-Language`, legacy locale suffixes and `country` query
parameters cannot grant market or commercial authority. Trusted request GEO is
the sole public market input, while Programme retains its existing separate
route-owned market boundary.

The public Casino experience is now a global real-identity catalogue. An exact
Casino × market projection decides `PROMOTABLE`, `INFORMATIONAL_ONLY` or
`HIDDEN`; every promotional fact and action requires exact current authority.
Missing, uncertain, contradicted or prohibited evidence remains fail-closed.

The scoped implementation merged through [PR #134](https://github.com/AlexG-7BE/sevenbet-next/pull/134),
deployed to the real B4GAMBLE Production project, passed HTTP and browser
acceptance, passed a 13-market read-only data projection, and produced no data
or schema mutation.

## Starting state and isolation

| Evidence | Detected value |
| --- | --- |
| Starting `origin/main` | `da36c3f85fd59c4e28efa9e279bb70e9f66608fb` |
| Starting canonical Production deployment | `dpl_8ASEEPn7NXYnoWR6DCiefYknoV8M` at the starting SHA |
| Isolated execution worktree | Temporary worktree outside the Founder's existing dirty checkout |
| Implementation commit | `76f410eaf5d3f00327fc3c16046ee93b21398434` |
| Final reviewed PR head | `164cb648eedfc6aeb91f4b4446d9325c7942532b` |
| Merge commit | `f7f1251558ca6be773863023f01d2a8a1a054543` |
| Scope | 115 files; 2,442 insertions and 1,401 deletions from the starting main |
| Prisma migration | None |
| Production data mutation | None |

**DETECTED:** the original checkout was not used for implementation, commits,
merge or documentation closure. Existing user changes there were not modified.

## URL migration and language model

**DETECTED:** `/en`, `/de`, `/es`, `/el`, `/sv` and `/da` are the six published
language roots. The registry contains 12 language profiles in total; Italian,
Portuguese, Dutch, Finnish, Norwegian and French remain unpublished drafts or
architecture-only profiles. English retains the current indexability authority;
the five published non-English languages remain `noindex, follow`.

Legacy BCP-47, market-first and redundant market/language paths permanently
redirect in one hop to language-only paths. Safe query parameters survive;
legacy `country` parameters are removed. A `country` parameter on a terminal
route is inert and is excluded from its canonical URL.

The version-2 preference cookie stores only `v2.<language>`. The selector
changes the path language and preserves supported content/query state without
changing the trusted market. Automatic resolution varies on `Accept-Language`
and the language cookie, but neither can become commercial authority.

## Global Casino presentation and commercial routing

**DETECTED:** the global projection contains these eight real identities:

- 21 Privé;
- Betsson;
- Diamond7;
- DragonBet;
- G'day Casino;
- Hello Casino;
- Skol Casino; and
- Slotnite.

Demo IDs and fictional records are absent from catalogue, profile, comparison,
offer and sitemap discovery. Contradicted or prohibited exact-market profiles
are hidden. `INFORMATIONAL_ONLY` removes scores, bonuses, current-market facts,
promotional media and referral actions. Offers and redirects require one exact
eligible market route; another market's route, a universal link without exact
permission, or a demo record cannot be used as fallback.

The accepted Production data has zero `AffiliateTrackingLinkCountry` rows and
zero Production-eligible routes. Therefore no positive live outbound click was
possible or required. Unknown `/r/` and `/go/` slugs return a private/no-store,
noindex `303` to the same-origin `/outbound/unavailable` safety surface and
never expose an affiliate destination. Deterministic CI covers the positive
exact-country contract and the negative cross-market cases.

## Legal, partner and protected-surface policy

**DETECTED:** exact market policy allows neutral informational presentation for
GB and DE where the relevant rule permits it. ES, PE, GR, SE, DK, IT, PT, NL,
FI, NO and CA fail closed when exact profile/legal authority is absent or
uncertain. Exact `AVAILABLE` without a governed route remains informational;
contradicted or prohibited state is hidden.

Ontario-only evidence does not establish Canada-wide authority. No market,
licence, partner acceptance, tracking permission, advertising approval or
commercial relationship was inferred from language or from a generic source.
The lack of a currently eligible route is a detected safe state, not a release
blocker.

Help and Responsible Gambling use trusted market context. Programme, pause,
Help, self-check, vulnerability and personal data are not commercial targeting
inputs. Programme remains route-owned and contains no Casino promotional CTA.

## Pull request and required gates

PR #134 received four narrow evidence-driven remediation commits after the
implementation commit:

| Commit | Remediation |
| --- | --- |
| `62fe7ec09ff09750ed29aaccfacf42e3b1bc4715` | Exercised trusted market projection in the PostgreSQL gate. |
| `0dbe1e6` | Hid contradicted ingestion profiles. |
| `c0ba55b8319887a0598f39604102fc5c51767072` | Reconciled browser gates with the global-catalog policy. |
| `164cb648eedfc6aeb91f4b4446d9325c7942532b` | Tightened localized profile safety assertions. |

Earlier red runs were retained as remediation evidence. The final authoritative
[workflow run `33738111477`](https://github.com/AlexG-7BE/sevenbet-next/actions/runs/33738111477)
was green at the exact final PR head:

| Required gate | Result |
| --- | --- |
| Agent Core | PASS — 16 seconds |
| Quality | PASS — 1 minute 35 seconds |
| Database / Migration Verification | PASS — 1 minute 50 seconds |
| Build / Browser | PASS — 15 minutes 13 seconds |
| Vercel | PASS |
| Vercel Preview Comments | PASS |

The PR merged only after those gates passed and with an exact-head guard. GitHub
records the merge at `2026-09-03T09:34:25Z`.

## Preview and Production deployment

**DETECTED / FOUNDER ACCEPTED:** immutable Preview deployment
`dpl_3jEaucv989vAvsctqKqPjP7fJ7xv`
(`sevenbet-next-d2gi1tci5-alexg-7bes-projects.vercel.app`) had already passed
Founder acceptance before merge. Later remediation heads also received green
Vercel Preview checks.

**DETECTED:** the exact post-merge application deployment is:

| Field | Value |
| --- | --- |
| Project | real `sevenbet-next`, `prj_LcIIeqCpeTiBjWSxiwSsMu5jNLhb` |
| Deployment | `dpl_Guy4E9LLYKQpws5MHWjQ7GYTibKZ` |
| Generated URL | `sevenbet-next-7be38um69-alexg-7bes-projects.vercel.app` |
| Git source | `main` at `f7f1251558ca6be773863023f01d2a8a1a054543` |
| Target/state | Production / READY |
| Canonical aliases | `b4gamble.com`, `www.b4gamble.com`, `sevenbet-next.vercel.app` plus the project and Git-main aliases |

The canonical domain was confirmed to resolve to this exact deployment before
acceptance. The standard `ops:smoke` check passed all nine read-only routes.

## Production HTTP acceptance

The final direct acceptance harness passed 12 evidence groups:

| Area | Detected result |
| --- | --- |
| Root negotiation | Six published `Accept-Language` values resolve privately to the correct language root. |
| Language routes | Six Casino routes return 200 with exact `Content-Language`, private/no-store isolation and no demos. |
| SEO | English exposes `en`/`x-default`; non-indexable languages are self-canonical `noindex, follow` without false alternates. |
| Legacy migration | 13 representative BCP-47/market/redundant paths redirect permanently in one hop and remove `country`. |
| Global catalogue | Eight real identities under trusted KZ GEO are informational, scoreless, market-fact-free and action-free. |
| Trusted GEO | Client-supplied GB/DE/ES/PE/GR/SE/DK headers cannot override provider GEO. |
| Language isolation | Betsson EN/ES/SV pages under KZ expose neither PE nor SE facts and no referral action. |
| Protected/promotional surfaces | 24 localized Bonus, Best Offers, Help and Responsible Gambling pages expose no referral action. |
| Comparison | Betsson/Hello Casino remain score-unknown, informational and action-free; API is private/no-store/noindex. |
| Programme | `country` is inert; localized Programme remains canonical/private with no Casino referral action. |
| Redirect failure | Unknown referral slugs fail closed to the same-origin unavailable surface. |
| Sitemap | Seven safe English profiles plus approved English canonicals; no non-indexable language, legacy locale or demo URL. |

Sampled public API response times in the final pass were 591 ms, 445 ms and
361 ms. These bounded samples detect no material release regression; they are
not a load or percentile benchmark.

## Production browser acceptance

**DETECTED PASS:** Playwright exercised ten representative desktop routes at
1440 × 1000 and the mobile shell at 390 × 844. Every route returned 200 with
zero horizontal overflow, zero Next.js runtime dialog, zero page/console error
and zero main-content `/r/` or `/go/` action.

Desktop and mobile language switching removed `country`, preserved the safe
`q=slot` query, persisted only the selected language, and retained the same
provider-owned KZ market indicator through German → Greek → Spanish and Swedish
→ Danish switches. Localized Betsson pages exposed no PE/SE currency, payment
or regulator fact in the KZ request context.

## Production data acceptance

The final aggregate/data-projection audit used the Production-only `PRODDB_*`
provider identity and PostgreSQL-enforced `transaction_read_only=on` with
`transaction_isolation=repeatable read`.

| Inventory | Count |
| --- | ---: |
| Casinos / published non-archived Casinos | 34 / 33 |
| Casino market profiles | 34 |
| Operators / brands / licences | 4 / 8 / 35 |
| Market evidence / bonuses / images | 77 / 27 / 75 |
| Affiliate networks / programmes / offers / tracking links | 1 / 5 / 5 / 5 |
| Tracking-link countries / eligible routes | 0 / 0 |
| Redirect slugs / commercial opportunities | 5 / 60 |

The global projection was eight `INFORMATIONAL_ONLY`, zero `PROMOTABLE`, zero
referral actions. The complete configured-market result was:

| Market | PROMOTABLE | INFORMATIONAL_ONLY | HIDDEN | Referral actions |
| --- | ---: | ---: | ---: | ---: |
| GB | 0 | 7 | 1 | 0 |
| DE | 0 | 8 | 0 | 0 |
| IT | 0 | 0 | 8 | 0 |
| ES | 0 | 0 | 8 | 0 |
| PE | 0 | 0 | 8 | 0 |
| PT | 0 | 0 | 8 | 0 |
| GR | 0 | 0 | 8 | 0 |
| NL | 0 | 0 | 8 | 0 |
| SE | 0 | 0 | 8 | 0 |
| DK | 0 | 0 | 8 | 0 |
| FI | 0 | 0 | 8 | 0 |
| NO | 0 | 0 | 8 | 0 |
| CA | 0 | 0 | 8 | 0 |

`mutationCount` was exactly zero.

## Cache, privacy and runtime health

Market-sensitive HTML and APIs are private/no-store. Public APIs also vary on
the trusted request-country header; unprefixed negotiation additionally varies
on `Accept-Language` and `Cookie`. Correctness therefore does not depend on a
shared CDN cache varying market-personalized HTML correctly.

The preference cookie contains no country. The implementation stores no raw IP
and adds no personal-data persistence. The database audit selected aggregate
and public projection fields only.

Two bounded Vercel log queries after acceptance returned no error-level entries
and no `5xx` entries for the exact accepted deployment.

## Documentation and rollback

Durable architecture is recorded in
[RFC-039](../06_RFC/RFC-039-Language-Only-Public-Routing-and-Global-Casino-Catalog.md).
The compliance policy is
[Global Casino Market Presentation Policy](../04_Compliance/Global-Casino-Market-Presentation-Policy.md),
and the factual implementation baseline is
[Geo, Language and Global Catalog](../05_Engineering/Technical_Baseline/14_Geo_Language_Global_Catalog.md).

Rollback is the normal Git/Vercel rollback to the recorded starting application
runtime or another verified healthy main deployment. No database rollback is
required because the release introduced no migration or data mutation. A
rollback must preserve the commercial firewall and must not re-enable a legacy
country selector or client-authoritative market input.

## Residuals and closure

**DETECTED NON-BLOCKING RESIDUALS:** non-English indexing still requires
separate Founder/legal authority; current local legal/privacy/partner evidence
remains incomplete for the listed markets; CA evidence remains Ontario-limited;
and no live positive outbound route can be accepted while eligible-route count
is zero. These conditions are represented as fail-closed product state.

GitHub's dependency view showed six pre-existing dependency notices (four high,
two moderate). They were not introduced, changed or auto-fixed in this scoped
release and remain a separate maintenance concern.

This release record and the Current State update are delivered by documentation-
only [closure PR #135](https://github.com/AlexG-7BE/sevenbet-next/pull/135).
Its merge may advance `main` and trigger an equivalent Vercel rebuild after the
accepted application runtime above; it does not change the verified runtime
behavior, schema or data state.

**GEO-LANGUAGE-GLOBAL-CATALOG-01 — COMPLETE**
