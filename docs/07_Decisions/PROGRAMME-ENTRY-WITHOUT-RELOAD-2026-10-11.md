# The Programme opens without a document load

**Status:** ACCEPTED; **PROPOSED — NOT YET LIVE** until merged and deployed

**Decision authority:** explicit Founder choice, 11 October 2026. Offered three options after the
measurements below (open the Programme without a reload and fetch it ahead of the tap; remove the
reload in both directions after two repairs; leave everything), the Founder chose "Только вход +
подгрузка". Asked separately whether to repair the Home and Learn stylesheets, the Founder chose
"Да, отдельным PR"; that repair is not part of this record.

**Supersedes in part:** RFC-029's document boundary between public pages and the Programme, for
the direction into the Programme. It extends
[INSTANT-NAVIGATION-2026-10-04](INSTANT-NAVIGATION-2026-10-04.md): the Programme joins the
destinations fetched ahead of the click.

## Why

Since RFC-029 every same-origin link between a public page and the Programme has loaded a fresh
document. The reason was the Programme's own `Permissions-Policy: microphone=(self)`: a response
policy binds to the top-level document. Voice input was retired on 11 October 2026
([ONE-SIGN-IN-FORM-2026-10-11](ONE-SIGN-IN-FORM-2026-10-11.md), Part 3) and every page now sends
the same deny-all policy, so the policy no longer needs the load.

Starting the Programme is the site's primary action, and the Founder's bar for a page change is
0.1–0.3 s. A document load cannot use a page fetched ahead of the click; a client transition can.

## What was checked first

On a local production build of the commit that retired voice, the boundary was switched off in the
browser and every crossing compared with the document load.

**Into the Programme one thing depended on the document: the cookie choice.** It lives in the
root layout, which a client transition keeps mounted, so a choice that had opened by itself on the
public page would have followed the visitor onto the Programme's first screen
([ANALYTICS-CHOICE-AUTO-OPEN-2026-09-25](ANALYTICS-CHOICE-AUTO-OPEN-2026-09-25.md) keeps it out of
the Programme). The browser checks did not show this at first, because the automatic choice never
opens under browser automation unless a test asks for it; reading the component did. It is handled
in this change (see the decision).

Everything else was the same with and without the document: `<html lang>` (Great Britain, Germany,
Spain and Peru), focus on the Programme screen, the page at its top, one header and one footer,
the drawer closed, no Home stylesheet or scroll-snap rule left behind, the first-party
`page_viewed` events and their `locale`, the Programme state kept in `sessionStorage` restored on
return, and a clean console. Google Analytics does not load on a local build and was not checked.

**Out of the Programme two things depend on it.**

- **The page language.** `<html lang>` is set by the root layout, which is not rendered again on a
  client transition. A visitor whose country has no published market (checked from the United
  States and Ireland) gets the Programme's menu in their own language: from `/es/program` or
  `/de/program` it leads to `/en/learn`. Without the document load that English page kept
  `lang="es-ES"` or `lang="de-DE"`. Every other language change on the site is already a document
  load.
- **The stylesheets of Home and the Learn hub.** Both carry their stylesheet in a `<style>` under
  the nonce of the request that rendered them. On a client transition that nonce is not the
  document's, and the browser blocks the stylesheet. This already happens today on any client
  arrival (Learn → logo → Home): on a phone Home shows the full-screen pinned chapters instead of
  the compact cards (8199 px tall instead of 6210 px), and on desktop it loses its paged scroll.
  The document load on the way out of the Programme is the one path that always gives Home its
  stylesheet.

**A client transition alone is not faster.** The Programme's code is not in the browser of
someone on a public page, so without a fetch ahead the first Programme screen appeared later than
with the document load (see the table).

## Decision

- **Into the Programme: a client transition.** A link from a public page to the Programme in the
  page's own language no longer loads a document.
- **The Programme is fetched ahead of the tap.** The header and drawer button ("Start Programme" /
  "My Programme") is a primary destination: its page loads in the background once the current page
  has settled. Home's hero button has the same address and opens from the same fetch. Every other
  link into the Programme, whichever page or block rendered it, loads on a mouse hover, a touch or
  keyboard focus. The button itself no longer prefetches (`prefetch={false}`), like the other
  links of the public shell.
- **Out of the Programme: a document load, as before**, for the two reasons above.
- **Into the Programme in another language than the page's: a document load.** No public page
  links that way today; the rule keeps `<html lang>` right if one ever does. Nothing is fetched
  ahead for a link that loads a document.
