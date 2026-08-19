# GB Commercial Activation Gate

- **Decision date:** 19 August 2026
- **Status:** CONTROL FRAMEWORK COMPLETE — ACTIVATION OFF
- **Owner:** Commercial / Legal / Editorial / Engineering

## Decision

No real GB commercial or referral action is authorised. Public affiliate copy can be approved without enabling a route. Activation requires every authority below, a separate reviewed release change and exact-SHA Preview evidence. Missing, unknown, stale or inconsistent evidence denies the action.

## Evidence classification

### Detected

- GB jurisdiction policy denies commercial and referral use.
- `AFFILIATE_REDIRECT_ENGINE_ENABLED` must equal exact `true`; the repository default is `false`.
- Exact-domain regulator evidence is repository-controlled and `gbCommercialDomainEvidenceRecords` is empty.
- Readiness composes partner agreement, programme, operator/brand, offer, exact domain/licence, tracking, bonus terms, redirect contract and jurisdiction authority on the server.
- Public offer/profile services remove action details unless all required authorities pass.
- Programme, Help, pause, self-check and vulnerability modules/data are excluded from ranking, readiness and routing.
- Demonstration records are fictional, review-only, noindex/schema-restricted where applicable and cannot produce an outbound route.
- A legacy mapping defect inferred `VERIFIED` from `lastVerifiedAt`; RFC-036 changes legacy evidence to `UNKNOWN` unless an explicit evidence record supplies status.

### Inferred

- Current implementation has independent containment at jurisdiction, configuration, evidence-store, service and redirect layers. A copy or CMS status alone cannot activate GB traffic.
- Operator licence status and domain relationship must be checked against the current Gambling Commission register; a timestamp or operator-supplied field is insufficient.

### Planned

- Add a real partner/evidence record only after contract, due diligence, legal review and a separately approved activation change.
- Run a real-record Preview rehearsal with synthetic/non-clickable destination evidence before any live route is considered.

### Not detected

- Real GB partner agreement, approved operator/brand, exact active UKGC domain evidence, live offer authority, approved tracking destination, complete significant conditions or a legal activation approval.

## Cumulative activation checklist

Every item must pass at request time:

1. **Separate release authority:** approved activation RFC/change, named approvers, exact SHA and rollback owner.
2. **Jurisdiction:** exact GB request decision permits both `commercialAllowed` and `referralAllowed`.
3. **Global kill switch:** exact `AFFILIATE_REDIRECT_ENGINE_ENABLED=true` only in the authorised environment.
4. **Partner agreement:** active/effective/current written agreement, GB market, direct-link channel, correct legal identity, commercial model, evidence reference, reviewer and termination/compliance clauses. Network authority does not prove operator authority.
5. **Programme authority:** active/published/manual or securely connected; exact casino link; GB supported; no trusted auto-activation.
6. **Operator/brand:** structured IDs and legal identities match partner, casino and licence relationships.
7. **Licence/domain:** explicit evidence status, active/current licence, exact account reference, exact domain in the official Gambling Commission register, source URL, observed date and revalidation date. `UNKNOWN` never becomes `VERIFIED` from a date.
8. **Offer:** active/effective, exact casino/bonus, explicit GB allow; no inferred global eligibility.
9. **Tracking:** server-owned safe HTTPS destination, active/current link, explicit GB allow, recent check, no credential/unsafe URL and approved slug.
10. **Bonus/significant conditions:** complete eligibility, deposit, wagering basis, game/market exclusions, stake/odds, deadlines, payment/withdrawal and full-terms link; current source evidence.
11. **Public copy:** adjacent affiliate/advertisement label, commission boundary, 18+/financial-risk/eligibility wording, full terms and outbound confirmation.
12. **Privacy:** no Programme/Help commercial use; provider/affiliate transfer assessment updated if personal data or tracking is introduced.
13. **Testing:** unit/structural/browser tests prove all deny paths, exact-domain matching, no open redirect, no demo action and protected-data firewall.
14. **Operational readiness:** monitoring, incident/correction route, evidence expiry job, manual kill procedure and post-deploy read-only smoke.

## Release and rollback

- Current action: leave jurisdiction and referral denied, keep redirect engine off and keep domain evidence empty.
- Activation cannot be bundled into this legal-copy PR and cannot be inferred from Founder approval of the documents.
- Any failed or expired authority removes the action. Emergency rollback disables the global switch; policy/evidence denial remains independent containment.
- No commercial action may be personalised from age confirmation, identity provider, Programme, Help, pause, self-check, vulnerability or consent data.

## Primary sources

- [Gambling Commission LCCP 1.1.2 — responsibility for third parties](https://www.gamblingcommission.gov.uk/licensees-and-businesses/lccp/condition/1-1-2-responsibility-for-third-parties-all-licences)
- [Gambling Commission — public business register](https://www.gamblingcommission.gov.uk/public-register/businesses)
- [Gambling Commission — affiliates or third parties](https://www.gamblingcommission.gov.uk/licensees-and-businesses/guide/page/affiliates-or-third-parties)
- [ASA/CAP — free bets, bonuses and significant conditions](https://www.asa.org.uk/advice-online/gambling-betting-and-gaming-free-bets-and-bonuses.html)
- [CAP Code Section 16 — gambling](https://www.asa.org.uk/type/non_broadcast/code_section/16.html)
