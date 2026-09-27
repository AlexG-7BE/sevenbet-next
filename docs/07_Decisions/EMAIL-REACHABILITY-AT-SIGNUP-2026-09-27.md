# Customers are reachable by email from sign-up

**Status:** ACCEPTED

**Decision authority:** explicit Founder instruction, 27 September 2026, before real GB/SE/DK/DE traffic starts on 28 September. Registered customers must be reachable by email so reminders and campaigns can bring them back to the site's offers.

## Decision

- **Every email sign-up is sent the confirmation link at once.** Better Auth `emailVerification.sendOnSignUp` is on. Better Auth 1.7.1 awaits the send callback inside the sign-up request, so the callback only schedules delivery with Next `after()`: sign-up never waits on the provider and never fails because of it.
- **The link lands the customer in their Programme, signed in.** The sign-up passes the Programme path of the visitor's language as `callbackURL`. The link is valid for 24 hours (Better Auth's default is 1 hour), and opening it confirms the address and signs the customer in on that device (`autoSignInAfterVerification`), which covers a mail app that opens its own browser. It works as a sign-in link only while the address is unconfirmed. Staff accounts cannot be signed in this way; the admin MFA session hook refuses it. An expired link lands on the Programme with `?error=TOKEN_EXPIRED`.
- **An unconfirmed customer can ask for the link again** from their Programme dashboard. The endpoint answers only a signed-in customer, for their own address. A request within a minute of the last queued, sent or delivered confirmation costs no second email.
- **Google sign-up gets the same optional email opt-in.** The one unticked checkbox on the registration screen now serves Google and email sign-up alike and is asked once (see the consent-once rule). A ticked box travels across the Google redirect in `sessionStorage`, bound to the journey for ten minutes, and is recorded after OAuth through the existing preference service (`PROGRAMME_SIGNUP`, policy `email-marketing-v1`). The checkbox hides only while the email form is switched to signing in to an existing account.
- **The opt-in sentence is translated.** The English wording is unchanged and remains the policy source; the registration screen shows the Programme catalogue translation in every Programme language, with the customer's locale stored on the consent event.
- **The welcome email leaves right after sign-up.** Both sign-up signals (the email-auth observer and the session hook that Google sign-ups pass) call `deliverWelcomeEmail` after the response. It reuses the queued message, its fixed idempotency key and the atomic claim, so a race with the nightly run or a second signal sends once. A disabled runtime leaves the message queued without spending an attempt. The nightly `customer-lifecycle` run stays the retry path.

Email content, reminder rules and campaign rules are unchanged.

## Cost

Resend is on the Free plan: 100 emails a day, shared by all mail. An email sign-up now costs two emails (confirmation and welcome) and a Google sign-up one (welcome).

## Supersedes

- The RFC-046 / 11 September structural contract that no runtime auth path may deliver a welcome message. Only the two sign-up signals may, through `deliverWelcomeEmail`.
- The operations note that the opt-in sentence stays in English until approved translations exist.

## Evidence

- `tests/email-verification-signup.test.ts` runs the installed Better Auth 1.7.1 with this configuration: one link per sign-up that passes the email origin check, sign-in on another device, single-use sign-in, a 24-hour lifetime, refusal of a foreign landing page, expired-link landing, resend for a signed-in customer only, sign-up unaffected by a hanging or failing provider, and the Google opt-in carry-over rules.
- `tests/email-reliability-postgres.test.ts` covers the immediate welcome: one claim and one provider call when two signals race the nightly run, no attempt spent while delivery is disabled, nightly retry after a failure, no welcome for an address suppressed for all email, and the resend cooldown.
- `tests/auth-comms-browser.spec.ts` covers the single opt-in on the registration screen, the sign-up `callbackURL`, recording after the Google return (and nothing without a tick), and the dashboard resend.
