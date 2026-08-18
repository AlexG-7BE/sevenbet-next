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

### Founder correction — Mission01 acquisition sequence

The corrective Founder decision received on 2026-08-16 fixes the Mission01 acquisition sequence as:

`Programme start → voice-first situation input → text fallback → submit → AI Starting Point ready → Google account CTA → authenticated claim/redeem → Programme Dashboard`.

The acquisition presentation must not insert a required clarification page, multi-field candidate editor, or separate reward page before registration. A provider clarification result must degrade to a bounded best-effort Starting Point derived only from the submitted situation; it must not manufacture personal facts. The ready screen shows the generated value immediately and the Google CTA is the explicit save/claim transition. Email remains an accessible secondary identity path.

This correction changes presentation and orchestration only. The two existing Mission01 server actions remain the only reward events (20 XP each), registration remains worth 0 XP, claim/redeem remains idempotent and server-authoritative, sensitive-input authority remains required, support-first intervention remains allowed, and Missions 02–10 retain their approved titles, ordering, prerequisites, rewards and behaviour.

### Founder correction — parity integrity

The corrective Founder decision received on 2026-08-17 rejects any visual-acceptance method in which `visualFixture=true` selects `HandoffPage`, generated handoff HTML or another presentation renderer while ordinary Preview uses the application UI. Visual fixtures may replace deterministic DTO/service values only. Local QA, Vercel Preview and eventual Production must use the same component, DOM, CSS and interaction tree.

Accordingly, every dynamic product route renders its actual runtime component regardless of fixture state. The parity harness compares the original supplied `.dc.html` reference against the normal React route, fails when `[data-handoff-page]` is present on a dynamic surface, requires an explicit real-runtime marker and records `renderer: REAL_RUNTIME`. Programme comparison uses equivalent reference frames for intake, Starting Point ready/registration and dashboard rather than an unrelated whole-board comparison. The original generated handoff renderer remains permissible only as the actual renderer of genuinely static public pages and as the reference-capture source.

This correction changes no data authority. Current services and DTOs remain authoritative on Preview; the local-only data fixture is denied in every Vercel environment. The correction authorises removal of obsolete alternate-renderer evidence and requires replacement evidence to use the `runtime-implementation` label.

### Founder correction — canonical Programme entry and shared outer grid

The corrective Founder decision received on 2026-08-17 makes `ProgramAiExperience` and its final `ProgramAiFinalPresentation` the only public renderer for `/program`, including `/program?entry=start` and entry from Home or 10 Steps. `PROGRAM_AI_V1_ENABLED` may continue to protect backend and provider capability, but it must not select a public UI version. If the backend or a provider capability is unavailable, the canonical Programme presentation must remain mounted and show a truthful unavailable or text-fallback state. `ActiveControlProgramme` remains legacy implementation code only and has no public route reachability.

The later unified-shell Founder correction replaces the provisional `1312px` inference and establishes the measured Home/Learn outer-frame contract:

- `--public-outer-gutter: clamp(24px, 5vw, 72px)`;
- `--public-content-max: 1440px`;
- `--public-wide-max: 1440px`;
- `--public-reading-max: 760px`; and
- compatibility `--site-*` aliases resolved from those measured public tokens.

Standard page and section frames, including Programme entry and dashboard, align to that outer grid. Reading, focused, full-bleed, wide/photographic and overlay surfaces may keep narrower or wider inner measures where their classification requires it; a 400–520px Programme interaction column is therefore an inner focused measure, not a competing page shell. Site navigation and footers use the same standard anchors. This correction changes no Mission ordering, prerequisite, reward, progression, persistence, authentication, privacy, provider or commercial-data rule.

### Founder correction — one production public chrome

The corrective Founder decision received on 2026-08-17 revokes the earlier width-only acceptance because matching selected wrapper values did not prove a common visual product shell. Original `Home.dc.html` and `Learn.dc.html` measurements are the primary global-chrome reference: their outer gutter is `clamp(24px, 5vw, 72px)`, their content/footer inner cap is `1440px`, and the fixed navigation is 81px high. At the required widths, the canonical left/right axes are `72 / 1368`, `51.2 / 972.8`, `24 / 406` and `24 / 366`.

