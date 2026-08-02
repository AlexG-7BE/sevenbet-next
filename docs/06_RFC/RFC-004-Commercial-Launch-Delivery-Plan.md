---
Title: RFC-004 — Commercial Launch Delivery Plan
Status: Approved
Classification: Internal
Owner: Founder / Product / Engineering
Date: 2026-08-02
Decision: The minimum launch scope and phased delivery plan for a working commercial SevenBet product with 10 Steps as its acquisition engine are approved.
Governing Documents:
  - ../Product-Vision-and-Principles.md
  - ../01_Product_Master_Plan/Product-Master-Plan.md
  - ./RFC-001-Jurisdiction-and-Market-Resolution.md
  - ./RFC-002-Active-Control-Program-and-Dashboard.md
  - ./RFC-003-Program-Led-Commercial-Growth.md
---

# RFC-004 — Commercial Launch Delivery Plan

## 1. Launch outcome

SevenBet launches as a working commercial casino-affiliate product in an explicitly approved initial market. Paid, social, SEO and direct traffic can enter through the 10-Step landing page or through commercial discovery; an adult user can create an account after Mission 01, build a saved plan, earn Program-only XP/achievements/streaks, explore market-eligible `Casinos`, `Bonuses` and `Best offers`, and activate an eligible, disclosed affiliate referral.

This is a working vertical slice, not a design demo. Every live commercial CTA must be market-governed, attributable and auditable.

## 2. Evidence baseline

**Detected:** the repository is a Next.js/Prisma/Better Auth application with public casino/bonus routes, affiliate records and redirects, a Program builder, authenticated progress APIs, local anonymous progress, server-side Program events, XP and achievements.

**Detected:** the current public Program UI contains a legacy ten-step curriculum and allows anonymous local progress beyond Mission 01, followed by optional merge after sign-in.

**Detected:** `SiteChrome` is global and currently renders commercial links on Responsible Gambling routes.

**Planned:** the new Mission map, mandatory post-Mission-01 account claim, personal plan artefacts, server-side streak, `Best offers`, campaign attribution, private app shell and protected Help layout.

## 3. Minimum launch scope

### 3.1 Commercial and market foundation

1. Approve one initial market, supported languages, currencies, age/disclosure copy and the first eligible operators/offers.
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

## 4. Minimum implementation sequence

| Milestone | Backend work | Frontend / Figma work | Done when |
| --- | --- | --- | --- |
| 0. Launch contract | Approve initial market and RFC-001 enforcement boundary; define event taxonomy. | Finalise commercial header, Program landing and protected Help specifications. | No ambiguous market, CTA or ownership decision remains. |
| 1. Commercial core | Canonical eligible-offer projection; governed referral gateway; attribution store. | `Casinos`, `Bonuses`, `Best offers`, disclosure states and campaign landing. | An eligible visitor can view terms and activate one auditable referral. |
| 2. Identity handoff | Guest Mission-01 session and signed claim; email/password account flow. | Mission 01 and registration/claim screens. | Guest completes M1; account saves the result and enters M2. |
| 3. Active Program | New mission content; artifact persistence; server streak; reward catalogue/API. | Mission templates, map, XP/achievement states. | A user can finish all 10 missions with truthful saved results. |
| 4. Return surface | Dashboard/My Plan read models; privacy/export/delete contracts. | Dashboard, My Plan, completed and paused states. | Returning user can edit their plan and voluntarily enter discovery. |
| 5. Launch hardening | Analytics, monitoring, rate/error handling, tests and migration checks. | Responsive QA, accessibility, empty/error/legal states. | End-to-end launch checklist passes in the initial market. |

## 5. Required code areas

| Area | Current evidence | Planned change |
| --- | --- | --- |
| `prisma/schema.prisma` | Program enrollment/events, user XP and achievements exist. | Add/approve attribution, anonymous session, plan artifact/revision, reward catalogue and server streak models. |
| `lib/services/user-progress.service.ts` and `app/api/program/progress/*` | Authenticated progress actions and merge exist. | Add guest-M1/claim flow, artifact commands, reward/streak APIs and target mission rules. |
| `lib/program.ts`, Program Builder and published snapshots | Legacy ten-step content exists. | Replace with RFC-002 mission content and structured interaction metadata. |
| `components/ProgramExperience.tsx` | Legacy anonymous-first Program UI with local streak/XP. | Split into landing, guest M1, authenticated mission shell, Dashboard and My Plan. |
| `components/SiteChrome.tsx`, `app/layout.tsx` | One global header/footer. | Introduce public, private and Protected Help route layouts. |
| public discovery / affiliate routing | Casino/bonus and affiliate foundations exist. | Add canonical `Best offers` projection and enforce RFC-001 at every commercial handoff. |

## 6. Explicitly out of scope for minimum launch

- Multiple markets before the initial-market flow is proven.
- Cash, bonus, operator or referral rewards for XP/achievements/streaks.
- Personalised commercial targeting from Program, pause, Help or safety-sensitive data.
- Native apps, social/community mechanics, leaderboards and complex notification automation.
- A complete CMS redesign; the existing Program/admin foundations are extended only where the launch contract requires it.

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

## 8. Launch acceptance criteria

The product is launch-ready only when all statements are true:

1. A paid/social/SEO visitor reaches `/10-steps` with attributable campaign context.
2. The visitor can complete Mission 01 without an account and is required to create an account before Mission 02.
3. The account retains the M1 artifact and Program progress across a new session.
4. All ten missions produce the intended saved result, XP and any configured achievement exactly once.
5. Dashboard and My Plan show the saved artifacts and a truthful Program state.
6. `Casinos`, `Bonuses` and `Best offers` show only policy-eligible content for the initial market and every commercial CTA is disclosed and auditable.
7. Protected Help never renders commercial navigation or affiliate CTA.
8. A user can reach privacy, export and deletion controls for persisted Program data.
9. Automated tests cover guest claim, reward idempotency, denied-market referral, disclosed eligible referral and Protected Help layout.
