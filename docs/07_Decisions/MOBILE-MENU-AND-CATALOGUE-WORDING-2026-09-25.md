# Mobile menu order and plain catalogue wording

**Status:** ACCEPTED

**Decision authority:** explicit Founder instruction, 25 September 2026 (remaining-pages mobile audit, package D)

## Decision

### Mobile navigation drawer

- The drawer order is: routes, then **Start Programme**, then **Log in**, then the Help box, then the language choice, then the 18+ line.
- Start Programme is the site's acid button: full width, at least 52px tall, 16px bold, sentence case, button radius. Its hover matches the other acid buttons.
- Log in reads at 16px with a 44px tap target. It still appears only for readers who are not signed in.
- Labels, links, the Programme-context labels ("Open My Programme" when signed in) and the Programme language selector are unchanged.
- The desktop header is unchanged. The drawer no longer shares the desktop outline button class.

On a 390×664 phone, Start Programme used to be the last item (y≈611). It now sits directly under the four routes.

### Catalogue wording and readability (/best-offers, /bonuses, /casinos)

- A fact with an unknown value is not rendered. Cards show no "Not verified" rows and are not padded up to three facts. A card with no known facts has no fact list. This matches the rule the casino profile adopted in #344.
- A reason line never says "Not verified". An unknown part is left out, and the editor score stands in when nothing else is known.
- Counts name what the reader sees: "1 casino" / "10 casinos" on /casinos, and "1 offer" / "8 offers" on /bonuses and in the /best-offers hero. They use each locale's plural rules. German uses "Anbieter".
- The /best-offers hero reads "Offers for {market}." When no country is known, it reads "Offers from around the world." It no longer says "Published records are filtered for the global catalog."
- The /best-offers method heading is "How we pick" instead of "Material terms · Source status". Its kicker is "Methodology", and the methodology link stays.
- Card term labels (Payout, Wagering, Minimum deposit and so on) are 13px with 0.06em letter-spacing. They use paper at 66% opacity, a contrast ratio of at least 7.7:1 on every card surface. They were 12px, 0.18em and 45% opacity (4.3:1). Values are unchanged.
- Every locale carries the new strings. The `notVerified` message key remains, because the casino profile still uses it internally. The unused `eligibleRecords` hero label was removed from the commercial UX messages.

## Unchanged

Rankings, CTAs and partner routing are unchanged, and so are offer visibility, the commercial firewall and protected Help. The desktop home and the casino profile are unchanged.

## Evidence

- `tests/public-shell.test.ts` checks the drawer order, the unchanged labels and the anonymous-only Log in. It also checks the acid 16px/700/52px primary rule, the 16px Log in rule and the desktop header's outline button.
- `tests/commercial-ux-v1.test.ts` checks that, for every locale, the Best Offers, Bonuses and Casinos card presenters drop unknown rows without padding. It checks that reason lines never say "Not verified", the plural counts, the market and worldwide hero copy, the "How we pick" heading, the page wiring, and the label size and contrast.
- `tests/commercial-availability-presentation.test.tsx` renders the three card components with unknown values and asserts no `<dl>` or "Not verified" text.
- Browser specs:
  - `tests/founder-header-home-responsive-browser.spec.ts` checks drawer order and type at 390×844.
  - `tests/commercial-ux-v1-browser.spec.ts` checks "How we pick", "6 offers", "10 casinos", "8 offers" and the absence of "Not verified".
  - `tests/localization-visible-defects-browser.spec.ts` checks the German casino collection. Three fixture casinos have no readable payout, so their cards drop that row rather than printing "Nicht verifiziert".
