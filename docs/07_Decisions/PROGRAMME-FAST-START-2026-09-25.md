# Programme fast start

**Status:** ACCEPTED

**Decision authority:** explicit Founder instruction, 25 September 2026 (mobile conversion audit, proposals P1–P3)

**Supersedes in part:** RFC-021/RFC-022 "two-control access gate" and "authority only on the intake surface"; RFC-036 GB Legal P0 wording "two-step access plus just-in-time explicit consent". Everything else in those RFCs stands.

## Decision

Starting the Programme on a phone took three checks across two screens before a person could say a word. On the intake screen the microphone and "I'd rather type" stayed disabled until a consent box, drawn at the bottom of the screen, was ticked.

1. **The access screen offers the explicit consent next to the two required checks.**
   - 18+ confirmation and the Terms/Privacy acknowledgement remain the only required checks, and "Two checks before you begin" stays accurate.
   - The explicit consent to process what the person types or says (special-category data, GDPR Art. 9(2)(a)) is a third, separate, unticked and optional box.
   - It uses the same statement and version as intake. It carries the withdrawal notice (GDPR Art. 7(3)) and a link to the privacy details.
   - Ticking it and entering Mission 01 is the explicit affirmative action. The client records the authority as soon as the anonymous Programme session exists, so intake opens with a working microphone.
   - If the box is not ticked, or recording fails, intake asks just in time exactly as before.
2. **Registration puts the main action first.** The registration note drops "Registration adds 0 XP". The Google-identity and data-use sentences remain. "Withdraw consent and clear this draft" stays available as a quiet link at the bottom of the screen.

## Unchanged

- Server authority and versions (`PROGRAM_AI_SENSITIVE_PURPOSE_VERSION` and `PROGRAM_AI_SENSITIVE_STATEMENT_VERSION`) are unchanged.
- Withdrawal, SUPPORT_FIRST suppression, XP rules and the commercial firewall are unchanged.
- No new data is stored, and the consent statement text is unchanged in every locale.

## Evidence

- `tests/gb-legal-p0-closure.test.ts` pins the new order (two required checks, the optional access consent, the intake fallback and withdrawal) and that the access consent starts unticked and never gates entry.
- `tests/program-ai-browser.spec.ts` covers the up-front consent opening intake with an enabled microphone and a single authority POST.
