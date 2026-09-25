# A refused casino click leads back to the casino

**Status:** ACCEPTED

**Decision authority:** explicit Founder instruction, 25 September 2026 (remaining-pages mobile audit, package A). The commercial session confirmed on the same day that no rule forbids internal navigation from this page.

## Decision

- When `/r/<slug>` refuses a click, it still answers 303. The target is `/outbound/unavailable?link=<slug>`, and only a slug that passes `normalizeRedirectSlug` travels. Blocking, attribution and failure reasons are unchanged.
- The page uses the site's dark system and plain language: "This link isn't available right now." It no longer shows the internal "Fail closed / No substitute offer" wording.
- Recovery actions, in this order:
  1. "Back to the {casino} review", when the slug belongs to a published CMS casino profile.
  2. "See offers available to you" (Best Offers), only where `offersMayBePresented` allows it for the reader's market.
  3. The homepage, when neither of the above applies.
- The page never renders an offer, a partner route or an outbound link. Best Offers is internal navigation that the reader chooses, not a substitute destination. Best Offers applies the market register itself (RFC-054).
- The `link` query value is untrusted. The page reads only a valid slug, looks up a published casino, and shows that casino's public name, never raw query text.
- Copy is localised in every supported locale.

## Why

Partner actions open in a new tab, so a refused click left the visitor on a dead end whose only exit was the homepage.

## Evidence

- `tests/outbound-recovery.test.ts` covers:
  - slug validation for hostile input;
  - the recovery URL;
  - locale completeness.
- `tests/fe-gap-02-structural.test.ts` pins the redirect wiring and forbids outbound routes on the page.
- `tests/ops-browser.spec.ts` covers:
  - the legacy and no-JS flows;
  - the recovery actions for an unknown slug;
  - that raw query text is never echoed.
- `tests/outbound-click-attribution-postgres.test.ts` checks the recovery `Location`.
