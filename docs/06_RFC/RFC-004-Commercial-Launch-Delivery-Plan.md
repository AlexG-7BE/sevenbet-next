---
Title: RFC-004 — Flagship Product Delivery Plan
Status: Approved
Classification: Internal
Owner: Founder / Product / Engineering
Date: 2026-08-02
Decision: Build a complete, presentation-ready SevenBet flagship product before seeking operator partnerships; 10 Steps is its acquisition engine and commercial discovery is its primary business layer.
Governing Documents:
  - ../Product-Vision-and-Principles.md
  - ../01_Product_Master_Plan/Product-Master-Plan.md
  - ./RFC-001-Jurisdiction-and-Market-Resolution.md
  - ./RFC-002-Active-Control-Program-and-Dashboard.md
  - ./RFC-003-Program-Led-Commercial-Growth.md
---

# RFC-004 — Flagship Product Delivery Plan

## 1. Flagship outcome

Before seeking operator partnerships, SevenBet SHALL reach a complete, presentation-ready flagship standard in an explicitly approved initial market. **Great Britain (UK) is the approved first launch market.** The site must feel like a mature 2026 product: coherent public discovery, a visually distinctive 10-Step acquisition experience, a credible private Dashboard, rich editorial comparison surfaces, responsive behaviour, polished states and real product logic.

The pre-partnership build is not a throwaway MVP or a static deck. It is a full product demonstration with non-live commercial preview states where live partner, offer and referral data is unavailable. Every later live commercial CTA must be market-governed, attributable and auditable.

## 2. Evidence baseline

**Detected:** the repository is a Next.js/Prisma/Better Auth application with public casino/bonus routes, affiliate records and redirects, a Program builder, authenticated progress APIs, local anonymous progress, server-side Program events, XP and achievements.

**Detected:** the current public Program UI contains a legacy ten-step curriculum and allows anonymous local progress beyond Mission 01, followed by optional merge after sign-in.

**Detected:** `SiteChrome` is global and currently renders commercial links on Responsible Gambling routes.

**Planned:** the new Mission map, mandatory post-Mission-01 account claim, personal plan artefacts, server-side streak, `Best offers`, campaign attribution, private app shell and protected Help layout.

## 2.1 Delivery rule: design the full experience before production implementation

The team SHALL not optimise for the shortest code path. The Figma system is the visual and interaction source of truth for the flagship build. Before a major public or private product surface is implemented, it must have an approved desktop design, responsive/mobile behaviour, content hierarchy, interaction states and a reference-locked visual direction. Implementation then follows the approved system with reusable components and tokens.

The first completed design package covers the entire presentation journey: Home, `/10-steps`, commercial discovery, casino/review/comparison, Mission 01, account claim, all ten mission families, Dashboard, My Plan, protected Help and essential empty/loading/error/legal states. The product is then implemented in coherent component batches, not as isolated placeholder pages.

## 3. Full flagship scope before partner activation

### 3.1 Commercial and market foundation

1. Great Britain (UK) is the initial market. Define its supported languages, currencies, age/disclosure copy and first eligible operators/offers before enabling live referrals or paid acquisition. The product, demo content and non-live commercial surfaces may be built before an operator relationship exists.
2. Deliver RFC-001's minimum market decision before any commercial page or redirect can show a market-specific offer or hand off a referral.
3. Maintain one canonical eligible-offer projection used by `Casinos`, `Bonuses`, `Best offers`, Dashboard and every referral CTA.
4. Provide visible affiliate/sponsorship disclosure and material offer terms before referral activation.

### 3.2 Acquisition, identity and attribution

1. Create `/10-steps` as the campaign landing route and accept permitted UTM/campaign parameters.
2. Record first-touch and last-touch campaign attribution separately from Program answers and safety-sensitive data.
3. Create a short-lived anonymous Program session for Mission 01 only.
4. Require SevenBet email/password account creation to save the Mission 01 result, claim the guest session and enter Mission 02.
5. Make referral attribution durable and auditable without using Program answers, Help use, pause state or personal boundaries for promotion.

### 3.3 Program and reward foundation

1. Replace the legacy public curriculum with the approved ten mission map from RFC-002.
2. Implement three reusable mission interaction templates: **Choose**, **Check** and **Build**.
3. Persist user-owned artifacts: cue, goal, boundary, decision checklist, friction action, support plan and when/then rule.
4. Preserve XP and achievements for defined Program actions only; persist streaks server-side and make all reward writes idempotent.
5. Provide a completed/paused state and a protected Help exit route.

### 3.4 Frontend launch surfaces

1. Public: Home, `/10-steps`, `Casinos`, `Bonuses`, `Best offers`, operator profile/review, comparison, legal/disclosure.
2. Program: guest Mission 01, account creation/claim, Missions 02–10, Program map, Personal Control Dashboard, My Plan.
3. Help: a dedicated protected layout with no commercial navigation or affiliate CTA.
4. Shared chrome: public and authenticated headers include `Casinos`, `Bonuses`, `Best offers`, `10 Steps`; private Program shell adds Dashboard, My Plan and Program navigation.

