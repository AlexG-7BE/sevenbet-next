# Programme fast start

**Status:** ACCEPTED

**Decision authority:** explicit Founder instruction, 25 September 2026 (mobile conversion audit, proposals P1–P3)

**Supersedes in part:** RFC-021/RFC-022 "two-control access gate" (now three required checks) and "authority only on the intake surface"; RFC-036 GB Legal P0 wording "two-step access plus just-in-time explicit consent" (consent is now asked once, on the access screen); RFC-022/RFC-025 "registration follows the Starting Point" (now also possible before it). Everything else in those RFCs stands.

## Decision

Starting the Programme on a phone took three checks across two screens before a person could say a word. On the intake screen the microphone and "I'd rather type" stayed disabled until a consent box, drawn at the bottom of the screen, was ticked.

1. **Three required checks on the access screen, asked once (revised 25 Sep 2026).**
   - The Founder rejected the first implementation, in which the consent was optional on the access screen and repeated on intake and registration. The access screen now has three required checks: 18+, Terms/Privacy, and the explicit consent to process what the person types or says (special-category data, GDPR Art. 9(2)(a)). The heading is "Three checks before you begin."
   - "Enter Mission 01" stays disabled until all three are ticked. Ticking the consent and entering is the explicit affirmative action.
   - The client records the authority as soon as the anonymous session exists. If that request fails, the first recording or submission records it without asking again. The journey remembers the consent (`processingConsented`), and a reload keeps it.
   - Intake repeats nothing: no "Before you share" block, consent box or withdrawal note, and the microphone works on arrival.
   - Only a journey that never reached this access screen is asked once on intake: a signed-in person starting Mission 01 from the dashboard.
   - Registration shows only the sign-in actions. The Google/data sentence and "Withdraw consent and clear this draft" are gone. Withdrawal stays available through the Privacy notice.
2. **A quiet account-first route (P2).**
   - Under "I'd rather type" the intake screen offers a small "Create an account first →" link. It is not a second call to action: Mission 01 stays the main path.
   - The link opens the registration screen without a Starting Point ("Save your place first.") with Google and email, plus "← Tell my story first".
   - After sign-up the client records the access checks the person affirmed on this journey for the new account, through the existing authenticated access endpoint.
   - The dashboard then opens with "Start Mission 01". No claim, Starting Point or XP is created, and Mission 01 later earns its usual XP.
   - The route is never offered on the SUPPORT_FIRST screen.
3. **Registration puts the main action first.** The registration note drops "Registration adds 0 XP". The Google-identity and data-use sentences remain. "Withdraw consent and clear this draft" stays available as a quiet link at the bottom of the screen.

## Unchanged

- Server authority and versions (`PROGRAM_AI_SENSITIVE_PURPOSE_VERSION` and `PROGRAM_AI_SENSITIVE_STATEMENT_VERSION`) are unchanged.
- Withdrawal, SUPPORT_FIRST suppression, XP rules and the commercial firewall are unchanged.
- No new data is stored, and the consent statement text is unchanged in every locale.

## Evidence

- `tests/gb-legal-p0-closure.test.ts` pins three required checks in order, Enter gated on all three, the journey-level `processingConsented` flag, intake asking only when consent was not given, and no repeated notices ("Before you share", "Optional. You can withdraw", "Withdraw consent and clear this draft", the Google/data sentence).
- `tests/program-ai-browser.spec.ts` covers:
  - three required checks: Enter stays disabled until the consent is ticked, then intake opens with a working microphone, no checkbox and a single authority POST;
  - the account-first route end to end with real email auth, checking user access acceptance with no Starting Point and no XP.
