# RFC-034: CPO Commercial Decision Layer Preview V2

- **Status:** Approved for bounded Preview implementation
- **Decision authority:** Founder Office CPO commercial-decision-layer execution brief
- **Approved:** 2026-08-14
- **Scope:** one isolated CPO conversion-architecture branch and Vercel Preview; public recommendation hierarchy, Preview-safe outbound simulation, Programme discovery handoff, Learn intent routing and privacy-safe commercial-funnel analytics
- **Base:** `0c956d0d99c9ac703234e82a0bca3c1d5b3a9167`
- **Branch:** `codex/cpo-commercial-decision-layer-preview-02`
- **Depends on:** Product Vision & Principles v2.0, RFC-007, RFC-012, RFC-014, RFC-015, RFC-016, RFC-025, RFC-026, RFC-033, Programme Architecture Standards, Backend Programme Standards and Programme Definition of Done
- **Supersedes:** RFC-025 sections 12–13 only for the Preview UI's generic Programme discovery rail and Mission 08/10 post-completion destinations; RFC-026 section 4 only for the additive Preview commercial-event taxonomy. No Mission, reward, progression, private-data, Help, jurisdiction or affiliate-redirect authority is superseded.

## 1. Decision and ceiling

B4GAMBLE will build one reviewable Preview variant that makes the public commercial journey recommendation-first and keeps evidence on demand:

```text
intent
→ B4GAMBLE picks
→ decide
→ Preview-safe outbound intent

optional evidence
→ full review
→ compare
→ all casinos
```

The Preview demonstrates composition, hierarchy and interaction only. It does not activate a commercial relationship, affiliate route, operator approval, jurisdiction eligibility, real offer, external destination or Production configuration.

The work may change source, tests and documentation; create commits; push only the focused branch; open one Draft PR; and use the existing Vercel branch Preview workflow. It may not merge, deploy with `--prod`, change DNS or environment values, mutate Production data, create a migration, weaken authentication/security, send external affiliate traffic or change `/r/[slug]` validation.

## 2. Product boundary

The 10-Step Control Programme remains the main acquisition proposition and Home remains Programme-first. Commercial conversion may come only from clarity, visible material facts and limitations, reduced choice and low interaction friction.

The Preview must preserve:

- `Know your limits before you play.`;
- editorial independence and affiliate disclosure;
- licence, terms, uncertainty and material limitations before action;
- the distinct `/responsible-gambling` education/control hub;
- protected `/help` and its action routes;
- non-commercial Self-Check, Personal Limit Tracker, support and pause states; and
- the fail-closed commercial/jurisdiction/redirect architecture.

Programme answers, local wording, Starting Point, Mission artefacts, Self-Check answers, limits, Help activity and support selections remain prohibited ranking, offer, CTA and affiliate inputs. Commercial clicks award zero XP and cannot change completion, badges, streaks, Reviews or Programme progression.

## 3. Preview authority and fail-closed guard

The CPO experience is enabled only when either:

1. Vercel reports `VERCEL_ENV=preview` and exact `VERCEL_GIT_COMMIT_REF=codex/cpo-commercial-decision-layer-preview-02`; or
2. a local/test process explicitly sets `CPO_COMMERCIAL_PREVIEW=true` while `VERCEL_ENV` is not `production`.

`VERCEL_ENV=production` always denies the preview, even if another flag is present. Preview-only routes call `notFound()` when the guard denies. They are `noindex, nofollow`, absent from public navigation, sitemap and machine-readable discovery.

The public Preview shell carries an unmistakable banner that simulated actions never leave B4GAMBLE and imply no partner or commercial availability.

## 4. Public information architecture

Primary navigation becomes:

```text
10 Steps
Best Casinos
Bonuses
Learn
Help
```

Account actions remain unchanged. Help retains its distinct safety treatment. The footer keeps `Discover`, `Programme`, `Trust`, and `Control & Support`; Discover orders `Best Casinos`, `Bonuses`, `All Casinos`, and `Compare`, with Best Offers secondary compatibility only.

