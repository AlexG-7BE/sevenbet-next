# A press on Google leaves at once

**Status:** ACCEPTED; implemented, in review (not on Production yet).

**Decision authority:** explicit Founder choice, 12 October 2026. After his own walk through the
Programme start on Production he reported that the Google button loads for several seconds before
Google opens. Shown the request log below and the options, he chose "Мгновенная кнопка Google":
everything is prepared in advance, the press goes straight to Google, and the button changes its
look at once.

**Extends:** [ONE-SIGN-IN-FORM-2026-10-11](ONE-SIGN-IN-FORM-2026-10-11.md), Part 5 (the claim is
made behind the screen) and Part 6 (Log in carries what the tab already holds).

**Touches one sentence of RFC-021 §3**, which says the Google request allow-list "remains": the
allow-list gains one key, `disableRedirect`, accepted only as the literal `true` (see "The server
boundary"). The RFC text itself is not edited by this change.

## Production evidence

**DETECTED** in the Vercel request log, 12 October 2026 (UTC), Swedish pages, one visitor:

```text
11:00:35.0  POST /api/programme-access/authority        "Agree and continue"
11:00:35.4  POST /api/program/program-ai/session
11:00:35.9  POST /api/program/program-ai/authority
11:00:36.3  POST /api/program/program-ai/turn
11:00:40.7  POST /api/program/program-ai/starting-point  the claim behind the screen starts
            (no POST /api/program/program-ai/claim follows)
11:00:54.9  GET  /sv/program                             the page is loaded again
11:00:59.1  POST /api/program/program-ai/starting-point  press 1
11:00:59.7  POST /api/program/program-ai/claim
11:01:00.2  POST /api/auth/sign-in/social
11:01:08.1  GET  /sv/program                             back from Google
11:01:11.7  POST /api/program/program-ai/starting-point  press 2
11:01:12.1  POST /api/program/program-ai/claim
11:01:12.5  POST /api/auth/sign-in/social
11:01:15.5  GET  /sv/program                             back from Google
11:01:18.4  POST /api/program/program-ai/starting-point  press 3
11:01:18.8  POST /api/program/program-ai/claim
11:01:19.2  POST /api/auth/sign-in/social
```

Every press sent three requests, 0.4–0.6 s apart, before the browser left for Google. Presses 2
and 3 came 12 and 6 seconds after the previous claim, which the server keeps for 30 minutes.

In a second walk two minutes later (11:02 UTC) the chain `turn` → `starting-point` → `claim` →
`sign-in/social` ran once, 0.4 s apart, and the claim was redeemed after the return from Google.
**INFERRED** from the timing: that press was made while the answers were still being processed,
waited for them, and used the claim made behind the screen.

## Why the earlier claim was not reused

- **DETECTED (log):** in the first walk the claim behind the screen was never completed. The server
  received its first request (`starting-point`, 11:00:40.7) and no `claim` request before the page
  was loaded again 14 seconds later. So no claim time was remembered in the tab.
- **UNKNOWN:** why the `claim` request never came. **INFERRED:** the answer to `starting-point` was
  slow and the page was reloaded while waiting; the log shows database connection timeouts in the
  same minutes (`prisma_pg_connect_retry` at 11:00:28 and 11:02:27, a `500` on a Mission request
  at 11:03:08).
- **DETECTED (code):** after a reload the screen restored the Starting Point, but nothing made the
  claim behind it. Only a press did.
- **DETECTED (code):** a claim made by a press was not remembered. The Programme screen stored the
  claim time only when the claim was made right after the answers (`/login` did store it). So
  every later press made the claim again, however recent the last one was.

## The time a person has at Google

**DETECTED (installed Better Auth 1.7.1, `dist/state.mjs`; `lib/auth/config.ts`):** the site keeps
sign-in state in the database, and the library sets the signed `state` cookie for 300 seconds. The
stored state row and its payload last 10 minutes. The auth configuration sets no other lifetime
or strategy. A sign-in therefore has to come back from Google within 5 minutes of the request
that made the Google address. This was already so before this change; the 25 minutes the pending
claim leaves for the return are the claim's own guarantee and are longer than the sign-in state
allows.

The browser keeps one sign-in state per site. Only the newest Google address is valid.

## Decision

- **The Google address is prepared behind the screen.** While the registration screen is on, for a
  person who can press the Google button and has a Starting Point (or a Google sign-up that began
  on Log in), the client sends the same sign-in request the press sent, with `disableRedirect:
  true`, and keeps the address the server returns. The address and its time live in memory only.
  **Nothing is sent to Google before the press.**
- **A press leaves at once.** With a prepared address and a fresh claim, the press writes the claim
  marker and the remembered email opt-in, as it always did right before leaving, and assigns the
  location. No request is awaited.
- **A prepared address is used for one minute at most** and is renewed after 45 seconds (the
  screen looks at what is due every 5 seconds). The person keeps at least 4 of the 5 minutes at
  Google. Before this change they had the full 5 minutes from the press.
- **The claim is renewed after 4 minutes.** A Google press still uses only a claim made up to 5
  minutes ago, so at least 25 of the server's 30 minutes remain for the return. That guarantee is
  unchanged.
- **Every claim is remembered.** A claim a press had to make is stored with its time, in the tab's
  session storage and in the screen's state, so the next press reuses it. A reloaded screen that
  finds a Starting Point without a fresh claim makes the claim behind itself.
- **A claim being made again does not count as ready.** The server drops the earlier claim as soon
  as a new one is started, so the remembered time is forgotten first. If the renewal fails
  half-way, the next press makes the claim itself.
- **Requests never race for the sign-in state.** Address requests never overlap. A press that
  comes while a request is in flight waits for it and then leaves with its result. After a press
  nothing new is prepared.
- **A hidden tab prepares nothing.** No timer runs while the tab is hidden. A tab shown again
  forgets its address, because another tab may have asked for a newer one, and asks again at once.
  Preparation stops when the screen is left.
- **Limits.** Nothing new is prepared while email sign-up or saving is in flight. After a failed
  attempt the next one waits 30 seconds. A screen nobody has touched for 15 minutes stops preparing
  until it is touched.
- **The button answers at once.** On press it is disabled and reads "Opening Google…" (the string
  Log in already used, in all thirteen catalogue languages; Swedish "Öppnar Google…"). A second
  press does nothing. If the request fails, the button comes back with the existing text "Google
  account access failed". If the page is still there 10 seconds after a press, or the browser
  brings it back from its page cache, the button comes back too.
- **Anything missing or stale falls back to the earlier path.** The press then waits for the
  Starting Point, makes the claim if it is not fresh, and sends the sign-in request, exactly as
  before.
- **Log in.** The same applies on `/login` for a tab that already holds the access proof (the
  person continued under the "By continuing…" line in the Programme): the address is prepared, and
  for a Starting Point made in the tab the claim is kept ready. **Nothing is affirmed behind the
  screen:** for anyone else the press itself affirms access, as before, and then starts Google. The
  Log in button already showed "Opening Google…" while busy.

## The server boundary

`isAllowedGoogleSignInRequest` rejected any body key outside `provider`, `callbackURL`,
`errorCallbackURL` and `requestSignUp`. It now also accepts `disableRedirect`, and only the literal
`true`. Every other key and value is refused as before, including scopes, ID tokens, additional
data and arbitrary callbacks; a `/login` callback pair still cannot create a social account; the
linking allow-list is unchanged. The signed access proof is still required.

`disableRedirect` gives the caller nothing new. The server's answer has always carried the Google
address in its body; with the flag it omits the `Location` header and says `redirect: false`.

## Not changed

- What Google receives. A test sends both requests to the installed library and compares the two
  addresses: only the per-request state and PKCE challenge differ.
- Callback addresses, the consent wording, the email opt-in, the order answer → result → save.
- The kinds of data stored, tables, columns and enums. There is no migration.
- Tracking. Nothing is recorded about the preparation.

## Consequences

- **More short-lived sign-in state.** Each preparation writes one Better Auth state row (10
  minutes, no personal data, removed by the library at the next lookup) and replaces the state
  cookie, also for people who never press Google: at most one every 45 seconds while the screen is
  visible and was touched in the last 15 minutes.
- **More claim requests.** Each renewal repeats the two claim requests a press sent: it replaces
  the claim token and moves the anonymous session's last-activity time. That is 5 requests per 10
  minutes against a limit of 60 per session.
- **Two visible windows of one browser** on the registration screen or Log in replace each
  other's sign-in state. The press in the window that asked earlier returns with the existing
  "Google account access was not completed" text and can be repeated. A hidden tab is handled.
- **A press in the first half second** after the screen appears, or during a renewal, waits for
  that request.

## Not chosen

- **Feedback only**, leaving the three requests on the press.
- **Keeping the address across reloads** in the tab's storage. A stored address can outlive the
  sign-in state it belongs to; a reloaded screen asks for a new one instead.

## Evidence

- `tests/google-press.test.ts` (in `auth-comms:test`, part of `ci:quality`): the freshness windows
  against the installed library's 300-second state cookie, the claim's 30 minutes and the access
  proof's 60; what counts as a prepared address; a prepared press sends nothing; renewal at 45
  seconds and never used at 60; requests never overlap and a press waits for one in flight; the
  claim renewed at 4 minutes, made once when missing, and not ready while it is being made; failure
  and the 30-second rest; hidden, shown again, held, untouched and left screens; the remembered
  claim across the Founder's 12- and 19-second returns; Log in prepares only with an existing
  proof; the server boundary; the installed library answering a prepared request with the same
  Google address and no redirect.
- `tests/program-ai-structural.test.ts` (in `programme:test`, a step of the Quality job): the
  press answers first, takes the prepared address without waiting, falls back to the unchanged
  earlier request, restores the button on failure; the preparation is the same request with the
  redirect off; the address is not written to storage; no timer in a hidden tab.
- `tests/auth-comms-browser.spec.ts` (Build / Browser): "a claim a press had to make is
  remembered, so the next press does not make it again" runs in CI. Four tests need the Google
  button and run only with `EXPECT_GOOGLE_AUTH=true` and placeholder Google credentials, like the
  other Google tests of that file; **CI does not set them, so CI skips these four**: a press leaves
  for the prepared address with no new Programme or sign-in request, the button is off and reads
  "Opening Google…" in the next turn of the event loop and a second press opens nothing; the
  fallback sends exactly the earlier sign-in request and reuses the claim; back from Google the
  next press makes no claim; Google on Log in leaves with what was prepared.

## Open

- **Not verified with real Google.** The Founder's own walk on Production after release is the
  check: press → Google opens at once → return → the plan.
- The Google-gated browser tests are not part of CI (see above).
