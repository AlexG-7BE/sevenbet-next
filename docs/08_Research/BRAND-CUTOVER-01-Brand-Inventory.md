# BRAND-CUTOVER-01 Brand Reference Inventory

- **Repository root confirmed:** `/Users/alex/Documents/Codex/2026-07-09/ns/sevenbet-next`
- **Scanned:** 2026-08-09, before and after implementation
- **Scope:** all 833 tracked files plus non-ignored active repository paths; dependencies, `.next`, coverage, Playwright reports/results, caches and `tsconfig.tsbuildinfo` excluded
- **Search terms:** `SevenBet`, `Seven Bet`, `SEVENBET`, `sevenbet`
- **Initial classification basis:** 214 active files contained at least one search term; every changed public surface was then checked through route/source regression tests

No secret values or local environment contents were inspected or recorded.

## Classification evidence

| Classification | Representative detected locations | Treatment | Result |
| --- | --- | --- | --- |
| `PUBLIC_CONSUMER_BRAND` | Public Shell, Home, Programme, Protected Help, tools, casino/bonus/comparison/learning pages, public errors, structured data and `llms.txt` | Replace current visible identity with exact `B4GAMBLE`; preserve surrounding approved copy and layout | **Detected:** current classified public sources and representative rendered routes expose B4GAMBLE and no active SevenBet identity. |
| `PUBLIC_LEGAL_BRAND` | Privacy, Terms, Affiliate Disclosure and complaint/privacy-rights copy | Change only the trading name to `7BE Inc., trading as B4GAMBLE`; retain company, address and existing mailboxes | **Detected:** exact legal identity and contacts are regression-tested. |
| `PUBLIC_AUTH_OR_COMMUNICATION_COPY` | Better Auth `appName`, account/Programme UI, fixed disabled account-security and reminder templates | Replace consumer identity; retain provider, linking, subject-isolation, purpose-policy and disabled-transport architecture | **Detected:** app name and all three fixed templates use B4GAMBLE; transport remains disabled and commercial marketing denied. |
| `INTERNAL_IMPLEMENTATION_IDENTIFIER` | `sevenbet-next` package/repository/Vercel project, `createSevenBetAuth`, `SevenBetAuthOptions`, admin/CMS labels, internal seed/build symbols | Preserve when it does not leak into current consumer output | **Detected:** representative identifiers remain unchanged. |
| `LEGACY_COMPATIBILITY_IDENTIFIER` | `SEVENBET_*`, `x-sevenbet-*`, `sevenbet.programme.*`, cookies/storage/subject keys, fixture IDs and the legacy Vercel project alias | Preserve protocol, persistence and operational compatibility | **Detected:** bounded regression assertions protect representative environment, header and storage identifiers. |
| `HISTORICAL_DOC_RFC_HANDOFF` | Earlier RFCs, implementation plans, decisions, handoffs and historical Production evidence | Preserve historical truth; update only current operational instructions and source-of-truth state | **Detected:** RFC-019 records the transition and current state/roadmap/runbooks use the new target without rewriting history. |
| `TEST_EXPECTATION` | Public rendering, legal, auth, communications, canonical and compatibility suites | Update public expectations; retain old-brand fixtures only where they prove presentation reconciliation or compatibility | **Detected:** the dedicated brand suite exercises both replacement and preservation boundaries. |

## Current residual boundary

**Detected and intentionally retained:** old-name occurrences remain in historical governance records; repository/Vercel/package names; internal admin/CMS and code symbols; fixture authoring authority; environment/protocol/storage compatibility identifiers; migration comments; and tests that inject legacy fixture text to prove B4GAMBLE presentation reconciliation.

**Detected:** temporary RFC-012 exact-ID database fixture text is not mutated. The public server-owned presentation boundary maps its legacy brand text to B4GAMBLE while retaining exact record IDs, commercial denial and noindex controls.

**Not detected:** a Prisma schema change, migration, seed execution, Production data mutation, new API, dependency upgrade, Preview-domain change, Google activation, email transport activation or commercial activation in BRAND-CUTOVER-01.

**Planned:** before Founder-approved merge, Founder/Operations must set and verify the Production-only environment contract without deploying or mutating current Production. The automatic exact-main deployment after merge must make `https://b4gamble.com` authoritative and pass the ordered release verification. External Google activation, email infrastructure and any legacy Vercel-alias redirect remain separate controlled actions.
