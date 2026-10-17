/**
 * The main site's `favicon.ico`, as bytes, so that `/favicon.ico` can be a route handler
 * instead of a file convention (RFC-057 §12).
 *
 * **Why it is not a file any more.** A `favicon.ico` file in `app/` makes Next write
 * `<link rel="icon" href="/favicon.ico">` into *every* document, on both hosts. On the help
 * host that is the B4GAMBLE mark the Founder took off this site (Q2), and the phase-2 Firewall
 * rule denies every `.ico` path there, so the help site would ask the browser for an icon it
 * cannot have. The handler at `app/favicon.ico/route.ts` serves exactly these bytes on
 * `b4gamble.com`, at the same address as before, and the root metadata names the file only on
 * that host.
 *
 * The bytes are unchanged: this is `app/favicon.ico` of 17 October 2026, base64-encoded
 * (1820 bytes). Replacing the icon means replacing this constant.
 */
export const MAIN_FAVICON_ICO_BASE64 =
  "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"
  + "0FI+ond6uoUAAAAASUVORK5CYII=";