`/best-casinos` is the primary public decision surface. It renders at most three primary recommendations from existing public offer/casino services and deterministic ranking. No operator, licence, offer, eligibility or commercial fact may be invented. Each recommendation shows rank, identity, supported editorial position, Editor Score, two to four material facts, an offer when present, at most two selection reasons, one visible limitation and action priority:

1. Visit Casino — Preview-safe internal simulation;
2. Read full review;
3. Compare.

Methodology and All Casinos follow the shortlist rather than competing with it.

`/casinos` remains the SEO-compatible utility directory and keeps server-owned search, filters, pagination, fail-closed disclosure and Methodology access. It is publicly named `All Casinos`; the recommendation bridge appears before tools. Duplicated long education, anatomy, score and cross-navigation blocks leave the primary route.

`/bonuses` owns `Top Offers` before `Browse All Offers`. The top three use the existing offer ordering and material fields. The primary action is visible on mobile whenever a governed action or explicit Preview simulation exists. The filter/directory utility remains below. `/best-offers` remains a non-destructive temporary compatibility redirect to `/bonuses#top-offers`; a future Production redirect/canonical decision requires SEO/CMO review.

`/compare` remains accessible but secondary. A shortlist recommendation may preselect that record without claiming a winner or hiding missing evidence.

The existing casino review remains the BOFU evidence surface. Its early order remains identity, score, verdict, offer and limitation, with Preview-safe Visit primary and Compare secondary where shown. Negative findings stay visible.

## 5. Preview-safe outbound simulation

`/preview/outbound/[slug]` is an internal terminal. A normal Preview action requires one click and never opens the current extra confirmation dialog. The terminal displays:

- `PREVIEW ONLY`;
- no external operator visit occurred;
- no partner or commercial status is implied;
- the validated source route;
- operator name/slug where existing public data resolves it;
- recommendation position and placement; and
- a return link.

Source route, position and placement accept only closed safe values. Operator identity comes from existing server data; unresolvable data stays unknown. No raw destination, `/r` resolution result or affiliate URL is exposed. `/r/[slug]` and `/outbound/unavailable` remain unchanged.

Proposed Production behaviour is documented, not implemented:

```text
source CTA
→ /r/[slug]
→ server feature, preference, jurisdiction and affiliate checks
→ external operator or fail-closed recovery
```

That Production change requires later CLO and CTO/CISO approval.

## 6. Programme handoff

The authenticated Programme Home removes the persistent `Explore B4GAMBLE` rail. No replacement commercial block appears in the private dashboard.

The separate, post-completion Mission 08 handoff becomes:

- eyebrow `PUT YOUR CHECKLIST TO USE`;
- one primary `See B4GAMBLE Picks` link to `/best-casinos`;
- one optional secondary Bonus Guide link; and
- explicit copy that public ranking is the same for everyone and Programme answers do not influence it.

Mission 10 becomes:

- heading `Explore when you choose to.`;
- one primary `See B4GAMBLE Picks` link; and
- one secondary Methodology link.

These links remain separate from reward feedback, optional, zero-XP, non-personalised and irrelevant to completion. No Programme API, persistence, ownership, reward amount, Mission ordering, prerequisite, action or artefact changes. Migration impact is `none`.

## 7. Learn and trust surfaces

The Learn first view groups current content into five readable subjects: choosing a casino; understanding offers; payments/licensing/safety; control and responsible gambling; and reference/other learning. Sports Betting Basics, Country Guides and Industry News remain routed but are marked `Not yet / content depth required` and do not receive dominant discovery weight.

Article end routes are determined only by public article subject:

- casino-choice subjects → `/best-casinos`;
- bonus subjects → `/bonuses#top-offers`;
- responsible gambling → Responsible Gambling and protected Help only;
- reference/non-commercial subjects → a neutral relevant next step.

