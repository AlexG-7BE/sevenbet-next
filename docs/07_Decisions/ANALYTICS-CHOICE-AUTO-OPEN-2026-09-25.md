# Analytics choice opens for undecided visitors

**Status:** ACCEPTED

**Decision authority:** explicit Founder instruction, 25 September 2026 (answer to the open P7 question: "Yes, auto-open")

## Decision

- A visitor with no recorded analytics choice sees the site-style choice when they arrive.
- It is non-modal and does not take focus. Allow and Decline stay equal in size, and nothing is collected until Allow.
- "Not now" (×, or Escape) hides it for the rest of the tab session and records no consent. Allow and Decline record the choice as before.
- It does not open by itself on focused flows: the Programme (`/program` and its localised routes), protected Help, sign-in, admin, editorial preview and unsubscribe. On those routes the footer "Privacy choices" control still opens it.
- Under browser automation it opens by itself only when a test opts in through session storage. Otherwise every browser test would start behind an overlay.

## Amendment: compact choice after the first scroll (25 September 2026)

The Founder chose option B3 after the remaining-pages mobile audit. On arrival, the 189px choice covered the acid primary action on the home page and on 10 Steps.

- The automatic choice waits for the visitor's first scroll past 24px, or five seconds on the page, whichever comes first. The first screen and its primary action stay clear.
- The copy is shorter in every locale, for example: "With your permission, first-party analytics show us how B4GAMBLE is used. Never your email, Programme answers or partner tokens."
  - It still states the purpose and that the analytics are first party.
  - The exclusion statement stays visible at every width.
  - On a 390px phone the choice is about 141px tall.
- Equal Allow and Decline, "Not now", the excluded routes, the session dismissal and the automation opt-in are unchanged.

## Unchanged

- The consent record, cookies, signature and withdrawal behaviour.
- Analytics stays off until the visitor allows it.
- The footer control and the localised copy.

## Evidence

- `tests/customer-data-analytics-lifecycle-structural.test.ts` covers the rule: unknown state only, the session dismissal, the excluded routes and the automation opt-in. It also checks that an automatic choice does not take focus.
- `tests/customer-data-analytics-lifecycle-browser.spec.ts` (CI) covers:
  - the choice staying hidden on arrival at `/privacy`, then appearing after a scroll without a click, with focus left on the page;
  - the choice arriving after the delay on `/faq` without a scroll;
  - "Not now" hiding it across a reload, with no consent cookie written;
  - `/program` staying clear.
