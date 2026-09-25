# Readability pass

**Status:** ACCEPTED

**Decision authority:** explicit Founder instruction, 25 September 2026 (Production readability scan, iPhone 14 WebKit and 1440px Chromium, 13 pages)

## Decision

Four rules apply site-wide.

1. **Contrast.** Text below WCAG AA (4.5:1, or 3:1 for text of 24px or 18.66px bold) takes a stronger colour:
   - faint paper text on dark surfaces (`rgba(250, 250, 247, .4/.45/.5)`) becomes `rgba(250, 250, 247, .68)` (about 8:1);
   - metal grey `#8b8a82` on cream or paper becomes `#5e5d57`;
   - olive `#777500` becomes `#5a5900`. The `--sb-acid-contrast` token now carries `#5a5900`; all its uses are text on light surfaces or focus outlines;
   - danger red `#b94b47` that misses AA on cream becomes `--sb-danger-text` (`#a72e2a`).

   Acid on dark, white on dark and ink on cream stay as they are.
2. **Wide small caps.** Uppercase text at 13px or less tracked at .15em or wider reads at `font-size: 13px` with `letter-spacing: .08em`. It stays uppercase and keeps its weight. Examples are chips (TOP RATED, FAST PAYOUTS), kickers and eyebrows, footer headings (EXPLORE, TRUST), control labels (SEARCH CASINOS), counts ("28 casinos shown") and card category labels.
3. **Italic serif paragraphs.** Paragraphs set in the italic display serif, 40 characters or longer, at 20px or less read in the site sans (`var(--font-seven-sans)`), `font-style: normal`, `font-size: 16px`, `line-height: 1.5`. Examples are the casino card "for whom" line, the review verdict, FAQ answers and the intro paragraphs on 10 Steps, Best Offers, Bonuses and Casinos. When a paragraph's authored size is a `clamp()` that starts at 20px or less, it changes at every width.
4. **Small multi-line text.** Sentence-case text under 14px that runs 60 characters or more reads at `font-size: 14px` with a line height of at least 1.45. Examples are the footer commission line, the casino card reason line, commercial disclosures and the language notice in the header menu and the phone drawer.

The italic serif stays for headings, big numbers (scores, "No. 02"), short accents under 40 characters, the large search field and its placeholder, and bonus headlines.

## How it is applied

- Component stylesheets and the shared public header and footer are corrected at source.
- Captured handoff pages (Learn hub, Methodology, Bonus Guide, the Help and Responsible Gambling fallbacks, 404 and Home) keep `generated-pages.json` unchanged:
  - `lib/final-handoff/readability.ts` reads each element's inline typography, with inheritance, and marks the elements that break a rule with a `data-readable` token (`caps`, `paper`, `grey`, `olive`, `danger`, `prose`, `small`, `leading`).
  - `HandoffPage` runs this pass after the page transform. `app/globals.css` applies each token with `!important` so it beats the inline style.
  - Markup that the transforms generate (Learn cards and bridges, Bonus Guide "Read next" and notices) is corrected in `lib/final-handoff/transforms.ts`.
- The minimum font size stays 12px everywhere, and `npm run typography:audit` passes without new exceptions.

## Desktop Home exception

The desktop Home composition stays frozen.

- Home takes the handoff tokens only inside `@media (max-width: 760px)`, the breakpoint of the phone Home work. The phone hero kicker override in `app/globals.css` moves to 13px and .08em.
- The Home stylesheet (`transformHomeHandoffCss` and the compositor fix) is unchanged, so its CSP style hash does not move.
- Above 760px the Home loading frame keeps its previous kicker tracking.
- The shared public footer is on every page, desktop Home included. Its group headings (Explore, Programme & Support, Trust) now read at `.68` paper, 13px, .08em, and the commission line reads at 14px/1.5. The language notice in the header's language menu reads at 14px/1.5.

## Not changed

- Decorative `aria-hidden` text keeps its colour: the casino card rank "No. 02" and the verdict dash. Input placeholders also keep theirs.
- The secondary Best Offers rank numbers (48px, 3.1:1) keep their colour, because they already meet the large-text threshold.
- On the signed-in Programme dashboard and Mission screens, only the contrast rule is applied: labels, locked Missions, stats and footer move to `.68` paper. Rules 2–4 there are deferred to a Programme change with a browser run. The phone Mission layout keeps the first choices on the first screen (`tests/program-ai-browser.spec.ts`).
- Unused legacy stylesheets that no route renders are not edited.

## Evidence

- `tests/visual-accessibility-regressions.test.ts` covers:
  - the footer headings, commission line and language notices;
  - the catalogue chips, counts, card "for whom" and reason lines, profile verdict and facts;
  - a sweep of the live stylesheets for wide small caps and faint paper text;
  - Learn card categories and meta;
  - the handoff token rules (every token, every threshold, headings excluded, rows of short items excluded);
  - Home tokens existing only inside the phone query, and the Home stylesheet staying untouched.
- `npm run typography:audit` passes (12px floor).
