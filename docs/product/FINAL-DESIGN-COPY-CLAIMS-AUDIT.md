# Final Design Copy and Claims Audit

Audit date: 18 August 2026

Scope: Draft PR #76 and Draft Preview only

Production: unchanged

## Authority and status labels

Runtime/data truth, approved privacy/commercial/Programme contracts and current primary rules override unsupported handoff claims. `SUPPORTED` means repository or primary-source evidence supports the bounded statement. `QUALIFIED` means the runtime wording now states its limit/source/state. `DEMO-ONLY` means the statement or value is explicitly fictional and non-claimable. `UNSUPPORTED` means it must not appear as a material public claim.

## Material claims disposition

| Claim family | Final status | Current runtime disposition |
| --- | --- | --- |
| “Tested with real money”, “our own money”, four-week/three-withdrawal process and similar test assertions | UNSUPPORTED | Removed from active public runtime copy. Reviews describe current evidence, dates and limitations without inventing a test cycle. |
| “50+ casinos”, “200+ hours”, “100% independent”, “hundreds of hours” | UNSUPPORTED | Removed. Best Offers statistics are derived from current inventory mode/count and explicitly show zero live/claim actions for demo inventory. |
| “Updated weekly/continuously”, fixed update date without runtime authority | UNSUPPORTED | Removed. Current DTO/publication dates remain authoritative where available. |
| 24/48-hour response or correction SLA, weekends included | UNSUPPORTED | Removed from active Contact/trust copy. Corrections are reviewed and dated when published; response time is not promised. |
| Fixed 24-month source-record retention | UNSUPPORTED | Replaced with applicable operational/legal retention wording. |
| Immediate/irreversible/one-action deletion or export | UNSUPPORTED | Replaced with Privacy-policy rights-request wording and explicit legal/fraud-prevention/backup retention limits. |
| “Never sell/share”, “nothing sponsored”, “no paid placements” and similar organisation-wide absolutes | UNSUPPORTED without external process evidence | Active runtime uses bounded product controls: disclosed affiliate links, editorial/commercial separation and purpose-limited contact/data language. |
| Affiliate compensation does not determine Editor Score or natural editorial ranking | SUPPORTED as current product control | Used consistently across footer, cards, casino profile, FAQ and disclosure surfaces. It is not expanded into an unproven organisation-wide absolute. |
| Programme and Protected Help data excluded from offers/rankings/ads/commercial personalisation | SUPPORTED | Preserved by architecture, closed event contracts, UI copy and regressions. |
| “Best”, rank, score, offer, licence, payout and material-term values | QUALIFIED / dynamic | Current services/DTOs are authoritative. Missing/unavailable values fail closed; demo records are never presented as current offers. |
| Current Programme free/no commercial upsell inside Missions | QUALIFIED | Copy says the **current Programme** has no paywall/commercial upsell; “forever/ever” promises were removed. |
| Google identity/privacy boundary | SUPPORTED | Google remains identity-only; it is not age verification, marketing permission or commercial profiling. Credential values/tokens are not exposed. |

## Bonus Guide

The article now labels every numerical/operator example as fictional educational material, not a current offer or real-money test. The old “best offers are 10–15×” GB statement is removed. Current runtime states that Great Britain licensees may not impose wagering requirements above 10× the incentive and links the current primary sources:

- UK Gambling Commission, LCCP Social Responsibility Code 5.1.1: `https://www.gamblingcommission.gov.uk/licensees-and-businesses/lccp/condition/5-1-1-sr-code`
- ASA/CAP bonus-significant-conditions guidance: `https://www.asa.org.uk/advice-online/gambling-betting-and-gaming-free-bets-and-bonuses.html`

Worked arithmetic is qualified as simplified theoretical illustration. It explicitly excludes variance, weighting, maximum bets, win caps, expiry and other restrictions, and is not a prediction of individual outcome.

## Demo and commercial inventory

- DEMO-ONLY: fictional operator names, scores, offers, licences, payment/withdrawal fields and illustrative comparison values.
- Detected: demo records expose no governed Visit/claim action and no Compare selection action.
- Detected: Best Offers demo hero states the current fictional record count, `0` live offers and `0` claim actions.
- Detected: commercial actions remain server-authoritative and fail closed when partner, jurisdiction, offer or redirect evidence is absent.

## Privacy, Help and Contact

- SUPPORTED: Programme/Help data is not used for offers, rankings or commercial personalisation.
- QUALIFIED: contact details are used to handle the enquiry and protect the form from abuse; messages do not feed offers or rankings.
- QUALIFIED: data export/deletion is requested through the controller/Privacy route and may remain subject to applicable legal, fraud-prevention and backup retention.
- UNSUPPORTED and removed: immediate response, fixed correction SLA, instant/irreversible deletion, all-data/no-exception and deployed analytics/security absolutes.

## Exact intentional handoff deviations

1. Unsupported or materially misleading claims are not preserved verbatim in the public Draft runtime. They are removed or qualified under the current Founder rule that runtime/evidence authority wins.
2. Best Offers/Casinos/Bonuses/FAQ/Methodology/About/Affiliate Disclosure/Contact/Privacy/Terms/Help/Home/10 Steps use bounded current wording where captured copy asserted unsupported testing, independence, cadence, retention, deletion, security or response facts.
3. Bonus Guide keeps its editorial composition but replaces real-offer/test implications and outdated GB guidance with explicit fictional examples and current primary sources.
4. Dynamic casino/offer names, scores, ranks, terms, availability and destinations always come from current services/DTOs or a fail-closed state. Local visual fixtures alter data only, are denied on Vercel and never replace the real renderer.
5. Programme keeps the approved value-first Mission 01 sequence and Google-primary/email-secondary continuation; it does not restore older clarification/editor/reward screens to match the handoff.

## Release disposition

No active material public claim found in this pass remains classified `UNSUPPORTED`. This code-level claims result is not outside-counsel, privacy-process, ASA/CAP or UK launch approval. External legal/privacy, commercial-partner and operational evidence gates remain open, so the product is **NOT RC READY**.