The generic Learn → Compare bridge is removed. `SOURCE STATUS: UNAVAILABLE` remains truthful and accessible; source-unavailable generic articles are not presented as critical conversion proof. The source-backed Bonus Guide ends with `See Top Offers`, then `Browse all offers`.

About explains `Learn → Control → Choose → Verify when needed` and public recommendation-first/evidence-on-demand behaviour without describing an affiliate funnel. Methodology, disclosure and FAQ remain trust documents rather than sales pages.

## 8. Analytics

The existing Vercel ProductAnalytics architecture remains the only provider. RFC-026 privacy, non-authority, failure-isolation, two-property ceiling and absolute sensitive-data denylist remain in force.

Six additive events are authorised:

| Event | Exact properties |
| --- | --- |
| `commercial_decision_layer_viewed` | `sourceRoute`, `placement` |
| `commercial_recommendation_clicked` | `sourceRoute`, `recommendationRank` |
| `commercial_review_opened` | `sourceRoute`, `operatorSlug` |
| `commercial_compare_opened` | `sourceRoute`, `operatorSlug` |
| `commercial_outbound_intent` | `sourceRoute`, `operatorSlug` |
| `commercial_all_results_opened` | `sourceRoute`, `destinationRoute` |

Route/destination values are closed; rank is a bounded small integer; operator slug uses the existing safe public-slug grammar and length ceiling. Events contain no user, session, Programme, Self-Check, limit, Help, support, monetary or sensitive value. This Preview stops at outbound intent and does not invent registration, deposit, FTD or provider events.

`programme_discovery_clicked.destinationRoute` adds `best_casinos`; Mission 08/10 use that value. The removed Programme Home rail emits no commercial event.

## 9. Design reference lock

### 9.1 Founder Golden visual amendment — 2026-08-14

The Founder accepts this RFC's product/business architecture and rejects the first `/best-casinos` visual implementation as the target design. The bounded Phase 1 visual authority is now recorded in [`docs/product/CPO-COMMERCIAL-GOLDEN-BEST-CASINOS-V1.md`](../product/CPO-COMMERCIAL-GOLDEN-BEST-CASINOS-V1.md).

That Golden record supersedes this section's original presentation target for `/best-casinos` only. It does not supersede the existing B4GAMBLE token roles, Top 3 limit, recommendation order, fact/limitation requirements, CTA hierarchy, Preview boundary, analytics contract, private/safety separation or any other product rule in this RFC. Meaningful existing B4GAMBLE and governed fixture media is now required for the Golden page when its use is truthful. No Phase 2 propagation is authorised before Founder visual approval.

#### 9.1.1 Founder A/B comparison amendment — 2026-08-14

The Founder accepted the Golden implementation as **Variant A** for continued comparison and requested one bounded **Variant B** visual experiment named **B4GAMBLE Editorial Decision Theatre — Roulette Palette Variant**. Variant A remains available at `/best-casinos`; Variant B may be added at `/best-casinos-roulette`; and one noindex Preview comparison hub may be added at `/preview/cpo-commercial-v3`.

Variant B may change only page-scoped presentation and the minimum non-semantic public-shell hooks needed to style that route. Its permitted direction is deep roulette-table green, near-black green, warm paper/ivory and a restrained dark burgundy accent. Recommendation stages, key facts, header typography and footer typography become more legible; recommendation stages must dominate the surrounding atmosphere; and the existing full-width Help emphasis must become a compact support module. Acid may be reduced or omitted inside Variant B, but the change must not alter global B4GAMBLE token meanings or unrelated routes.

Variant B must preserve the same server-owned records, Top 3 order, visible limitation, action order, internal Preview terminal, research routes, analytics metadata, demo-fixture truth and protected-data separation as Variant A. It may not change global navigation information architecture, footer links, the Production public shell, ranking, routing, database, API, authentication, Programme, Help behaviour or any Phase 2 surface. Founder comparison is a visual gate only and provides no merge, Production or rollout authority.

#### 9.1.2 Founder Round 2 final-refinement amendment — 2026-08-14

