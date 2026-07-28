# Architectural Principles

## Constitutional priority

Architecture exists to make the Product Vision enforceable in ordinary product work. It must preserve user agency, Regulation First, facts over persuasion, transparent commercial relationships, and a valid choice to pause or not play. A technically convenient design is invalid if it weakens those outcomes.

## Principles

1. **Policy precedes promotion.** Every user-visible commercial capability is constrained by market eligibility, safety, disclosure, and publication policy before it can be rendered or activated. A client-side label or route-level convention alone is not an enforcement boundary.
2. **Fail closed for commercial action.** Missing, stale, conflicting, unapproved, or unknown eligibility means no referral and no implied availability. Non-commercial education may remain available only when its scope is clear.
3. **Jurisdictional scope is a first-class scope, not a filter.** A legal jurisdiction is the scope in which a rule, licence, age threshold, disclosure, or support obligation applies; it is not assumed to be identical to a country. A market is SevenBet's deliberately supported product scope and may comprise one or more legal jurisdictions. Country is geographic context only, and location evidence is an input with confidence—not legal eligibility. Every governed decision carries its applicable jurisdictional scope and market context. Data or decisions from one scope cannot be treated as globally valid by default.
4. **Domain ownership is singular.** Each business fact has one owning module and one accountable lifecycle. Other modules consume a published contract rather than edit, infer, or duplicate the fact.
5. **Editorial, commercial, and compliance authority remain separate.** Commercial terms cannot change editorial facts, scores, caveats, or eligibility. Compliance may restrict exposure when confidence is insufficient. Architecture must preserve this separation in data ownership, permissions, workflows, and audit trails.
6. **The product is a decision-support service, not an operator.** No module may accept bets, deposits, withdrawals, funds, or operator-account control. External operators own their gambling services; SevenBet owns only its information, controls, disclosures, and referral handoff.
7. **Evidence travels with consequential claims.** Time-sensitive or market-sensitive claims need source, scope, verification/review context, and uncertainty treatment. Unknown is a valid state, not an invitation to infer.
8. **Control routes are independent of commercial routes.** Support, pause, self-exclusion information, and the Control Program must remain reachable without registration, referral, or completion. Safety-sensitive contexts reduce promotional exposure and never become targeting inputs.
9. **Minimum necessary data and purpose limitation.** Collect, retain, expose, and process personal data only for a stated user benefit, safety requirement, or legitimate operation. Personal data and safety-sensitive context cannot flow to operators or commercial optimisation without the separately informed consent required by the Product Vision.
10. **Every material change is attributable and reversible.** Publication, restriction, eligibility, referral, and permission changes require accountable actors, recorded rationale/evidence, and a safe suspension or rollback path. Emergency action may suspend exposure; it does not erase governance.
11. **Interfaces depend on stable use cases, not storage.** Public UI, admin UI, integration adapters, and reporting consume application contracts. They do not depend directly on database records, ORM types, provider payloads, or another module's internal schema.
12. **Observability measures integrity as well as availability.** Future operations must make stale evidence, policy denials, failed integrations, review backlog, suspension, and user-access failures visible without turning behavioural data into promotional optimisation.
13. **Age eligibility is local and minimal.** The product must not treat “18+” as a universal permission. A referral or other governed commercial action requires a verified applicable age-policy outcome for its jurisdictional scope; unknown, conflicting, or unsupported age requirements fail closed. Age-related collection and retention must be no broader than the approved purpose, and no age data may be repurposed for promotion.

## Decision hierarchy

When constraints conflict, resolve them in this order:

1. Product Vision non-negotiables and applicable law/regulation.
2. User safety, truthful eligibility, and privacy.
3. Editorial independence and evidence integrity.
4. Clear, accessible user experience.
5. Commercial utility, operational convenience, and delivery speed.

## Required architecture decision test

Before implementation of a material capability or exception, its RFC must answer:

- What product decision and user benefit does this support?
- Which domain owns the new facts and lifecycle?
- Which market, compliance, safety, disclosure, and permission policies govern it?
- What happens when evidence is missing, stale, or disputed?
- Can the user pause, leave, or use non-commercial information without friction?
- Which data crosses a boundary, on what contract, and for what purpose?
- How are changes audited, suspended, corrected, and observed?
- Why does the capability remain useful with no referral revenue?

## Baseline alignment

**Detected:** the current repository already contains Next.js route handlers, Prisma-backed repositories, services, auth, domain-specific CMS builders, affiliate routing, and a partial cache. **Target:** those observed patterns may be retained only where they conform to this constitution; they are not themselves approved decisions. The baseline identifies comprehensive jurisdiction enforcement, operational controls, production deployment evidence, and compliance design as unresolved.

## Open Decisions

### ARCH-OD-02 — Canonical jurisdiction and market scope model

Before governed MVP implementation, an RFC must approve canonical identifiers and relationships for legal jurisdiction, market, country, and location evidence; confidence states; user correction and re-evaluation behaviour; and treatment of multi-jurisdiction countries or other non-country legal scopes. Until then, no country, IP-derived location, locale, or market label is sufficient by itself to establish legal eligibility.

### ARCH-OD-03 — Local age-policy architecture

Before implementing age collection, gating, persistence, or commercial exposure, an RFC must define local threshold resolution, the permitted UI gate and unknown-age behaviour, the minimum age-related data required, notice/consent where applicable, retention/deletion, correction, and referral-denial handling. The constraints above apply in the interim.

### ARCH-OD-05 — Safety-sensitive-context policy

Before implementing collection, suppression, persistence, analytics, or notifications based on safety-sensitive context, an RFC must define permissible triggering signals, notice/consent and legal basis, storage and duration, access controls, recovery/reversal, and the prohibition on commercial use. No unapproved safety-sensitive signal may be collected or used as a targeting input.