### 3.5 Measurement and launch operations

1. Implement separate acquisition, commercial, Program and trust/safety event schemas.
2. Build internal reporting for campaign → Program start → account claim → eligible discovery → referral activation.
3. Add content/offer freshness, referral failure and market-policy monitoring.
4. Test 18+, disclosure, consent, deletion/export, referral denial and Help routing before enabling paid traffic.

## 4. Full-product implementation sequence

| Milestone | Backend work | Frontend / Figma work | Done when |
| --- | --- | --- | --- |
| 0. Launch contract | Approve initial market and RFC-001 enforcement boundary; define event taxonomy. | Finalise commercial header, Program landing and protected Help specifications. | No ambiguous market, CTA or ownership decision remains. |
| 1. Public flagship | Canonical non-live offer projection, UK content contract and attribution store. | Home, `/10-steps`, `Casinos`, `Bonuses`, `Best offers`, reviews, comparisons, editorial content and commercial disclosure states. | Public website is visually cohesive, responsive and credible enough for a partner demonstration. |
| 2. Identity handoff | Guest Mission-01 session and signed claim; email/password account flow. | Mission 01, registration/claim, welcome and account states. | Guest completes M1; account saves the result and enters M2. |
| 3. Active Program | New mission content; artifact persistence; server streak; reward catalogue/API. | All ten mission sequences, map, XP/achievement/streak states, motion and feedback. | A user can finish all ten missions with saved, useful results. |
| 4. Return surface | Dashboard/My Plan read models; privacy/export/delete contracts. | Dashboard, My Plan, completed, paused and protected Help states. | Returning user can edit their plan and independently enter discovery. |
| 5. Quality and activation readiness | Analytics, monitoring, rate/error handling, tests and migration checks. | Mobile product, loading/empty/error/legal states, visual QA and prototype walkthrough. | The complete product withstands a partner, investor and user walkthrough; live offers/referrals can be activated only after partner approval. |

## 5. Required code areas

| Area | Current evidence | Planned change |
| --- | --- | --- |
| `prisma/schema.prisma` | Program enrollment/events, user XP and achievements exist. | Add/approve attribution, anonymous session, plan artifact/revision, reward catalogue and server streak models. |
| `lib/services/user-progress.service.ts` and `app/api/program/progress/*` | Authenticated progress actions and merge exist. | Add guest-M1/claim flow, artifact commands, reward/streak APIs and target mission rules. |
| `lib/program.ts`, Program Builder and published snapshots | Legacy ten-step content exists. | Replace with RFC-002 mission content and structured interaction metadata. |
| `components/ProgramExperience.tsx` | Legacy anonymous-first Program UI with local streak/XP. | Split into landing, guest M1, authenticated mission shell, Dashboard and My Plan. |
| `components/SiteChrome.tsx`, `app/layout.tsx` | One global header/footer. | Introduce public, private and Protected Help route layouts. |
| public discovery / affiliate routing | Casino/bonus and affiliate foundations exist. | Add canonical `Best offers` projection and enforce RFC-001 at every commercial handoff. |

## 6. Deferred until partner activation

- Live affiliate tracking links, partner-supplied offers and paid acquisition until agreements and UK compliance review are complete.
- Multiple markets before the UK experience is approved.
- Cash, bonus, operator or referral rewards for XP/achievements/streaks.
- Personalised commercial targeting from Program, pause, Help or safety-sensitive data.
- Native apps, social/community mechanics, leaderboards and complex notification automation.

## 7. Continuation after launch

### Phase 2 — Growth scale

- additional approved markets, languages and regulated offer inventories;
- SEO content clusters around all ten mission themes and commercial queries;
- campaign landing-page variants, creative testing and aggregated attribution reporting;
- richer comparison, saved offers and offer-change alerts.

### Phase 3 — Product depth

- richer My Plan editing and revision history;
- evidence library with source/review-date cards;
- optional user-controlled reminders and review cadence;
- more mission scenarios and program versions through CMS.

### Phase 4 — Commercial operations

- partner feed/import automation;
- offer freshness/SLA workflows;
- market-level commercial dashboards and controlled ranking experiments;
- audited lifecycle messaging based on consented, non-sensitive product states.

## 8. Flagship readiness criteria

The product is ready for operator, investor and launch-partner presentation only when all statements are true:

1. A paid/social/SEO visitor reaches `/10-steps` with attributable campaign context.
2. The visitor can complete Mission 01 without an account and is required to create an account before Mission 02.
3. The account retains the M1 artifact and Program progress across a new session.
4. All ten missions produce the intended saved result, XP and any configured achievement exactly once.
5. Dashboard and My Plan show the saved artifacts and a truthful Program state.
6. `Casinos`, `Bonuses` and `Best offers` show only policy-eligible content for the initial market and every commercial CTA is disclosed and auditable.
7. Protected Help never renders commercial navigation or affiliate CTA.
8. A user can reach privacy, export and deletion controls for persisted Program data.
9. Automated tests cover guest claim, reward idempotency, denied-market referral, disclosed eligible referral and Protected Help layout.