- **One request per tap.** A Home link that loads a document no longer also starts a client
  transition. Before this change a tap on Home's hero button sent the server both a document
  request and a client-router request for the Programme.
- **The automatic cookie choice stays out of focused flows.** A choice that opened by itself on a
  public page is not shown once the visitor is in the Programme, Help or sign-in; nothing is
  recorded, and it is back on the next public page. A choice the visitor opened themselves stays
  open, and the footer control opens it inside the Programme as before.

Sign-in and sign-out are unchanged: both still end with a document load
(`window.location.assign`), so account state in the header is always drawn from a fresh request.

## Measurements

Local production build, PostgreSQL 16 on the same machine, Chromium, Pixel 7 viewport, median of
five runs, in seconds from the tap. "First screen" is the first Programme screen on the page;
"ready" is the start screen ("What feels hardest right now?") on screen and usable. "Phone" is an
emulation: processor four times slower, 150 ms added to every request, 9 Mbit/s down. In the first
and the last column the tap came 3.7 s after the page had loaded and hydrated.

| Into the Programme | Document load (before) | Client transition, nothing fetched ahead | This change |
|---|---|---|---|
| Home hero button, phone: first screen / ready | 0.55 / 0.95 | 0.83 / 0.94 | 0.46 / 0.49 |
| Learn header button, phone: first screen / ready | 0.49 / 0.94 | 1.02 / 1.13 | 0.54 / 0.59 |
| Home hero button, no slowdown: first screen / ready | 0.17 / 0.23 | 0.23 / 0.25 | 0.14 / 0.15 |
| Learn header button, no slowdown: first screen / ready | 0.17 / 0.23 | 0.16 / 0.18 | 0.14 / 0.15 |

The middle column was measured before the change, with the boundary switched off in the browser
and the tap 1.2 s after load; it shows why the fetch ahead is part of the decision. Leaving the
Programme is unchanged code and still a document load: logo → Home 0.41 s with no slowdown and
0.99 s on the phone emulation, menu → Learn 0.10 s and 0.31 s.

A tap that comes before the fetch ahead has finished behaves like the middle column.

On a local build the server is on the same machine. In Production functions and the database run
in the United States, which adds a round trip to every request that is not fetched ahead; the
fetch ahead removes exactly that request from the tap.

## Consequences

- A settled public page view adds one background render of the Programme page, next to the
  primary destinations. That render reads the visitor's presentation and the commercial state for
  the header; it writes nothing and starts no Programme session.
- A tap that comes before the fetch has finished waits for the rest of that response, with the top
  progress bar. On the phone emulation the first Programme screen then appears later than it did
  with the document load (0.83 s against 0.55 s); the usable start screen arrives at the same time.
- Back from the Programme returns to the public page from the browser's memory instead of
  reloading it.
- The Programme page fetched ahead is kept for five minutes (`staleTimes.static`), like the other
  destinations. It holds no account data: the Programme reads the session, access and progress
  from the server after it opens.

## Not chosen

- **Removing the document load in both directions.** It needs the stylesheet repair and a way to
  keep `<html lang>` right first, and the stylesheet repair changes how Home receives its styles.
- **A client transition without the fetch ahead.** Measured slower to the first Programme screen
  than the document load.
- **Leaving the boundary as it was.**

## Evidence

- `tests/programme-document-boundary-browser.spec.ts` (Build / Browser): on a phone and a desktop
  viewport the header button, Home's hero button and the drawer button open the Programme with no
  document request and one fetch made ahead of the tap; focus is on the Programme screen, the page
  is at its top, `<html lang>` is right, nothing of the public page stays behind and the microphone
  stays denied; Back returns to Home with its stylesheet. A cookie choice that opened by itself on
  Home is gone on the Programme screen, records nothing, and the footer control still opens it
  there. Leaving the Programme loads a document (`/es/program` → `/en/learn` arrives with
  `lang="en-GB"`, the logo arrives at Home with its stylesheet), and so does a link into the
  Programme in another language than the page's.
- `tests/programme-internationalisation.test.ts` (in `programme:test`): the rule
  `programmeCrossingNeedsDocument` for every Programme language, legacy addresses and a page in
  another language.
- `tests/public-shell.test.ts` (in `public-ia:test`): the Programme button is a primary
  destination, every link into the Programme loads on intent, and a link that loads a document is
  never fetched ahead.
- `tests/customer-data-analytics-lifecycle-structural.test.ts` (in `customer-data-core:test`): an
  automatic cookie choice is not rendered on a focused-flow page.
