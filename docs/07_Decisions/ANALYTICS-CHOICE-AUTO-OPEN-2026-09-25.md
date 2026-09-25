# Analytics choice opens for undecided visitors

**Status:** ACCEPTED

**Decision authority:** explicit Founder instruction, 25 September 2026 (answer to the open P7 question: "Yes, auto-open")

## Decision

- A visitor with no recorded analytics choice sees the site-style choice when they arrive.
- It is non-modal and does not take focus. Allow and Decline stay equal in size, and nothing is collected until Allow.
- "Not now" (×, or Escape) hides it for the rest of the tab session and records no consent. Allow and Decline record the choice as before.
- It does not open by itself on focused flows: the Programme (`/program` and its localised routes), protected Help, sign-in, admin, editorial preview and unsubscribe. On those routes the footer "Privacy choices" control still opens it.
- Under browser automation it opens by itself only when a test opts in through session storage. Otherwise every browser test would start behind an overlay.

## Unchanged

- The consent record, cookies, signature and withdrawal behaviour.
- Analytics stays off until the visitor allows it.
- The footer control and the localised copy.

## Evidence

- `tests/customer-data-analytics-lifecycle-structural.test.ts` covers the rule: unknown state only, the session dismissal, the excluded routes and the automation opt-in. It also checks that an automatic choice does not take focus.
- `tests/customer-data-analytics-lifecycle-browser.spec.ts` (CI) covers:
  - the choice appearing on `/privacy` without a click, with focus left on the page;
  - "Not now" hiding it across a reload, with no consent cookie written;
  - `/program` staying clear.
