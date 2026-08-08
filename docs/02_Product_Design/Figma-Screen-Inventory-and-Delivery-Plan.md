# SevenBet Figma Screen Inventory and Delivery Plan

## Document control

- **Reconciled:** 2026-08-08
- **Repository baseline:** `2d151218b3e4f85f40fc3473b4b5c63dfaba57e3`
- **Figma file:** [SevenBet — `UvuJZEzeMAd8cK9TNAueb8`](https://www.figma.com/design/UvuJZEzeMAd8cK9TNAueb8)
- **Visual direction:** RFC-007 Tilt-Locked Human Product Theatre
- **Status:** current visual-authority inventory after FE-GAP-02; design approval is not product, data, legal or market approval

## Evidence and classification

The repository root was confirmed as `/Users/alex/Documents/Codex/2026-07-09/ns/sevenbet-next`. Source analysis excluded dependencies, build output, caches and generated artefacts. Live Figma and current repository evidence were inspected; existing documentation and old handoffs were not treated as proof.

- **Detected:** directly present in current source or the live Figma file.
- **Inferred:** a bounded conclusion from detected evidence.
- **Planned:** approved direction not implemented in current source.
- **Not detected:** no supporting implementation was found.

## Current live counts

**Detected:** the Figma file has **10 pages**. The prior nine-page count is superseded by the live `Expressive Redesign Sprint — Round 2` page (`722:1093`).

This reconciliation tracks **29 current product/surface authority groups** required for the post-migration baseline:

| Classification | Count | Meaning |
| --- | ---: | --- |
| Implemented/current frontend authority | 27 | A current route or cross-route contract is detected. FE-DS normalization may remain. |
| Product/capability-gated | 2 | Visual authority exists, but the live capability must not be claimed. |
| **Total tracked groups** | **29** | This is the reconciled launch/product authority set below, not a count of every exploratory frame in the file. |

Historical explorations and the `ROUND 2B — FUNCTIONAL CONTENT EXTENSIONS — NOT APPROVED` section (`737:873`) are excluded. Visual existence never upgrades a product-gated capability to implemented.

## Current authorities

| # | Surface | Current live Figma authority | Repository status at baseline |
| ---: | --- | --- | --- |
| 1 | Public Shell | Header set `289:43`; Footer set `488:100`; responsive family `492:2268` | **Detected — implemented.** Shared public layout owns one Header, main and Footer. |
| 2 | Home | Desktop `661:7551` (`661:7554`); mobile `657:2545` (`657:2548`, `661:2686`) | **Detected — implemented** through FE-MIG-16. |
| 3 | 10 Steps | Desktop `502:2238`; mobile `502:2412` | **Detected — implemented** through FE-MIG-10; Missions 05–10 remain unavailable. |
| 4 | Casino Directory | Desktop `520:2496`; mobile `521:312` | **Detected — implemented** with server-owned query/projection. |
| 5 | Casino Profile | Desktop `529:2850`; mobile `530:809` | **Detected — implemented** from published DTOs with unavailable states. |
| 6 | Bonuses | Round 2B family `835:2920`; desktop `835:2923`; mobile `835:3121`; prior state family `541:3002` / `541:3950` | **Detected — implemented.** Canonical data, not illustrative Figma values, is authoritative. |
| 7 | Best Offers | Desktop `556:3336`; mobile `557:1470` | **Detected — implemented** with final one-H1 semantics. |
| 8 | Comparison | Desktop `567:3592`; mobile `569:1589` | **Detected — implemented** at `/compare`. |
| 9 | Programme Missions 01–04 | Desktop flows `407:699`, `449:1413`, `468:1753`; mobile family `580:1713` | **Detected — implemented** with server-owned progress and rewards. |
| 10 | Programme Map / My Plan | Desktop `666:4862`; mobile `668:2671` | **Detected — current Programme journey exists;** full production-pattern normalization belongs to FE-DS-01. Missions 05–10 have no completion policy. |
| 11 | Protected Help Hub | Desktop `599:3891`; mobile `600:1718`; shell family `599:3886` / `600:1713` | **Detected — implemented** in a dedicated non-commercial shell. |
| 12 | Protected Help articles | Desktop `599:3972`; mobile `600:1792` | **Detected — all ten approved slugs implemented.** |
| 13 | Pause / Support | Desktop `674:5143`; mobile `674:8171` | **Detected — Cooling-off governed states implemented;** unsupported local claims remain blocked. |
| 14 | Methodology | Round 2B `835:4293`; desktop `835:4296`; mobile `835:4427` | **Detected — implemented.** Editorial/data approval remains separate from layout approval. |
| 15 | Affiliate Disclosure | Desktop `646:4469`; mobile `649:2259` | **Detected — implemented** as neutral trust content. |
| 16 | About | Round 2B `835:5298`; compact desktop amendment `923:2693` / `923:2694`; mobile `835:5436` | **Detected — implemented** with the Founder-approved compact desktop Hero. |
| 17 | Learning hub | Round 2B `835:6356`; desktop `835:6359`; mobile `835:6473` | **Detected — implemented.** Search/filter extensions remain outside current product authority. |
| 18 | Learning category | Desktop `632:4360`; mobile `634:2177` | **Detected — implemented.** |
| 19 | Learning article | Desktop `633:4341`; mobile `635:2148`; unavailable `635:2254` | **Detected — implemented** with evidence lifecycle and protected boundary. |
| 20 | Bonus Guide | Desktop `694:5455`; mobile `694:8724` | **Detected — implemented**; content/source approval remains a release gate. |
| 21 | Privacy | Family `924:2798`; desktop `924:2799`; mobile `924:2926`; responsive proofs `926:2`, `926:13`, `926:24` | **Detected — substantive route implemented,** `noindex, follow`, absent from sitemap. |
| 22 | Terms | Family `924:3020`; desktop `924:3021`; mobile `924:3144`; responsive proofs `926:35`, `926:46`, `926:57` | **Detected — substantive route implemented,** `noindex, follow`, absent from sitemap. |
| 23 | Self-Check | Family `924:3238`; intro `924:3240`; question `924:3268`; results `924:3300`, `924:3329`, `924:3358`; fallbacks `926:80`, `926:84` | **Detected — implemented** as an eight-question, non-score, local-only reflection with Help-first result. |
| 24 | Personal Gambling Limit Tracker | Family `924:3422`; form `924:3424`; mobile `924:3555`; fallback `926:96` | **Detected — implemented** as user-defined pre-commitment; no affordability or safe-spend recommendation. |
| 25 | Product / Trust FAQ | Section `929:3020`; desktop `929:3021`; mobile `929:3148`; contract `929:3259` | **Detected — implemented** with native disclosures; it is not Protected Help. |
| 26 | Commercial Handoff | Desktop family `679:5238`; confirmation `679:5319`; mobile family `679:8391`; confirmation `679:8489` | **Detected — implemented.** Confirmation precedes managed server resolution. |
| 27 | Commercial Handoff neutral recovery | Amendment `930:3109`; desktop `930:3111`; mobile `930:3123`; contract `930:3133` | **Detected — implemented.** No redirect or substitute offer on failure. |
| 28 | Identity / privacy account capabilities | Desktop `613:4023`; mobile `624:1930` | **Product/capability-gated.** Sign-in exists; account-wide export, erasure lifecycle and complete password recovery are **not detected**. |
| 29 | Age / Market Boundary | Desktop `686:5333`; mobile `686:8301` | **Product/capability-gated.** Generic fail-closed visuals exist; a trusted live age/jurisdiction policy dataset and public enforcement are **not detected**. |

## Renumbered/current nodes

The final closure families resolve live with the IDs shown above. In particular, the current FAQ mobile authority is `929:3148`, not an earlier authored descendant. Current legal, safety-tool and recovery children must be copied from this inventory rather than old handoffs or PR #40.

## Final delivery disposition

- **Implemented:** the 27 current frontend authority groups above. Known page-level P0 and P1 migration gaps are closed through FE-GAP-02.
- **Deferred product:** Missions 05–10; account export/erasure/recovery; trusted age/market capability; unapproved Learning search/filter extensions.
- **FE-DS-01 delivered for review:** production token/component normalization, duplicate/dead-code audit, responsive/accessibility contracts, bounded visual regression, Storybook decision, production Figma back-sync and governance are recorded in [Design System v1](Design-System-v1.md).
- **Not implied:** launch readiness, GB compliance approval, real-partner readiness or production operational completeness.

## Design System v1 back-sync

**Detected:** the existing file still has 10 pages; no parallel file or page family was created. FE-DS-01 changed only reusable-system documentation and the existing Core Button:

- `Foundations`: production token contract board `934:2`.
- Collections evolved in place: Primitives `VariableCollectionId:285:2`, Color `VariableCollectionId:285:3`, Spacing `VariableCollectionId:285:4`, Radius `VariableCollectionId:285:5`.
- 58 production variables; all 22 semantic colours alias primitives; exact CSS WEB syntax; zero broken aliases.
- `Components/Core`: `Core / Button` `287:43`, 24 variants across three styles, two sizes and Default/Hover/Focus/Disabled states. Hover fills match production tokens; Focus preserves 52px/64px base geometry and demonstrates the 3px `safety/verified` ring with a 3px visual gap.
- Disabled is an `ActionButton` state. `ActionLink` has no disabled navigation API; unavailable navigation must not render an actionable shared link.
- `Ready for Dev`: FE-DS-01 handoff board `937:2` with code paths, exact Action interaction-state parity, responsive widths, accessibility, safety boundaries, deferrals and deprecation guidance.

**Detected:** no approved page family was deleted, moved or renamed. Core/Button was evolved in place, so no reusable Figma pattern was superseded. Historical artefacts remain intact.

**DESIGN SYSTEM V1: READY FOR FOUNDER REVIEW.**
