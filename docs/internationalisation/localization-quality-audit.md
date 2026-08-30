# Localization quality and route coverage

**Evidence date:** 30 August 2026
**Scope:** PR #105 feature branch; not merged or deployed to Production
**Assurance:** repository and rendered-runtime engineering QA; not legal review or a new Founder publication decision

## Coverage matrix

The states below are **DETECTED** from `lib/i18n/review-state.ts`, the market registry and the public selector implementation.

| Market | Locale | Public experience | Preview selector | Production selector | Founder publication | Indexing |
| --- | --- | --- | --- | --- | --- | --- |
| GB | `en-GB` | `PUBLIC_CORE_READY` | yes | yes | source baseline | existing GB policy |
| DE | `de-DE` | `PUBLIC_CORE_READY` | yes | yes | accepted | `noindex, follow` |
| ES | `es-ES` | `PUBLIC_CORE_READY` | yes | yes | accepted | `noindex, follow` |
| GR | `el-GR` | `PUBLIC_CORE_READY` | yes | yes | accepted | `noindex, follow` |
| SE | `sv-SE` | `PUBLIC_CORE_READY` | yes | yes | accepted | `noindex, follow` |
| DK | `da-DK` | `PUBLIC_CORE_READY` | yes | yes | accepted | `noindex, follow` |
| IT | `it-IT` | `HOME_READY` | no | no | not accepted | `noindex, follow` in Preview |
| PT | `pt-PT` | `HOME_READY` | no | no | not accepted | `noindex, follow` in Preview |
| NL | `nl-NL` | `HOME_READY` | no | no | not accepted | `noindex, follow` in Preview |
| FI | `fi-FI` | `HOME_READY` | no | no | not accepted | `noindex, follow` in Preview |
| NO | `nb-NO` | `HOME_READY` | no | no | not accepted | `noindex, follow` in Preview |
| CA | `en-CA`, `fr-CA` | `ARCHITECTURE_ONLY` | no | no | not accepted | not approved |

`HOME_READY` means that the authored Home catalog is complete. It does not assert public-core parity. `PUBLIC_CORE_READY` is the selector gate. Founder publication acceptance and indexing authority remain separate states.

### Surface coverage by locale

The surface results below are **DETECTED** from the typed catalogs, route transforms and rendered route matrix. “Draft” means a localized noindex Preview route exists but is not represented as Founder-approved public-core publication. “Boundary” means the route deliberately stays on its existing unlocalized/governed contract.

| Locale | Home | Header / footer | Best Offers | Casinos / profile | Bonuses | Compare | 10 Steps | About / FAQ | Methodology / Contact | Learn index / articles | Public errors / empty states | Exact Help / RG | Operative legal | Programme |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `en-GB` | baseline | baseline | baseline | baseline | baseline | baseline | baseline | baseline | baseline | baseline | baseline | baseline | boundary | boundary |
| `de-DE` | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | boundary | boundary |
| `es-ES` | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | boundary | boundary |
| `el-GR` | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | boundary | boundary |
| `sv-SE` | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | boundary | boundary |
| `da-DK` | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | boundary | boundary |
| `it-IT` | yes | draft | draft | draft | draft | draft | draft | draft | draft | draft | draft | no evidence | boundary | boundary |
| `pt-PT` | yes | draft | draft | draft | draft | draft | draft | draft | draft | draft | draft | no evidence | boundary | boundary |
| `nl-NL` | yes | draft | draft | draft | draft | draft | draft | draft | draft | draft | draft | no evidence | boundary | boundary |
| `fi-FI` | yes | draft | draft | draft | draft | draft | draft | draft | draft | draft | draft | no evidence | boundary | boundary |
| `nb-NO` | yes | draft | draft | draft | draft | draft | draft | draft | draft | draft | draft | no evidence | boundary | boundary |
| `en-CA`, `fr-CA` | no | no | no | no | no | no | no | no | no | no | no | no evidence | boundary | boundary |

All European rows were rendered and scanned directly. A “draft” route is useful for editorial Preview inspection, remains selector-hidden, and is not upgraded to `PUBLIC_CORE_READY` merely because it returns localized text. Source-controlled operator, offer, licence, payment and publication facts can remain in their published language inside an otherwise localized page.

## Actual public route contract

The following routes are **DETECTED** as localizable in the central route manifest:

- `/`
- `/best-offers`
- `/bonuses`
- `/casinos`
- `/compare` (canonical redirect to the Casinos comparison query)
- `/casino/[slug]`
- `/10-steps`
- `/about`
- `/contact`
- `/faq`
- `/learn` and `/learn/[category]/[slug]` (`/learn/[category]` canonicalizes to the hub filter)
- `/methodology`
- exact `/help` and `/responsible-gambling` only for GB and the DE/ES/SE/DK/GR first wave

The following remain deliberately unprefixed or protected: Programme, operative Terms, Privacy, Affiliate Disclosure, Bonus Guide, Login, Self-check, Tools, Help subroutes, outbound/referral routes, Admin, API, MCP and editorial Preview. Unknown route families fail closed.

## Rendered quality gates

The implementation now separates three layers:

1. Typed catalog QA checks source-key completeness, Unicode, placeholder structure, obvious language leakage, protected terminology, product-boundary semantics and unique curated-control labels.
2. Rendered browser QA checks actual text and metadata for unresolved tokens, fake numbered controls, locale/canonical/noindex behavior, selector membership and horizontal overflow.
3. Manual visual review covers Home, Casinos, Bonuses, Methodology and Learning at 390 and 1536 pixels, plus all required Home widths from 360 through 1920 pixels.

Operator names, legal entities, licence identifiers, payment names and exact offer/source facts remain source-controlled. The surrounding interface is localized; source facts are not rewritten to manufacture evidence.

## Founder defects converted to regressions

- German Home uses a locale-specific hero cap and a wrapping kicker; no global display scale is reduced.
- Spanish Home uses the natural statement “El juego resulta / cada vez más difícil de controlar.” so punctuation is not stranded across art-directed lines.
- Every rendered product message is interpolated before display; Danish Bonuses cannot expose `{market}`.
- Bonus tabs retain stable selector IDs and render the exact localized meanings of Best Overall, Low Wagering, Low Deposit, Crypto and Newest.
- Preview and Production selectors expose only `PUBLIC_CORE_READY` locales.

## Bounded conclusions

- **DETECTED:** no change in this pass activates a partner, offer, tracking link, referral, indexing or localized operative legal body.
- **DETECTED:** non-GB commercial actions remain subject to the existing independent fail-closed authority path.
- **PROPOSED UNTIL MERGE:** the repaired runtime and QA gates are PR #105 branch state, not Production state.
