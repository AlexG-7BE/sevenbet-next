# The footer notice block is hidden from every visitor

**Status:** ACCEPTED

**Decision authority:** explicit Founder instruction, 11 October 2026, quoting the block (18+ and "Adults only", the licensed-links statement, the Great Britain support links, the company line): "скрой это, пока что, не удаляй это, а просто скрой ото всех, пока в этом нет смысла." Confirmed the same day after being told what the block is for: "блок в подвале скрой".

This record suspends, for the footer only, the first decision of [GOOGLE-UK-CERTIFICATION-2026-10-04](GOOGLE-UK-CERTIFICATION-2026-10-04.md). Ireland, the withheld DrückGlück GB offer and Northern Ireland are untouched.

## Decision

- **The block is not rendered anywhere.** `FOOTER_COMPLIANCE_VISIBLE` in `components/footer-compliance/FooterCompliance.tsx` is `false`, and the component returns nothing. That covers every public footer, the Programme footer and the `/start` landing, for every visitor, country and language.
- **Nothing is deleted.** The component, its four lines, their fifteen translations in `lib/i18n/public-shell-catalog.ts`, the support links and the styles stay. Both footers still mount the component.
- **The footer keeps its dividing rule.** The block used to carry the rule above the legal links; while it is hidden the baseline carries it, as it did before 4 October.

## What every visitor still sees

- "Information, comparison and education. Not a gambling operator." beside the wordmark.
- "We may earn commission from clearly labelled affiliate links." in the baseline, with Terms, Privacy and Contact.
- The Help link in the Programme & Support column, and the protected Help area with its own support services.
- On `/start`: its own "Independent support" list (GamCare, GAMSTOP), the Programme disclaimer and the 18+ line in its baseline.

## What is no longer shown

- The 18+ badge and "Adults only. Gambling involves financial risk and can be addictive." in the public footer.
- "We only link to gambling sites licensed and authorised where you are. In Great Britain, that means a UK Gambling Commission licence."
- The National Gambling Helpline number, GamCare, BeGambleAware.org, GAMSTOP and "Find local help" in the footer.
- "B4GAMBLE is run by 7BE Inc., New York, USA. We hold no gambling licence." The company is still named in the Privacy Notice, the Terms and the Affiliate Disclosure.

## Consequence the Founder was told before confirming

The block was added so that b4gamble.com would meet what Google's UK certification for "online gambling-promoting content" asks of an affiliate site's footer: an age warning, addiction resources and a prominent licensed-links statement. YouTube allows a link to the site only with that certification. While the block is hidden the site does not meet that footer requirement.

## Restoring it

Set `FOOTER_COMPLIANCE_VISIBLE` to `true`. The block returns on every footer and on `/start` with its translations. Then restore the four expectations this change inverted: `tests/start-landing.test.ts` (the block's links and lines), `tests/public-shell.test.ts` (the switch), and the footer checks in `tests/public-ia-hardening-browser.spec.ts` and `tests/internationalisation-browser.spec.ts`.

## Evidence

- `tests/public-shell.test.ts` — the switch is off, the component renders nothing before building anything, both footers still mount it, and the four lines stay written and translated in fifteen locales.
- `tests/start-landing.test.ts` — `/start` renders none of the block's lines, links or phone number and keeps one 18+ notice.
- `tests/public-ia-hardening-browser.spec.ts`, `tests/internationalisation-browser.spec.ts` — no block in the rendered footer; the commission line is still there in the page's language.
