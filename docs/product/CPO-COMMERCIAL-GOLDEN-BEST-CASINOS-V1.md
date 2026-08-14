# CPO Commercial Golden Best Casinos V1

- **Status:** Golden implementation complete locally; immutable Preview and Founder visual approval pending
- **Date:** 2026-08-14
- **Governing decision:** [RFC-034](../06_RFC/RFC-034-CPO-Commercial-Decision-Layer-Preview-V2.md)
- **Route:** `/best-casinos` only
- **Branch:** `codex/cpo-commercial-decision-layer-preview-02`
- **Draft PR:** #75
- **Baseline PR #75 head:** `e01f0574b3c19860d8541b67cc29d9c400a8483a`
- **Baseline main:** `0c956d0d99c9ac703234e82a0bca3c1d5b3a9167`
- **Baseline divergence:** 0 commits behind / 2 commits ahead of `origin/main`
- **Final implementation head:** Pending commit; resolved in the final handoff and PR #75

## Evidence classification

- **Detected:** claims supported directly by the active repository at `/Users/alex/Documents/Codex/2026-07-09/ns/sevenbet-next` after a whole-repository source scan excluding dependencies, generated output, caches, browser reports and `tsconfig.tsbuildinfo`.
- **Inferred:** design conclusions drawn from detected implementation and rendered screenshots.
- **Planned:** bounded work authorised by the Founder visual brief but not yet implemented or verified.
- **Not detected:** capabilities or evidence absent from the inspected repository.

## Visual problem

- **Detected:** PR #75 already implements the accepted Top 3, recommendation-first, evidence-on-demand architecture and Preview-safe one-click outbound terminal.
- **Detected:** the current `/best-casinos` presentation is a dark typographic hero, three materially equal white ledger cards and a final route list.
- **Inferred:** this makes the correct product logic read as an MVP comparison surface. It lacks image-led product theatre, a dominant answer, asymmetric alternatives and authored chapter rhythm.
- **Decision:** preserve the business architecture and rebuild only its presentation around **cognitive simplicity + visual richness**.

## Reference research

Research was completed with the installed Refero design tooling before implementation. Casino-affiliate patterns were deliberately excluded as a visual north star.

### Reference A — Empower

- Refero style: `14edc470-fa1c-47f9-9efa-d44194be4aec`
- Source: <https://empower.me>
- Borrow: expensive consumer-brand confidence, decisive near-black/light chapter changes, very large display typography, imagery used as a compositional counterweight and a single optimistic action accent.
- Do not borrow: its pill system, rounded-card density, imported fonts, exact yellow or financial-product claims.

### Reference B — SSENSE

- Refero style: `3e8a7a86-9627-42b9-aeea-9f6952bd1061`
- Source: <https://ssense.com>
- Borrow: imagery as primary content, sharp editorial crops, asymmetric magazine pacing, tiny utility metadata and minimal chrome around a strong visual.
- Do not borrow: fashion-house typography, monochrome-only palette, product-grid behaviour or exact composition.

### Reference C — Mode

- Refero style: `980966ef-e661-439d-8858-4cefe1e0451a`
- Source: <https://mode.com>
- Borrow: branded block architecture, high-contrast section differentiation, acid highlight as visual lift and left-aligned theatrical type.
- Do not borrow: its forest palette, rounded 16px system, decorative tints, exact highlight blocks or imported fonts.

### Concrete screen references

- **AVNIER product detail**, Refero screen `173d45af-e697-4d22-a0bd-7e5f463cf09f`: one product owns the opening viewport; supporting product story is staged through alternating image/text scale rather than repeated cards.
- **Faire product detail**, Refero screen `37544427-cdf4-409c-a2f1-c3b626f269a6`: product facts and action remain legible next to a dominant image, then deeper proof recedes below.
- **Perplexity Enterprise Finance**, Refero screen `25864165-2cc2-4aaf-b792-4cdd1ba9f826`: product evidence is treated as large visual media inside distinct chapters, with research depth available after the principal promise.

## Reference lock

### Primary visual direction

**B4GAMBLE Editorial Decision Theatre.** A premium editorial-commercial page in which B4GAMBLE visibly does the reduction work, the first recommendation feels like the answer, alternatives remain available without competing and evidence stays designed rather than hidden.

### Traits to preserve

- dark / paper chapter contrast;
- B4GAMBLE acid accent;
- B4GAMBLE teal evidence/trust role;
- huge Archivo-like typographic confidence using the existing B4GAMBLE sans;
- Instrument Serif editorial contrast using the existing B4GAMBLE serif;
- human/editorial imagery as content when it is truthful and relevant;
- asymmetric composition;
- evidence still visible;
- primary action unmistakable; and
- mobile intentionally composed.

### Token commitments

| Role | Existing token | Locked use |
| --- | --- | --- |
| Theatre | `--sb-night` | Hero, #1 stage and major closing/evidence chapters |
| Reading | `--sb-paper`, `--sb-field`, `--sb-white` | Alternatives and detailed evidence |
| Decisive action | `--sb-acid`, `--sb-acid-hover` | Primary outbound CTA and selected high-impact rank signal only |
| Evidence / trust | `--sb-teal`, `--sb-teal-rich` | Evidence labels, context and editorial signals; never an extra CTA accent |
| Display sans | `--font-seven-sans` | Oversized B4GAMBLE/rank architecture and functional type |
| Editorial serif | `--font-seven-serif` | One or two intentional editorial statements, never decorative word swapping |

