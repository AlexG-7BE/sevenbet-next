# Founder Header + Home Responsive Review

## HEADER CTA LABEL SOURCE

`account.primaryLabel` is the only rendered label source for the primary desktop and mobile Programme header actions.

## ANONYMOUS LABEL

`Start Programme` on desktop and mobile.

## AUTHENTICATED LABEL

`My Programme` on desktop and mobile.

## MOBILE MENU ICON

Icon-only 24px three-line inline SVG using `currentColor` inside a 44×44px button. The button retains `aria-label="Open navigation"`, `aria-controls`, `aria-expanded`, keyboard focus, and theme inheritance.

## MOBILE CLOSE ICON

Icon-only 24px inline SVG X using `currentColor` inside a 44×44px button. The button retains `aria-label="Close navigation"`, Escape handling, focus restoration, and document scroll lock.

## DESKTOP HOME CLOSING MODE

The final CTA remains height-coordinated with the one real `PublicFooter`, forming one closing composition at 1024/1280/1440px.

## MOBILE HOME CLOSING MODE

The final CTA is an independent `100svh` narrative section. It is not footer-height-coupled; the real `PublicFooter` follows in document flow. Its coarse-pointer snap stop is normal rather than terminal, and the footer bottom remains the later reachable endpoint.

## PUBLIC FOOTER COUNT

Exactly one real `PublicFooter`.

## PASS / FAIL

PASS — 28/28 focused browser checks passed. Anonymous/authenticated label parity, icon controls, 360/375/390/412/430px header geometry, desktop Home closing composition, mobile CTA separation, footer reachability, document bottom, upward scrolling, single-footer ownership, and no-overflow assertions are green.
