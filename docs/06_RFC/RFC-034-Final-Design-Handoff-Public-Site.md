# RFC-034 — Final Design Handoff Public Site

## Status

**Approved for bounded Draft-PR and Preview implementation on 2026-08-16.** Founder authority is the supplied `B4GAMBLE_CODEX_IMPLEMENTATION_PACK_V1_2` and the explicit implementation instruction recorded with this RFC. This RFC authorises no merge to `main`, Production configuration change, Production deployment, destructive migration, provider change or commercial activation.

## Decision

Implement the supplied final design handoff as the public-site presentation and information-architecture authority. Preserve the existing application as the functional authority for Programme, authentication, CMS, affiliate, jurisdiction, privacy, security, rewards and data handling.

The bounded change may:

- replace public presentation, responsive layout, navigation, footer and static Draft Preview copy with the handoff equivalents;
- retain live public DTOs and services for casino, offer, comparison, CMS and Programme-derived values;
- add a client-only, maximum-three-casino comparison tray and modal that opens automatically on the second selection;
- extend privacy-safe public commercial UI analytics for aggregate placement/outcome measurement;
- redirect retired public destinations according to the route table below; and
- produce one Draft PR and one Vercel Preview with visual and regression evidence.

It may not:

- change Mission order, prerequisites, reward amounts, achievement rules or server-authoritative Programme calculations;
- move Programme, Help or protected data into public/commercial stores, targeting or analytics;
- change authentication, persistence, provider, affiliate, jurisdiction, consent, security or protected Help boundaries;
- expose a standalone public Compare destination, create new CMS content, or publish unapproved factual claims to Production; or
- modify Production state, merge to `main` or deploy Production configuration.

## Evidence baseline

- **Detected:** repository root `/Users/alex/Documents/Codex/2026-07-09/ns/sevenbet-next` at `origin/main` commit `0c956d0d99c9ac703234e82a0bca3c1d5b3a9167`.
- **Detected:** 1,015 active repository paths were scanned after excluding dependencies, generated output, caches and `tsconfig.tsbuildinfo`.
- **Detected:** handoff archive SHA-256 is `35cfccb78a3e368e0e58c720ef8ad306c7cebaf4aaf56b42bceb23e44b1a2862`, matching the manifest.
- **Detected:** the archive contains 24 `.dc.html` screens, five JPEGs, two SVGs and editor-only support files. Every screen was rendered and inspected at desktop size before implementation.
- **Detected:** current public commercial data is exposed through `publicCasinoDiscoveryService`, `publicOfferService` and `publicComparisonService`; Programme progress and rewards remain server-derived.
- **Inferred:** static copy in the handoff is preview editorial authority, not verified evidence. It therefore remains subject to the claims audit and may not silently replace live dynamic values.

## Public route decision

Canonical public destinations are `/`, `/10-steps`, `/program`, `/login`, `/best-offers`, `/casinos`, `/casino/[slug]`, `/bonuses`, `/bonus-guide`, `/learn`, `/learn/[category]/[slug]`, `/responsible-gambling`, `/help`, `/methodology`, `/about`, `/faq`, `/affiliate-disclosure`, `/contact`, `/privacy` and `/terms`, plus the branded not-found surface.

The following compatibility redirects are approved:

| From | To |
| --- | --- |
| `/compare` | `/casinos`, preserving valid `casino`, `country` and `differences` state so comparison can initialise contextually |
| `/catalog` | `/casinos` |
| `/responsible-gaming` | `/responsible-gambling` |
| `/self-check` | `/responsible-gambling` |
| `/tools/budget-calculator` | `/responsible-gambling` |
| `/learn/[category]` | `/learn?category=[category]` |
| retired Help child routes | `/help` or the corresponding `/help` anchor |

`/compare` is excluded from primary/footer navigation, canonical output and the sitemap. `/bonus-guide` remains a standalone indexable page because the implementation manifest's explicit Founder decision takes precedence over a later generic core-route removal bullet.

## Programme and Help boundary

The handoff authorises a presentation update to the Programme acquisition and dashboard surfaces, including value-first copy and the visual treatment of the current Mission state. Existing server routes, adapters, progression, XP, persistence, protected navigation and fail-closed behaviour remain authoritative. The protected Help shell keeps its safety-first theme and must not become commercial or personalised.

This RFC supersedes RFC-025 and RFC-033 only where those documents prescribe a conflicting public presentation, acquisition sequence or destination list. It does not supersede their Programme, privacy, data-separation, reward or release-gate controls.

## Comparison and analytics boundary

Comparison state contains only validated public casino slugs, country and the optional differences preference. It is capped at three entries and may use URL state and `sessionStorage`. It must call the existing public comparison service and fail closed for unavailable or ineligible entries.

Additional UI analytics may measure anonymous aggregate views and outcomes for Best Offers, Casinos, Reviews and the contextual comparison experience. No Programme, Help, authentication, free text, stable user identifier, recommendation profile or protected data is allowed. Public operator slug may be used only where it is already present in the viewed public URL or DTO and is not joined to an account or protected state. This narrowly extends RFC-026's closed event registry for the approved public surfaces; server-side data minimisation and Vercel Analytics remain unchanged.

## Release gates

Before handoff, the branch must pass lint, type checking, quality checks, production build, route-inventory and comparison tests, relevant Playwright regression coverage, responsive screenshots at 1440, 1024, 430 and 390 widths, a copy/claims audit and `git diff --check`. Any unmet gate must be recorded as a known limitation. Only a Draft PR and Vercel Preview may be created.

## Decision ledger

| Decision | Reason | Governing evidence |
| --- | --- | --- |
| Handoff is the visual lock | Design and architecture phases are complete | Founder implementation instruction and pack v1.2 |
| Existing services remain the data lock | Prevents visual work from duplicating or weakening domain rules | Product Vision, Programme standards, repository evidence |
| Comparison is contextual, not a destination | Required final interaction and public IA | Final manifest |
| `/bonus-guide` stays indexable | Explicit retained-route decision is more specific than the generic removal bullet | Final manifest, conflict-resolution rule |
| Draft claims remain visible only in Preview and audited | Copy fidelity does not establish factual proof | Full-site prompt and claims-audit requirement |
| No Production action | The authority is bounded to review | Founder instruction and this RFC |