Normal public routes and `/program` must mount the same production `PublicHeader` and `PublicFooter`. Generated handoff HTML remains an approved static/editorial content source but its captured header and footer elements must be removed before rendering; hiding duplicate chrome with CSS or z-index is not compliant. `HandoffInteractions` may preserve read progress and Home motion but must not own or query a prototype `[data-nav]`. Protected Help retains its separate non-commercial shell. Programme may retain contextual progress/account controls inside its content, but not a second B4GAMBLE wordmark or public navigation system.

### Founder correction — Casino Review, chameleon header and verified motion

The corrective Founder decision received on 2026-08-17 authorises a bounded interaction pass in three ordered parts: full-page `/casino/[slug]` presentation polish, one shared chameleon `PublicHeader`, and restoration of verified handoff-derived motion. `Casino Review.dc.html` is the Casino Review visual authority while `CasinoProfile`, `PublicCasinoDTO`, editorial/evidence data, jurisdiction, availability and governed outbound routing remain the runtime authority. No `HandoffPage`, iframe, screenshot renderer or static commercial duplicate is permitted for the dynamic review.

Header theme changes must be owned by one shared controller and explicit `data-nav-theme` section markers. The controller may respond to scroll, navigation, resize, content resize and streamed/dynamic layout changes, but it must not infer theme from arbitrary text or duplicate observers per route. Header geometry remains fixed; only background, backdrop, border and foreground treatment may transition.

Motion is limited to behaviours verified in the supplied handoff and recorded in `docs/product/FINAL-DESIGN-MOTION-CONTRACT.md`. Server-rendered content is visible by default; JavaScript may mark only eligible off-screen content pending after a capable observer is available. Reduced motion, observer failure and JavaScript absence must leave content readable. This correction does not authorise another public-width rewrite, Programme architecture change, fabricated commercial fact, Production change, merge or release-readiness transition.

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
| Mission01 has no required clarification/editor/reward screens | Founder fixed the acquisition sequence after rejecting the first PR pass | Corrective Founder decision, 2026-08-16 |
| Visual fixtures are data-only | A metric is invalid when reference markup replaces the actual application UI | Corrective Founder decision, 2026-08-17 |
| `/program` has one canonical public renderer | Backend capability flags must fail closed inside the approved experience, not expose a legacy product | Corrective Founder decision, 2026-08-17 |
| Standard outer frames use the shared site tokens | Programme and public pages need one measurable grid while preserving intentional inner reading and focused measures | Corrective Founder decision, 2026-08-17 |
| One React public chrome owns all normal public routes | Width parity was false-positive while Home/Learn mounted prototype chrome and runtime routes mounted Public Shell | Unified-shell corrective Founder decision, 2026-08-17 |
| Casino Review presentation may be recomposed without duplicating its backend | The handoff is the visual authority but real DTO, evidence, jurisdiction, availability and outbound governance remain authoritative | Casino Review corrective Founder decision, 2026-08-17 |
| Header themes are explicit and controlled once | Theme must follow the physical section under the fixed header in both scroll directions and after layout changes without route-specific observers | Chameleon-header corrective Founder decision, 2026-08-17 |
| Motion must be source-locked and fail visible | The handoff supplies the timings and behaviours; visible-by-default SSR, reduced motion and observer failure prevent decorative motion from hiding information | `docs/product/FINAL-DESIGN-MOTION-CONTRACT.md`; corrective Founder decision, 2026-08-17 |
| Expressive display type and functional type use separate contracts | The handoff's route-specific display composition must remain intact while labels, controls, material terms, decision values and body copy meet explicit readable floors | Corrective Founder decision, 2026-08-17; `docs/product/FINAL-DESIGN-TYPOGRAPHY-CONTRACT.md` |
| Sub-12px type requires an exact decorative classification | Tiny functional copy cannot be accepted as visual fidelity; the static audit fails new or stale exceptions and the browser audit verifies computed runtime type at all Founder viewports | Typography contract and Founder typography QA evidence |
