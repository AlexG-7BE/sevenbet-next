# The help site is approved: RFC-057 is ACTIVE and phase 1 starts

**Status:** ACCEPTED. This record is the phase 0 gate of
[RFC-057](../06_RFC/RFC-057-Help-Site-on-a-Second-Domain.md) ("answers recorded in a decision
record"). It changes no code by itself: it records the Founder's approval and his answers, and
it is the authority phase 1 builds against.

**Decision authority:** Founder decision, 17 October 2026, in chat: «ок, начинай первый этап»
("ok, start the first phase"), answering the summary of RFC-057 (pull request
[#531](https://github.com/AlexG-7BE/sevenbet-next/pull/531), branch `docs/rfc-help-site`) and the
eight open questions of its §22, each of which was put to him with one recommendation. With that
one word he approved the architecture **and** every recommendation as it was written to him. He
was not asked to repeat the answers one by one, so each answer below states the recommendation he
accepted, not a separate sentence of his.

**What came before:** his decision of 16 October 2026 «Тот же код, второй домен»
([PROGRAMME-NO-CASINO-LINKS-2026-10-16](PROGRAMME-NO-CASINO-LINKS-2026-10-16.md)) and of
17 October 2026 on the two sites
([COMMERCIAL-MENU-FOR-EVERYONE-2026-10-17](COMMERCIAL-MENU-FOR-EVERYONE-2026-10-17.md), part A
live on `main` as pull request #533). `b4gamble.com` is the commercial site with the full casino
menu for every visitor; `pauseplan.help` is the help site, bought by him on 16 October 2026 in the
Vercel team `alexg-7bes-projects` and deliberately not yet attached to the project.

## The approval

1. **RFC-057 is approved and becomes `ACTIVE`.** It is the authority for Production hosts and
   origins: two exact origins, one per site, served by the one Vercel project, with the request
   host classified once from source constants.
2. **Phase 1 starts now** — the code, with every switch off, so the main site behaves exactly as
   before and tests prove it. Phases 2, 3 and 4 follow their own gates in RFC-057 §18.
3. **PR #530 is untouchable.** The Programme shows no casino, offer, bonus, comparison or `/r/`
   link to anyone, on either host, and `app/program/layout.tsx` keeps passing
   `researchNavigation={false}`. Nothing in this approval reopens that.

## His answers, Q2 to Q9

### Q2 — Name: the help site gets its own name, "Pause Plan"

No B4GAMBLE wordmark and no B4GAMBLE logo anywhere on the help site; the point of the split is
that the two sites are not visibly one. `/who-runs-this` still names 7BE Inc. honestly, so the
connection is disclosed in words rather than hidden.

**For the build:** the help host's wordmark, page titles, `siteName`, structured-data `name` and
`logo`, the share image, the letter sender name and the bios read "Pause Plan"; the B4GAMBLE mark
(`public/brand/`, `app/icon.svg`) is denied on the help host and replaced by the help site's own
icon and logo file at its own path.

### Q3 — Analytics: none on the help host, and no cookie banner

Option G3. No Google tag and no cookie banner on the help host; the counts come from what the
server already records. `b4gamble.com` keeps its 4 October 2026 GA4 decision unchanged.

**For the build:** on the help host no Google tag is rendered, no consent banner is shown, the
Google hosts leave the CSP, `/api/consent/analytics` and `/api/analytics/events` are not needed
there, and the owner page may truthfully say the site sets no tracking cookies. Help-site numbers
come from `programme_funnel`, the `social_hit` log line, request logs, the help-link count and
Search Console. This amends RFC-046 §16 for the help host only.

### Q4 — Non-profit entity: not now

Only if a named organisation makes it the condition for working with us.

**For the build:** nothing. No entity, no separate database, no separate accounts in phases 1–4;
the option stays recorded in RFC-057 §16.5 for a later Founder decision.

### Q5 — Help home page: the pause plan is the home page

Option (b). Not the current home layout with a help menu.

**For the build:** `/` on the help host serves the pause plan, in sv, da and en, with the
Programme entry as its main call to action; the `public/home/` folder (hero and chapter images,
tool SVGs) is denied on the help host by the Firewall rule of RFC-057 §4.2. The main site's home
page is not touched.

### Q6 — Sender and contact address: a mailbox on the help domain eventually

Option (b), with (a) acceptable for phase 2: phase 2 may still use the current
`support@b4gamble.com` address, and the mailbox moves to the help domain later.

**For the build:** nothing blocking. Until the move, the one allowed `b4gamble.com` address on the
help site is the `mailto:support@b4gamble.com` link on `/contact`. Moving it is DNS and mailbox
work (Resend records, a Google Workspace alias), not code, and can happen between phases 2 and 4.

### Q7 — The Programme/casino tie in the data: remove it

Option (a). Stop storing the account on new partner presses, and drop the partner-press stages
from the weekly `programme_funnel` count. **Clearing the older rows is a separate data job and is
not part of phase 1.**

**For the build:** new `OutboundClick` rows are written without `userId`; `programme_funnel` stops
returning partner-press stages and stops reading `OutboundClick` beside Programme stages. No
schema change, no migration, no column removed — the field stays and simply receives nothing new.
This amends RFC-046 §7. The older rows keep their account link until the separate data job is
decided and run, and the owner page must say so while that is true.

### Q8 — Google sign-in screen: the current client is fine for phase 2

Option (a) for phase 2, (b) before phase 4: a person signing in on the help host will see
Google's screen naming B4GAMBLE and linking `b4gamble.com`, which is accepted while the help site
is live but not yet announced. A second Google client in its own project, carrying the help site's
own name ("Pause Plan") and its own privacy and terms links, comes before the outreach phase.

**For the build:** phase 1 and 2 add the help origin and callback to the existing Production
Google client; the second client and the host-aware Better Auth client choice are a phase-3/4 item
with their own consent-screen verification.

### Q9 — The home hero link to the Programme: leave it exactly as it is

Option (a). The one Programme link on the home page — the hero call to action — stays where it is
and keeps its wording; after the move it points at the help site. **The desktop homepage is not
changed.**

**For the build:** the home's handoff transform keeps rewriting that one link, and at phase 3 its
target becomes the help origin. Nothing a visitor sees on the home page changes. Because that
transform is the code the do-not-touch rule protects, the change is written and reviewed as
carefully as a visible one, and the home is checked on a phone and on the desktop before and
after.

## What this does not change

- **PR #530** and the Programme's clean shell on both hosts.
- **The desktop home page** of `b4gamble.com` (Q9), its design or its layout.
- **The database schema.** No table, no column, no migration — Q7 included.
- **`b4gamble.com`'s own analytics**: the 4 October 2026 GA4 decision stands there (Q3).
- **Commercial authority**: RFC-042, RFC-047, RFC-049 and RFC-054 are untouched, as is the
  country-block policy.
- Mission order, prerequisites, rewards and XP.

## Consequences

- **Phase 1 is code with the switches off**, so it is reversible by reverting one pull request
  (RFC-057 §19). Nothing a visitor sees changes until phase 2 attaches the domain and phase 3
  moves the routes.
- **Q3 costs the help site its Google Analytics report.** That is the price of being able to say,
  truthfully, that the help site sets no tracking cookies — the sentence the help organisations
  that refused us asked about.
- **Q7 costs the weekly count its partner-press stages.** After 17 October those stages measured
  the commercial site, not the Programme, so the count loses nothing it still needed.
- **Q2 costs the help site the brand recognition of B4GAMBLE**, which is the intended effect: the
  organisations the split is meant to open judge a domain by what it carries.

## Way back

Nothing here is deployed, so there is nothing to roll back yet. The way back from each phase is in
RFC-057 §19. If the Founder reverses the approval before phase 2, reverting the phase-1 pull
requests restores the previous behaviour exactly, and RFC-057 returns to `PROPOSED` with an
amendment recorded here.

## Amendment, 17 October 2026: «убери B4GAMBLE из текстов и перенеси картинки»

A second Founder instruction on the same day, and the final internal authority on both points.
It does not reverse anything above; it finishes Q2 and settles one open question of §4.2.

**The name, in words as well as in marks.** Q2 took the B4GAMBLE wordmark and logo off the help
host. Phase-1 screens then found the name still spoken in the body copy: "Ten steps from the
B4GAMBLE Programme" in the pause plan (and its Swedish and Danish translations), the Programme
consent line, the "Email me B4GAMBLE updates" checkbox, a "B4GAMBLE Help →" link inside a guide
and the shell's "B4GAMBLE home" label. The instruction is that **no help-host response says the
name at all** — not in the rendered text, not in a title, a meta tag, a piece of JSON-LD, an
`alt`, an `aria-label` or the inline data a client navigation fetches.

**How, and why not a second set of translations.** Each string is either made host-aware or
rewritten to wording that is true and natural on both sites, and neutral wording is preferred
wherever it reads as well, because wording that names nobody cannot leak. Host-aware means one
rewrite over the rendered sentence (`withSiteName`, `withSiteNameDeep`), not a second copy of
thirteen translations that would drift: the grammar glued to the wordmark travels with it, which
is what the three published languages need. On `b4gamble.com` the name stays exactly where it is
correct today, and the tests assert that in both directions.

**The pictures.** §4.2's Firewall rule denies every raster image and font on the help host except
under `/_next/static/`, because the middleware matcher never sees those paths. Three live paths
fell under it: the `/10-steps` and `/start` hero, the guides-hub photograph and the tab icon.
The two photographs are **static imports**, so the bundler serves them hashed under
`/_next/static/` — the exception the rule already makes — and the tab icon became a route
handler, which the gate can decide per host. **The rule is unchanged and still a default deny:
no allowance was added for this.** The help site also gets a mark of its own rather than the
B4GAMBLE one, which §12 had already asked for.

**What it costs.** Two sentences on `b4gamble.com` lose the brand name where the neutral wording
was the better answer for both sites (the Programme disclaimer and a handful of Privacy and
protected-Help lines). Nothing else on the commercial site changes, and no visitor to it sees a
different page.

## Evidence

- RFC-057 §22, where each of these eight questions is written out with the recommendation he
  accepted; the section now records the answers.
- RFC-057 §18, where phase 0 is marked done against this record.
- Pull request #531 (branch `docs/rfc-help-site`), which carries the status change, the answers
  and this record.
- `docs/06_RFC/README.md`: RFC-057 is `ACTIVE`, the counts reconciled.
- `docs/CURRENT_STATE.md`: the help site's state, as approved and not yet built.
- The amendment above is built on branch `feat/help-site-own-brand`, with
  `tests/help-site-own-brand.test.tsx` as its guard, in `ci:quality`.
