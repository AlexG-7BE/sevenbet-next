# GA4 event `partner_click` for partner buttons

**Status:** ACCEPTED — built on 16 October 2026 in branch `feat/ga4-partner-click`.
[CURRENT_STATE](../CURRENT_STATE.md) records it as "in review" until it is merged, deployed and
observed on Production.

**Decision authority:** explicit Founder decision, 15 October 2026 — the Founder's choice in the
affiliate traffic audit («выбор Фаундера в аудите партнёрского трафика»), item 9: count partner
button clicks in GA4.

Ordinary analytics work: no RFC, no database change, no migration, no change to the consent
rule, the first-party product analytics, any offer or partner route.

## Why

**DETECTED:** GA4 saw no partner click. Every partner button opens our own `/r/<slug>` route in
a new tab, and GA4's enhanced measurement counts only links to another domain as outbound.

## What changes

- `productAnalyticsClient.outboundIntent` (called by `GovernedCommercialAction` on click, before the
  new tab opens) also calls `sendGooglePartnerClick` (`lib/analytics/google-analytics.ts`):
  `gtag('event', 'partner_click', { casino, placement, market, transport_type: 'beacon' })`.
- `casino` is the casino slug and `market` the visitor's market the button was shown for; both are
  passed by the call sites (review page, casino list, Best Offers, Bonuses, offer creatives).
  `placement` is `<source>_<placement>`, the same value the product event and the `/r/` route use.
- **Consent:** exactly the Google tag's rule. Nothing is sent after "Reject cookies" (the
  `v1.denied.` consent cookie), nothing from protected Help, the self-check or Admin, and nothing
  when the tag is not on the page (previews, local runs, staff-marked devices).

## Founder action

In GA4 Admin → Events, mark `partner_click` as a key event once it has arrived (GA4 lists an event
only after it has been received).