### Explicit rejects

- SaaS dashboard look;
- three equal generic cards;
- generic gradients;
- crypto/neon casino aesthetic;
- random glassmorphism;
- excessive pills;
- 15 rounded cards stacked vertically;
- decorative word colouring without purpose;
- fake luxury;
- weak CSS illustrations pretending to be imagery;
- massive empty areas with no visual tension;
- template-looking comparison tables;
- gratuitous animation;
- visual noise that creates new decision friction;
- casino chips, roulette, money, jackpots or generic gambling neon;
- fabricated operator logos, screenshots, partnerships or offers.

## Existing B4GAMBLE asset inventory

| Asset / component | Current route | Visual role | Quality | Reusability | Decision |
| --- | --- | --- | --- | --- | --- |
| Home photographic hero system (`TiltHome`, `hero-*.jpg`) | Home | Human photography, layered hero scale, dark/light rhythm | High | Composition and crop discipline transfer; Programme-specific photos do not | **KEEP** on Home / **REPURPOSE** principle |
| `HomeProgrammeCarousel` and `HumanChapter` | Home | Programme story and human pacing | High | Rhythm only; commercial reuse would confuse product boundaries | **KEEP** |
| Old `BestOffersExperience` product theatre | Historical Best Offers | Immersive shortlist stage, artwork-backed focal point | High | The theatre transfers; the carousel and its decision friction do not | **REPURPOSE** |
| `/public/best-offers/shortlist-art.jpg` | Historical Best Offers | B4GAMBLE-owned abstract editorial media | High | Truthful as brand theatre, not operator imagery | **REPURPOSE** |
| `DirectoryFeaturedTheatre` | All Casinos | Image/identity layering and featured-stage scale | High | The layering transfers; its route structure does not | **EVOLVE** |
| `/public/casino-directory/editorial-media.jpg` | All Casinos | Roulette-table atmosphere | Medium | Conflicts with the no-cliché Golden direction | **RETIRE** from Golden |
| Casino profile identity / score / offer treatment | Casino Review | Product identity, decision score, limitation and action | High | Ingredients transfer without copying the profile layout | **EVOLVE** |
| About expressive sequence | About | Typographic stairs, interruption and mobile recomposition | High | Chapter rhythm transfers; content and artwork stay on About | **KEEP** / **REPURPOSE** rhythm |
| `/public/about/fresh-interruption.png` | About | Large fluid interruption image | High | About 1.8 MB and redundant with the lighter shortlist art here | **KEEP** / no Golden dependency |
| Demo fixture logo/hero/screen SVGs | Demo casino profiles | Truthful synthetic product media | High for Preview | Only valid for matching `DEMO_FIXTURE` slugs | **EVOLVE** |
| Equal Top 3 ledger cards | Existing PR #75 Best Casinos | Functional comparison records | Low as target visual | Product facts remain useful; equal-card composition does not | **RETIRE** |
| Preview terminal / Founder hub styling | Preview routes | Safe outbound simulation and review controls | High | Behaviour and styling remain outside the Golden page scope | **KEEP** |

## Design principles

1. The page sells the value of B4GAMBLE having narrowed the market, not merely a bonus record.
2. #1 is the answer; #2 and #3 are useful alternatives, never equal siblings.
3. Imagery carries editorial and product meaning. It is not decorative casino atmosphere.
4. Facts and limitations remain available before action but do not turn the entire page into a compliance layout.
5. One accent owns the decisive action. Evidence uses teal and reading surfaces use paper.
6. Each chapter changes scale, composition or surface so the page has authored rhythm.
7. Mobile receives different composition and information density, not a collapsed desktop grid.

## Golden page structure

### 01 — Hero / brand theatre

- **Detected:** oversized “Three picks. Not thirty.” proposition within a night-stage composition.
- **Detected:** B4GAMBLE abstract editorial artwork, a visible three-count and an immediate “we narrowed it down” explanation.
- **Detected:** preview/demo truth appears as integrated utility metadata, not a dominating warning card.

### 02 — #1 recommendation / hero product moment

- **Detected:** a full-width image-led theatre uses truthful local fixture/operator identity media when supported.
- **Detected:** rank, identity, Editor Score, offer, four material facts, limitation and primary action share one composed stage.
- **Detected:** Visit Casino is the first and acid action; Review and Compare are quieter evidence routes.

### 03 — #2 and #3 / asymmetric alternatives

- **Detected:** #2 receives a wide paper editorial band with media and concise comparison facts.
- **Detected:** #3 receives an offset night feature with different media treatment. It is not a clone of #2 and neither competes with #1.

### 04 — Why these three / editorial evidence

- **Detected:** a designed explanation of the existing public ranking boundary, material evidence and visible uncertainty uses a night editorial spread rather than three methodology cards.

### 05 — Deeper research

