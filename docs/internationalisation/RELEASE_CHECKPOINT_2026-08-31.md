# Internationalisation release checkpoint — 31 August 2026

**Status:** PRE-MERGE DURABLE CHECKPOINT  
**Workstream:** PR #105 — Internationalisation foundation — market, locale and partner-ready architecture  
**Branch:** `feat/internationalisation-market-foundation`  
**Engineering closure baseline before this documentation-only checkpoint:** `eb702b79c2f5bd739c95d5b0a7d401ced748b605`  
**Founder intent recorded 31 August 2026:** preserve this checkpoint, then merge PR #105 and deploy the accepted scope to Production before starting Programme Internationalisation.

This document records the exact durable state reached by the internationalisation workstream before merge. It is a continuity checkpoint, not a claim that the merge or Production deployment has already happened. Git history, GitHub Actions and Vercel remain authoritative for the later exact merge/deployment identifiers.

## Release evidence at engineering closure

The pre-checkpoint engineering head `eb702b79c2f5bd739c95d5b0a7d401ced748b605` passed GitHub Actions run `33344097514`:

- Agent Core — PASS;
- Quality — PASS, including `npm run ci:quality` and the full Programme regression suite;
- Database / Migration Verification — PASS;
- Build / Browser — PASS, including Production build, build-secret checks, the complete browser suite and typography browser checks.

The exact-head Vercel Preview completed successfully:

- GitHub deployment: `6172914638`;
- Preview URL: `https://sevenbet-next-f0ce2nekw-alexg-7bes-projects.vercel.app`;
- branch Preview URL: `https://sevenbet-next-git-feat-international-d0bed6-alexg-7bes-projects.vercel.app`;
- deployment SHA: `eb702b79c2f5bd739c95d5b0a7d401ced748b605`.

The final closure evidence also records three consecutive local visual cycles with 1,169 screenshots per cycle, 3,507 aggregate screenshots, 444 aggregate manually reviewed contact sheets, all 11 authored European Home locales across 17 Founder viewports, and no known public-site visual/responsive/localisation/content-presentation defect at closure.

## Durable architecture now implemented

The branch implements a market-aware, locale-aware public product while preserving the separation between presentation and commercial authority.

Canonical public URL shape:

- `/` = GB / `en-GB`;
- `/de/` = DE / `de-DE`;
- `/it/` = IT / `it-IT`;
- `/es/` = ES / `es-ES`;
- `/pt/` = PT / `pt-PT`;
- `/gr/` = GR / `el-GR`;
- `/nl/` = NL / `nl-NL`;
- `/se/` = SE / `sv-SE`;
- `/dk/` = DK / `da-DK`;
- `/fi/` = FI / `fi-FI`;
- `/no/` = NO / `nb-NO`;
- future secondary locale example: `/ca/fr/` for CA / `fr-CA`.

Market and locale remain separate typed concepts. Locale, route presence, translation or manual presentation selection never grants commercial/referral authority.

The selector is gated by `PUBLIC_CORE_READY`, not merely by the presence of a translation. The routing layer preserves canonical one-hop redirects from redundant default-language inputs and keeps protected/internal route families outside market-prefix localisation.

## Locale readiness at this checkpoint

### Production-publication set after ordinary merge/deploy

The Founder has accepted the following localized editorial/public-core presentations:

- GB / `en-GB` — source baseline;
- DE / `de-DE` — `PUBLIC_CORE_READY`, AI language QA passed;
- ES / `es-ES` — `PUBLIC_CORE_READY`, AI language QA passed;
- SE / `sv-SE` — `PUBLIC_CORE_READY`, AI language QA passed;
- DK / `da-DK` — `PUBLIC_CORE_READY`, AI language QA passed;
- GR / `el-GR` — `PUBLIC_CORE_READY`, AI language QA passed.

For DE/ES/SE/DK/GR, `AI_LANGUAGE_QA_PASSED` is the Founder-accepted language-quality gate for editorial publication. Human/native-speaker linguistic review is not a required publication gate. This does not replace legal, market, commercial or indexing authority.

### Second European wave already authored but not publication-authorised

The following locales are `HOME_READY` in the typed review-state model and have AI language QA passed:

- IT / `it-IT`;
- PT / `pt-PT`;
- NL / `nl-NL`;
- FI / `fi-FI`;
- NO / `nb-NO`.

Their Home and selector-hidden draft public-core routes are inspectable in Preview. They are not Founder-approved for Production publication, remain hidden from the Production selector, and still require the market-evidence/publication work appropriate to each market.

### Canada

