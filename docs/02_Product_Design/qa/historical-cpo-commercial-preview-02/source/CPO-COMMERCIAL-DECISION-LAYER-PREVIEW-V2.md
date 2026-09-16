# CPO Commercial Decision Layer Preview V2

> **PROPOSED PREVIEW**<br>
> **NOT FOUNDER-APPROVED FOR PRODUCTION**<br>
> **NO PRODUCTION DEPLOYMENT**

## Baseline

- **Actual main SHA:** `0c956d0d99c9ac703234e82a0bca3c1d5b3a9167`
- **Branch:** `codex/cpo-commercial-decision-layer-preview-02`
- **Production before:** <https://b4gamble.com>
- **Preview SHA:** rendered from `VERCEL_GIT_COMMIT_SHA` in the review hub
- **Verified implementation deployment:** `c639475825397f7ca5816fd1b9151ff06c7429b1`
- **Preview:** <https://sevenbet-next-git-codex-cpo-commerci-d4239a-alexg-7bes-projects.vercel.app>
- **Draft PR:** <https://github.com/AlexG-7BE/sevenbet-next/pull/75>

## Current / before architecture

```text
Primary navigation
→ Casinos | Bonuses | Best offers

Programme Home
→ persistent multi-link commercial rail

Mission 08 / 10
→ Casinos | Compare | Bonuses | Best offers | Bonus guide

Commercial research
→ directory | filters | comparison | review | confirmation | outbound

Generic Learn article
→ Compare
```

The before state preserves evidence and safety, but exposes several equal commercial doors and often makes research tooling the user's first decision.

## Proposed / after architecture

```text
10 Steps / public commercial intent
→ Best Casinos (Top 3)
→ Visit simulation

Optional evidence
→ Review
→ Compare
→ All Casinos

Learn / Bonus Guide
→ Best Casinos or Top Offers
→ Visit simulation
```

The Preview principle is `Recommendation first. Evidence on demand.` A shortlist does not remove evidence, limitations, methodology, directory tools or protected routes; it moves them behind the decision they support.

## Keep

- 10 Steps as the main acquisition proposition
- Responsible Gambling education/control hub
- protected Help and action routes
- Self-Check
- Personal Limit Tracker
- Methodology
- Affiliate Disclosure
- full casino evidence and material limitations
- server-side commercial, jurisdiction and redirect safety

## Add

- Best Casinos Top 3 decision layer
- Top Offers-first bonus hierarchy
- subject-based Learn handoffs
- privacy-safe commercial-funnel analytics
- Preview-only review hub and internal outbound terminal

## Demote

- All Casinos to a secondary research directory
- Compare to a shortlist verification tool
- Best Offers to a compatibility surface
- deep filters and evidence branches until requested

## Remove from the primary journey

- Programme Home `Explore B4GAMBLE` block
- Mission 08/10 five-way commercial choice
- mandatory second outbound confirmation in Preview
- generic Learn → Compare transition
- large duplicated education/methodology blocks on All Casinos

## Not yet

- future/thin Learn categories as prominent product areas
- new Compare features
- more directory filters
- real operator, partner, licence, offer or jurisdiction authority
- Production one-click outbound behaviour

## Protected

Programme answers, Starting Point, private wording, Mission choices, Self-Check answers, limits, Help activity, support selections, pause states and vulnerable-state messaging remain outside ranking, offer selection, CTA visibility, affiliate destinations and commercial analytics.

No commercial click, registration, deposit or affiliate action awards XP or changes Mission completion, achievements, streaks, Reviews or Programme progression.

## Proposed Production behaviour — not implemented

```text
source CTA
→ /r/[slug]
→ feature availability
→ preference validation
→ jurisdiction resolution
→ affiliate redirect service
→ external operator or fail-closed recovery
```

Removing the Production confirmation step requires later CLO and CTO/CISO approval. The Preview instead ends on an internal terminal and never sends operator traffic.

## Content evidence debt

Generic Learning articles currently expose `SOURCE STATUS: UNAVAILABLE` because claim-level sources, owners, review-due dates and compliance-review status are absent. The Preview keeps that disclosure and demotes those pages as conversion proof. It does not invent sources or verification.

## Programme impact

- Mission order, prerequisites, actions and artefacts: unchanged
- XP and achievements: unchanged
- private data and ownership: unchanged
- API and persistence: unchanged
- migration impact: none
- Mission 08/10 public handoff: simplified, optional and zero-XP
- Programme Home commercial rail: removed

## QA and evidence

Implementation-head evidence recorded on 2026-08-14:

| Command | Result |
| --- | --- |
| `npm run lint` | PASS · zero warnings |
| `npm run typecheck` | PASS |
| `npx prisma validate` | PASS · schema valid |
| `npm run cpo-preview:test` | PASS · 23/23 |
| `npm run cpo-preview:browser` | PASS · 4/4 |
| `npm run public-ia:test` | PASS · 32/32 |
| `npm run programme:test` | PASS · 118/118 |
| `npm run program-ai:browser` | PASS · 11/11, including database-backed Missions 02–10 and exact 715 XP |
| `npm run public-offer:test` | PASS · 19/19 |
| `npm run public-casino:test` | PASS · 10/10 |
| `npm run fe-mig-07:test` | PASS · 26/26 |
| `npm run fe-mig-15:test` | PASS · 7/7 |
| `npm run ci:structural` | PASS · 211 core + 6 FE-GAP |
| `CPO_COMMERCIAL_PREVIEW=true npm run build` | PASS |
| `git diff --check` | PASS |

Playwright captured and the implementation review inspected full-page evidence at 1440, 430 and 390 pixels for Best Casinos, 390 pixels for Top Offers, and 1440 pixels for the review hub. There was no detected horizontal overflow at 390, 430 or 1440 on the commercial and protected route matrix. The build emitted the repository's existing environment warning that the local Production-mode runtime was not using the approved pooled Prisma endpoint; compilation and static generation completed successfully, and no environment or Production configuration was changed.

The Vercel deployment, stable branch URL, internal terminal and review hub were verified Ready while signed in. GitHub Agent Core, Quality, Build / Browser, Database / Migration Verification, Vercel and Vercel Preview Comments checks all passed. The Draft PR remains open, Production remains untouched and the branch remains unmerged.
