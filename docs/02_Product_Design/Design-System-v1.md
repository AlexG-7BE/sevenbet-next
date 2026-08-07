# SevenBet Design System v1

## Document control

- **Reconciled:** 2026-08-08
- **Repository baseline:** `2d151218b3e4f85f40fc3473b4b5c63dfaba57e3`
- **Delivery record:** the FE-DS-01 implementation pull request and its merge commit in Git history
- **Figma:** [SevenBet — `UvuJZEzeMAd8cK9TNAueb8`](https://www.figma.com/design/UvuJZEzeMAd8cK9TNAueb8)
- **Governing authority:** Product Vision & Principles v2.0 and RFC-007 Tilt-Locked Human Product Theatre
- **Status:** Design System v1 delivery candidate for Founder review; not launch, legal, data-partner or operational approval

## Evidence method

The active repository root was confirmed as `/Users/alex/Documents/Codex/2026-07-09/ns/sevenbet-next`. All 729 active tracked/source paths were scanned; dependencies, generated output, build artefacts, caches, Playwright output and `tsconfig.tsbuildinfo` were excluded. Live Figma was read and updated in the existing file. Claims use these classifications:

- **Detected:** directly present in current source, test output or live Figma.
- **Inferred:** a bounded conclusion from detected evidence.
- **Planned:** approved direction not implemented in the current delivery.
- **Not detected:** no supporting implementation was found.

## Purpose and outcome

**Detected:** FE-DS-01 consolidates production-proven foundations and one genuinely reusable action family without reopening any page design. It establishes a code/Figma token contract, a bounded shared Action primitive, accessibility and motion defaults, visual baselines, deprecation evidence and a lightweight change process.

**Detected:** page-specific compositions and safety/commercial domain systems remain owned by their routes or domain packages. This is deliberate: visual similarity does not override semantic, commercial or protected-safety boundaries.

## Production inventory

| Layer | Detected owner | Disposition |
| --- | --- | --- |
| Public shell | `components/public-shell/` and `app/(public)/layout.tsx` | **Unchanged.** One Header, main and Footer; responsive navigation remains a bounded client island. |
| Protected Help shell | `components/protected-help/` and `app/responsible-gambling/layout.tsx` | **Unchanged/domain-specific.** No Public Shell or commercial action. |
| Foundations | `app/design-system.css`, `app/globals.css`, route CSS Modules | **Consolidated.** Semantic production palette, spacing, radius, focus and motion live in the global contract. Route composition remains local. |
| Shared Action | `components/design-system/Action.tsx` | **Shared.** Internal navigation and application actions only; three visual styles and two sizes. |
| Public commercial handoff | `components/public-offers/`, casino/public offer packages and managed outbound routes | **Domain-specific.** Confirmation and server-managed resolution are not part of shared Action. |
| Programme | `components/active-control-program/`, Programme services and route modules | **Domain-specific.** Server owns progress, XP, completion and next Mission. |
| Forms/control tools | Self-Check and Personal Limit Tracker route modules | **Domain-specific.** Local/private tool state and safety outcomes remain isolated from commercial components. |
| Legal/editorial/evidence | Legal, learning, methodology, trust and evidence route modules | **Kept local.** Their hierarchy and source lifecycle differ despite recurring visual motifs. |

### Consolidation decisions

| Candidate | Decision | Reason |
| --- | --- | --- |
| Primary action button/link | **Consolidated** as `ActionButton` and `ActionLink` | Repeated internal action geometry and states were production-proven; semantic elements remain distinct. |
| Secondary and text actions | **Kept domain-specific** | Contrast context, disclosure hierarchy and safety meaning differ by domain. |
| Commercial outbound action | **Kept domain-specific** | Must use confirmation and managed server handoff; cannot become a generic anchor. |
| Protected external support | **Kept domain-specific** | Protected Help owns support meaning and must never acquire commercial variants. |
| Container and section intro | **Kept route-specific** | Approved page families use intentionally different theatre widths and rhythms. |
| Eyebrow, badge and status panel | **Token-normalized; not extracted** | Visual recurrence was detected, but semantics and density were not uniform enough for a safe shared API. |
| Field wrapper, labelled input and validation message | **Kept domain-specific** | Self-Check, limit, commercial and admin forms have different error and privacy contracts. |
| Disclosure/accordion | **Kept native/domain-specific** | Native `details`/`summary` already supplies correct semantics without a speculative abstraction. |
| Evidence/source row and recovery panel | **Kept domain-specific** | Evidence lifecycle and fail-closed recovery are architectural, not cosmetic, concerns. |
| Modal/dialog frame | **Kept commercial-domain-specific** | Managed outbound confirmation has focus, Escape and recovery responsibilities unavailable to a generic shell. |

## Token model

**Code authority:** `app/design-system.css`, loaded before `app/globals.css`.

| Category | Code naming | Figma collection / naming |
| --- | --- | --- |
| Primitive colour | private `--sb-night`, `--sb-paper`, `--sb-acid`, `--sb-teal`, status primitives | `Primitives` / primitive role names |
| Semantic colour | `--sb-surface-*`, `--sb-text-*`, `--sb-action-*`, `--sb-border-*`, `--sb-safety-*`, `--sb-status-*`, `--sb-focus-*` | `Color` / `surface/*`, `text/*`, `action/*`, `border/*`, `safety/*`, `status/*`, `focus/*` |
| Typography | `--sb-type-{role}-{size|line}` plus the existing Next font variables | Code-owned scale; production Figma components retain approved Archivo roles |
| Spacing | `--sb-space-{1|2|3|4|6|8|12|16|24|32}` | `Spacing` / `space/*`; values are 4–128px |
| Radius | `--sb-radius-{none|s|m|l|full}` | `Radius` / `radius/*` |
| Layout width | `--sb-content-{compact|default|wide|shell}` | Code-owned responsive composition constraints |
| Focus and motion | `--sb-focus-*`, `--sb-motion-*`, `--sb-ease-standard` | Focus is represented in Core/Button; motion remains code-only because the Figma Motion page has no production timeline contract |

Consumers should use semantic roles. Primitive aliases remain private to the token file so a palette change cannot silently change a component's meaning.

### Objective consolidation metrics

The same read-only scanner was run against the baseline and FE-DS working tree.

| Metric | Before | After | Interpretation |
| --- | ---: | ---: | --- |
| CSS files | 25 | 27 | One token file and one shared Action CSS Module were added. |
| CSS Modules | 24 | 25 | Route ownership remains intentionally local. |
| CSS lines | 9,655 | 9,818 | Explicit tokens and the shared Action contract add documented system code. |
| Custom-property declarations | 173 | 260 | Increase is intentional: implicit literals became named production roles. |
| Unique custom properties | 79 | 162 | The system now separates primitive, semantic, geometry and interaction roles. |
| Literal hex occurrences | 572 | 343 | 229 literal occurrences were removed. |
| Core production-palette literals outside the token file | 252 | 0 | Recurring production palette is centralized. |
| Font-family declarations | 37 | 38 | One explicit server-safe Action declaration was added; route font ownership was not rewritten. |
| Breakpoint occurrences / unique widths | 90 / 28 | 90 / 28 | No approved responsive behavior was reopened. |
| Broad action-selector candidates | 370 | 371 | The shared primitive was added; domain action selectors intentionally remain. |
| Focus selectors | 58 | 59 | Shared Action adds its explicit focus-visible state. |
| Hard-coded outline declarations | 32 | 31 | The governed commercial dialog now uses focus tokens; domain-specific outlines otherwise remain. |
| Component TSX files | 52 | 48 | Five unreachable wrappers removed; one shared Action component added. |
| Client boundaries | 38 | 37 | One dead client wrapper removed; no shared primitive clientification. |

Selector counts are audit heuristics, not claims that every matching selector is a duplicate. The unchanged breakpoint spread and retained route CSS are deliberate parity decisions.

## Component model

### Shared Action

- **Code:** `components/design-system/Action.tsx` and `Action.module.css`.
- **Figma:** `Components/Core` → `Core / Button` (`287:43`).
- **Styles:** Primary, Ghost / Night, Ghost / Paper.
- **Sizes:** Medium (52px minimum height), Large (64px minimum height).
- **States:** Default, Hover, Focus, Disabled.
- **Semantics:** `ActionLink` renders navigation; `ActionButton` renders application action. External/commercial resolution is prohibited.
- **Accessibility:** native disabled behavior; `aria-disabled` presentation support; 3px focus-visible indicator; no glow; minimum target height at least 52px.
- **Responsive:** content-sized by default with bounded local CSS variable overrides; mobile full-width behavior stays with the consuming layout.
- **Runtime:** server-compatible; no `use client`, browser global or Prisma import.

### Domain component rule

A pattern remains domain-specific when reuse would erase commercial confirmation, protected-help separation, private/control semantics, server-owned Programme state, evidence lifecycle or route-specific editorial hierarchy. Domain packages may use global tokens without becoming Core components.

## Responsive contracts

**Detected:** exact page geometry was compared before/after for 16 representative routes at 1440×1000 and 390×844. All 32 renders retained exact document height and zero horizontal overflow.

**Detected:** representative shell, commercial, legal, form, protected-help, editorial and Programme surfaces were validated across 1440, 1280, 1024, 768, 430, 390, 375, 360 and 320px. Existing 28 breakpoint values remain because they encode approved page-family transitions; FE-DS-01 did not invent a new universal breakpoint grid.

New shared components must prove their intrinsic sizing at 320px and at the consuming page's approved transition widths. A shared component must not own page-level gutters or hero composition.

## Accessibility contract

- One main landmark belongs to each shell; Public and Protected Help shells never nest.
- Focus-visible uses a visible 3px semantic indicator. Focus must not rely on glow, transform or colour alone.
- Button and link semantics are not interchangeable. Keyboard Enter/Space behavior remains native to the rendered element.
- Dialogs retain labelled native dialog behavior, focus return and Escape handling in their domain owner.
- Disclosures prefer native `details`/`summary`; forms retain visible labels, errors and result focus behavior.
- Reduced-motion collapses shared transition durations to `0ms`; domain hover transforms are disabled by their existing media queries.
- Acid is reserved for primary action hierarchy. Protected/safety emphasis uses semantic teal and does not become an offer cue.
- Minimum shared Action target height is 52px; consuming layouts may increase it but not reduce it.

## Visual regression

**Detected:** Playwright is the existing test runner, so no new dependency was added. Ten bounded snapshots cover Home desktop/mobile, the mobile Public menu, Protected Help desktop/mobile, FAQ desktop, Privacy mobile, a Self-Check question, a planned-over limit result and About mobile.

- **Manifest:** `tests/design-system-visual.spec.ts`
- **Baselines:** `tests/design-system-visual.spec.ts-snapshots/`
- **Configuration:** `playwright.config.ts`
- **Determinism:** fixed viewport and local truthful data; fonts awaited; transitions, animation and carets disabled; no synthetic production records.
- **Safe update:** review the code diff and the actual screenshot diff, confirm the approved Figma family and product hierarchy are unchanged, then run `npx playwright test tests/design-system-visual.spec.ts --update-snapshots --workers=1`. Never approve a bulk update without visual review.

## Figma ↔ code synchronization

**Detected:** the existing Figma file was evolved in place; no parallel file or speculative library was created.

| Figma area | Node / collection | Production relationship |
| --- | --- | --- |
| Foundations production token board | `934:2` | Documents semantic colour, spacing, radius and code-only focus/motion contracts. |
| Primitives | `VariableCollectionId:285:2` | 21 primitive variables; mode renamed `Value`; hidden from normal component consumption. |
| Color | `VariableCollectionId:285:3` | 22 semantic variables; mode renamed `Default`; all values alias primitives. |
| Spacing | `VariableCollectionId:285:4` | 10 variables; mode `Value`. |
| Radius | `VariableCollectionId:285:5` | 5 variables; mode `Value`. |
| Core / Button | `287:43` | 24 variants across style, size and state; full radius and Focus strokes are variable-bound. |
| Ready for Dev | `937:2` | Production handoff, responsive contract, accessibility, domain boundaries, deprecation and traceability. |

All 58 local production variables have exact WEB syntax; semantic aliases with CSS equivalents use `var(--sb-*)`. Validation found 22 aliases, zero broken aliases, zero missing/malformed WEB syntax and zero semantic colour values bypassing primitives.

### Authority

- **Page design/new product composition:** the approved Figma family is design authority before implementation.
- **Production tokens/component behavior:** code and Figma Design System v1 must remain synchronized.
- A code-only reusable token/component change without Figma back-sync is incomplete.
- A Figma-only reusable token/component is not production truth until implemented and tested in code.

## Domain safety boundaries

- Protected Help components cannot acquire commercial variants or Public Shell ownership.
- Self-Check and Personal Limit Tracker cannot gain commercial result variants or recommendation formulas.
- Commercial outbound components cannot bypass confirmation and the managed server handoff.
- Programme private/control state, pause/help data and completion state cannot become offer-personalization inputs.
- Client components do not calculate Programme XP, progress, completion or next Mission.

These are architecture/compliance boundaries, not cosmetic exceptions.

## Deprecation

**Detected:** five unreachable pre-system presentation wrappers were removed: `CasinoCards.tsx`, `KnowledgeCenter.tsx`, `PageTemplates.tsx`, `ResponsibleGamblingHub.tsx` and `Section.tsx`. Runtime import-graph checks found no current consumers. `PublicOffers.tsx` and `CasinoReviewSections.tsx` remain because tests use them as active safety fixtures.

**Detected:** `Core/Button` was evolved in place, so no approved Figma reusable pattern or page family was superseded. Historical design artefacts were not deleted or moved. New work must use `Core/Button`/shared Action for eligible internal actions and must use the owning domain component for commercial or protected behavior.

Deprecation requires a proven replacement, consumer migration, import-graph check, regression evidence and documentation. Historical Figma artefacts are marked only when actually superseded; they are not broadly deleted.

## Change process

| Change | Figma | Code | Visual regression | Accessibility | Approval / review |
| --- | --- | --- | --- | --- | --- |
| Token value or semantic-role change | Required | Required | Required on affected representatives | Contrast/focus check | Founder/Product when hierarchy or approved appearance changes; Compliance for safety/legal meaning |
| Shared component variant/state change | Required | Required | Required | Keyboard, semantics, target and motion check | Product/design; Compliance if domain safety is touched |
| New shared component | Required after production evidence | Required | Required | Full component contract | Product/design; architecture review if ownership changes |
| Page-specific design change | Approved page family first | Required | Route regression | Route accessibility check | Founder/Product; separate RFC when substantial |
| Domain safety component change | Domain design update | Domain code only | Domain regression | Safety and keyboard review | Product plus Compliance; cannot be absorbed into Core |
| Deprecation/removal | Mark only genuinely superseded reusable patterns | Migrate and remove proven dead code | Required | Replacement parity check | Owning team; Founder/Product for visible shared patterns |

## Storybook and Code Connect

**Storybook: DEFERRED — no new dependency justified for Design System v1.** The current system has one Core component family, strong route tests and Playwright visual coverage. Adding a parallel runtime would create maintenance surface without equivalent evidence value.

**Code Connect: DEFERRED — unavailable on the current Figma plan.** No Code Connect dependency or mapping is claimed. Node IDs, repository paths and exact variable WEB syntax provide the current traceability contract.

## Ownership and remaining debt

- Product/design owns approved page families and shared visual hierarchy.
- Frontend owns code tokens, component semantics, responsive behavior, tests and Figma back-sync for reusable production changes.
- Domain owners retain Commercial, Protected Help, Programme, Legal/Editorial and Forms/Control behavior.
- Compliance review is required when a visual/component change alters protected help, legal meaning, safety-tool outcomes or commercial routing.

**Deferred P2/P3:** broad route-local CSS remains intentionally distributed; additional shared extraction requires new production evidence. The legacy `next lint` script remains unusable under Next 15. These do not block Design System v1 review.

**Non-frontend/product-gated:** Missions 05–10, jurisdiction authority, legal approval, production data/partner activation, database operations and CI/CD are outside FE-DS-01. Design System v1 does not claim to solve them.