CA / `en-CA` and CA / `fr-CA` remain `ARCHITECTURE_ONLY`. The typed market/locale model exists, but no localized public renderer/publication authority is claimed.

## Public-content scope completed by PR #105

The localisation framework and rendered QA cover the ordinary public product rather than only navigation chrome. The implemented route family includes, as applicable to each readiness state:

- Home;
- shared header/navigation/market-language selector/footer;
- Best Offers;
- Casinos directory;
- Casino profile presentation;
- Bonuses;
- Compare;
- 10 Steps public explanation;
- About;
- Contact;
- FAQ;
- Methodology;
- Learning Center and article presentation;
- localized public error/empty/unavailable states;
- exact Help and Responsible Gambling for the first-wave evidence set.

Terms, Privacy and Affiliate Disclosure remain the unprefixed authoritative operative legal documents. Protected Help subroutes remain outside the general localization subtree. These boundaries are intentional and must not be mistaken for missing ordinary-page localization.

## Programme changes included in PR #105

PR #105 is not a Programme Internationalisation release, but it does contain real bounded improvements to the existing English Programme runtime. These changes must not be lost or incorrectly described as “Programme runtime unchanged.”

Detected Programme changes include:

- a server-derived `primaryAction` contract for `start-mission-one`, `finish-mission-one`, `start-mission`, `resume-mission` and `review-mission`;
- explicit current-action position and action-total data for mission presentation;
- Mission 01 entry from Programme Home routed through the intended Starting Point flow rather than a generic start action;
- `xpPreview` carried through the first-turn/support-first path so the support screen reports the actual preserved XP value;
- Home copy and CTA state now reflect actual mission state more accurately;
- Starting Point save/registration wording was tightened around the actual Starting Point object;
- Programme mission progress/review copy was centralized where changed;
- the full Programme regression suite passed on the engineering closure head.

These are product/runtime quality improvements. They do **not** constitute Programme Internationalisation.

## Programme Internationalisation — explicit next workstream

At this checkpoint, the operative Programme remains on the existing unprefixed English contract. Its authored UI/runtime copy is not yet connected to a complete market/locale catalogue comparable to the public-site i18n layer.

The next engineering/product workstream after this release is therefore Programme Internationalisation, with the following target invariant:

```text
User
→ presentation Market
→ Locale
→ localized Programme presentation
→ localized Mission/UI/auth/support copy
→ locale-aware AI input/output contract
→ one language-neutral Programme state/data model
```

Programme progress, mission IDs, action IDs, XP, completion state, artifacts and user state must remain language-neutral. Changing presentation language must not create a second Programme, reset progress, or alter commercial authority.

The target first European Programme-language set is the authored European market set:

`en-GB`, `de-DE`, `es-ES`, `sv-SE`, `da-DK`, `el-GR`, `it-IT`, `pt-PT`, `nl-NL`, `fi-FI`, `nb-NO`.

Programme Internationalisation should cover the full journey, including entry, Starting Point, authentication transition, Home, all 10 Missions, actions, completion/XP, reviews, support-first states, errors/loading/empty states and locale-aware AI behaviour.

## Safety and authority boundaries preserved

This checkpoint does not activate any of the following:

- non-GB indexing or sitemap inclusion;
- non-GB operator/partner/offer/tracking/referral authority;
- localized operative legal publication;
- localized Programme runtime;
- commercial targeting from Programme, Help, self-check, limits or vulnerability data.

Every non-GB commercial path remains fail-closed until exact cumulative operator/licence/partner/offer/tracking/action authority exists. Greece additionally remains commercially blocked without the required HGC Affiliate Suitability evidence.

## Remaining work after this release

The intended sequence after PR #105 reaches Production is:

1. Programme Internationalisation architecture — one locale-aware presentation layer over one language-neutral Programme state model.
2. Full Programme localization for the European locale set.
3. Market-evidence/publication closure for IT/PT/NL/FI/NO, then explicit publication decisions.
4. Canada content/evidence work when prioritised; current CA state remains architecture-only.
5. End-to-end localized Programme/public-site QA across supported markets and viewports.
6. Indexing decisions separately from publication.
7. Commercial activation separately, only when exact operator/licence/partner/offer/tracking evidence exists.

## Completion boundary for this checkpoint

The internationalisation public-site foundation, first-wave publication-ready content, responsive/localisation closure and bounded Programme quality improvements are preserved in repository history by this checkpoint.

The next workstream must build forward from this state. Do not reopen the completed public-site localisation/responsive closure without a new regression, new evidence or new scope.