The Founder selected Variant B as the preferred foundation for the final A/B decision and authorised one focused refinement of `/best-casinos-roulette`. Variant A remains an unchanged control at `/best-casinos`; this amendment authorises no third direction, Phase 2 propagation, merge or Production rollout.

The refined Variant B must retain its deep-forest, near-black green, warm ivory, muted burgundy and quiet evidence-teal identity while increasing local luminance, typography contrast, light-surface presence, media exposure and chapter separation toward Variant A's visual energy. A page-level brightness filter, acid-led recolour, neon treatment or additional accent system is not authorised.

The public shell combination is explicit: Variant B header and footer sizing, spacing, typography and compact Help architecture remain, while their colour treatment returns to the established Variant A public-shell tokens. On Variant B only, the visual positions of Privacy and Terms move to the footer baseline previously occupied by About and Contact, and About and Contact move into the Trust group positions previously occupied by Privacy and Terms. The actual `/privacy`, `/terms`, `/about` and `/contact` destinations remain unchanged; Variant A and unrelated routes retain their existing footer presentation and order.

Recommendation media is no longer an abstract placeholder. A matching demo fixture may compose only its manifest-governed local logo, hero and product-screen assets into an operator identity stage. Published records may use only repository-authorised media explicitly linked to that operator and otherwise retain a truthful fallback. Media must remain subordinate to identity, rank, score, offer, key facts, limitation and action. The transition after the dark-green “The shortlist is a decision” chapter must move into an unmistakably light paper/ivory research chapter so adjacent major chapters do not repeat the same green treatment.

The Founder comparison hub must label the final control as **Variant A — Acid editorial direction** and the candidate as **Variant B — Refined — Casino-inspired deep palette + brighter execution**. Founder final A/B selection remains required before any merge or rollout decision.

### 9.2 Original Preview reference lock

Build target: merged B4GAMBLE Design System v1, current public shell and the RFC-025/RFC-033 paper/night product theatre.

| Decision | Source | Rule | Reason |
| --- | --- | --- | --- |
| Paper canvas, night sections, Archivo hierarchy | Existing B4GAMBLE / RFC-025 | Preserve current tokens and density | The Preview must compare architecture, not introduce a rebrand. |
| Acid primary action | Existing B4GAMBLE + Ghost reference | Acid is primary-action/progress only | Makes the next step obvious without spreading promotional colour. |
| Teal trust/safety semantics | Existing B4GAMBLE | Keep role unchanged | Safety and evidence retain their established meaning. |
| Flat material fact ledger | N26 reference | Thin rules, compact labels, no heavy shadow | Essential evidence stays comparable and calm. |
| Top-three recommendation result | Microsoft recommender flow | One highlighted recommendation, visible facts and actions | Reduces choice without hiding alternatives. |
| Compare after shortlist interest | IKEA comparison flow | Compare is selected verification, not the entry route | Prevents the research tool becoming default friction. |

Reject generic affiliate imagery, fake popularity, urgency, equal CTA rows, gradients, new palette/type, excessive rounded cards, decorative serif word swaps and commercial content in safety/reward contexts. No new image asset is required; existing identity/media and code-native fact layouts carry the experience.

## 10. Verification and release boundary

Required evidence includes:

- structural/contract tests for navigation, Preview guard, three recommendations, CTA hierarchy, one-click internal terminal and unchanged `/r` source;
- Programme Home and Mission 08/10 regression coverage with zero reward/progression coupling;
- All Casinos, Bonuses, Compare, Learn intent, protected-route and analytics contract tests;
- mobile primary actions at 390 and 430 pixels;
- relevant/full Playwright, lint, typecheck, Prisma validation, tests and production build;
- rendered visual QA at 1440, 430 and 390 pixels; and
- one Ready Vercel Preview and one open Draft PR.

No release claim may exceed evidence. The branch must remain unmerged. This Preview is not Founder-approved for Production and makes no Production change.