- **Detected:** All Casinos, Methodology and Compare are three differently weighted research paths, led by the route most useful after the shortlist.

### 06 — Commercial closing

- **Detected:** a calm acid closing repeats the #1 action without urgency, scarcity or a guarantee.

## Assets reused

- **Detected:** `/public/best-offers/shortlist-art.jpg`.
- **Detected:** existing matching demo logo/hero/screen SVGs for records classified `DEMO_FIXTURE`.
- **Detected:** existing B4GAMBLE font and colour tokens.

## Assets created

- **Detected:** none. The implementation adds code-native framing, crop and typographic composition but no fake operator or casino artwork.

## Design decisions

- A page-scoped Golden CSS module will isolate this work from the Preview terminal, Founder hub and every Phase 2 surface.
- The record ordering, fields, links, event metadata and Preview terminal remain the existing server-owned values.
- Matching demo media may be derived only from the existing governed local demo asset path and only when `dataClassification === "DEMO_FIXTURE"`; otherwise the UI falls back to the existing logo plus B4GAMBLE-owned editorial artwork.
- Motion is limited to 100–320 ms hover/press/media feedback. There is no autoplay, loop, parallax or new animation dependency.

## Mobile decisions

- **Detected 390:** the 760 px hero contains the count, proposition and anchor action; the #1 Visit action appears about 1,274 px into the deliberately image-led winner chapter after the offer, four facts and limitation, and before the two supporting reasons.
- **Detected 430:** more image crop and typographic tension are retained; the winner identity becomes a compact horizontal composition and primary targets render at 54–56 px high.
- **Detected:** alternative offer-body copy is removed below 600 px while the offer headline, three comparison facts, reason, limitation and action hierarchy remain.
- **Detected:** browser inspection found no horizontal overflow at 390, 430, 768, 1024, 1280, 1440 or 1920 px. The DOM order stays logical and no sticky element covers the actions during natural scrolling.

## Performance result

- **Detected:** shortlist artwork is approximately 364 KB and each matching demo SVG is approximately 4 KB; all media uses `next/image` with responsive `sizes`.
- **Detected:** the hero artwork is the only priority image and the likely media LCP candidate; no below-fold image is priority-loaded.
- **Detected:** no client component, animation package or page-specific JavaScript was added. The production build reports `/best-casinos` at 1.59 kB route size and 116 kB First Load JS.
- **Detected:** all inspected images completed with reserved fill containers and no visual layout jump was observed during the three browser passes. A numeric field LCP/CLS reading remains an immutable-Preview monitoring concern, not a local browser claim.

## Accessibility result

- **Detected:** one `main` landmark, semantic H1/H2/H3 hierarchy, an ordered alternatives list, named navigation regions and zero unnamed links on the Golden route.
- **Detected:** every meaningful product image has a contextual alt; the abstract hero artwork alone uses an intentionally empty decorative alt.
- **Detected:** primary mobile actions render at 54–56 px high. Page-scoped `:focus-visible` uses a 3 px contrast outline, and the DOM action order is Visit, Review, Compare.
- **Detected:** a `prefers-reduced-motion: reduce` rule removes transforms and collapses transition duration. Night/paper/acid/teal roles use the existing approved B4GAMBLE contrast system.

## Visual QA passes

1. **Composition:** inspected full route and chapter captures; replaced equal cards with a six-chapter, image-led composition and confirmed #1 dominance. Finding fixed: mobile identity density.
2. **Commercial hierarchy:** verified the actual one-click terminal, CTA order and 390/430 action path. Finding fixed: moved the two supporting reasons after the primary action while keeping facts and limitation before it.
3. **Polish:** inspected 390, 430, 768, 1024, 1280, 1440 and 1920 px. Findings fixed: prefixer-safe alignment values, anchor scroll margins and redundant mobile alternative copy.

## Screenshot evidence

Local production-build evidence is captured outside git under `/tmp/golden-pass{1,2,3}-*.png`. Final exact immutable Vercel Preview evidence remains pending deployment:

- 1440 full page, hero, #1, #2/#3 and evidence/research;
- 430 full page, hero + first CTA, #1 and alternatives; and
- 390 full page.

## Known limitations

- **Detected:** current Preview recommendations are fictional demo fixtures and all commercial actions end inside B4GAMBLE.
- **Detected:** `PublicOfferDTO` exposes a governed logo but not the full casino media collection. Golden media use therefore remains a page-level progressive enhancement for recognised local demo fixture assets, with a truthful fallback.
- **Detected:** Chromium visual QA was completed through the in-app browser. The repository Playwright configuration now includes Chromium and WebKit, but local standalone browser launch is blocked by the managed macOS sandbox (`MachPortRendezvousServer: Permission denied`; WebKit abort); this is an environment limitation rather than a page failure.
- Founder visual approval is still required. This document does not authorise merge or Production deployment.

## Phase 2 — not started

No Golden visual language has been propagated to Home, Bonuses, All Casinos, Casino Review, Learn, Review, About, Programme, footer or global components. After Founder approval, only Bonuses, All Casinos, Casino Review, Learn and selected commercial handoffs may be evaluated in a separate decision.
