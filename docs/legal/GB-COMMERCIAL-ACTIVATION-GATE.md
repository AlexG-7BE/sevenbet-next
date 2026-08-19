# GB Commercial Activation Gate

- **Decision date:** 19 August 2026
- **Status:** COMMERCIAL PARTNER: NOT YET ACTIVE
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

## First-partner activation checklist

Every item must pass cumulatively; missing, unknown, stale or inconsistent evidence denies the action:

1. **Real affiliate/operator approval or agreement:** current written authority for the actual legal counterparty, GB channel and commercial model; network access alone is insufficient.
2. **GB permission:** server-owned jurisdiction policy explicitly permits both commercial and referral use for the request.
3. **Operator identity:** legal operator, brand, partner and internal structured IDs reconcile exactly.
4. **Current UKGC licence/domain evidence:** active licence/account and the exact destination domain are checked against the current Gambling Commission register with source, observed date and revalidation date; `UNKNOWN` never becomes `VERIFIED` from a timestamp.
5. **Real current offer:** active/effective offer for the exact operator and GB audience; no fictional, expired or inferred-global eligibility.
6. **Exact tracking destination:** server-owned safe HTTPS destination, approved slug, current check, no credential or open-redirect path.
7. **Significant offer terms:** eligibility, deposit, wagering basis, exclusions, stake/odds, deadlines, payment/withdrawal restrictions and direct full-terms link are complete and current.
8. **Affiliate disclosure:** adjacent commercial label, commission statement, 18+/financial-risk/eligibility wording and outbound confirmation appear before the action; Programme/Help data remains excluded.
9. **Preview validation:** exact-SHA focused unit/structural/browser checks prove allow and deny paths, exact-domain matching, no demo action, protected-data firewall and destination behaviour.
10. **Founder activation approval:** a separate reviewed activation RFC/change names the approvers, environment and exact SHA. This legal-copy PR provides no such approval.
11. **Kill switch and rollback:** the global switch, independent policy/evidence denials, monitoring, manual kill procedure, rollback owner and post-deploy read-only smoke are ready.

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
