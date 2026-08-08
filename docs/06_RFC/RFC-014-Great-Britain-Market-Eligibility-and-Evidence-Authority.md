# RFC-014 — Great Britain Market Eligibility and Evidence Authority

## Status

Approved by Founder Office on 2026-08-08 through the GB-MARKET-01 execution authorisation.

## Decision

SevenBet will activate the existing server-side `JurisdictionResolver` as the only market authority for public commercial presentation and every outbound handoff. The first repository-controlled market policy is Great Britain online casino:

- country lookup identity: `GB`
- market ID: `gb-online-casino`
- jurisdiction ID: `great-britain`
- state: `SUPPORTED`
- editorial capability: allowed
- commercial capability: not active
- referral capability: not active

GB market support does not authorise a commercial launch. COMM-01 must supply real partner authority and destinations, and LEGAL-02 must supply final external legal/compliance approval. Until both close and the policy is separately changed, no operator can receive a public commercial or referral action.

This RFC implements the approved first-market vertical slice of [RFC-001](./RFC-001-Jurisdiction-and-Market-Resolution.md). It does not approve the larger persistent market/regulator model proposed there. Repository-controlled typed policy is the smallest safe authority for one non-commercially activated market.

## Governing boundaries

- [Product Vision & Principles](../Product-Vision-and-Principles.md) remains primary.
- RFC-012's fictional Production data exception is unchanged and not expanded.
- Editorial review visibility remains independent from commercial/referral capability.
- Programme, Protected Help, Self-Check, Limit Tracker, XP, streaks and other private/safety-sensitive data are prohibited inputs.
- No client state, query, route, locale, language, currency or user-selected market may grant commercial/referral permission.
- An administrative override may deny; it may not force allow or bypass policy, location, licence, domain or partner evidence.
- No dependency, Prisma schema, migration, seed, real operator, real destination or affiliate activation is approved.

## Official evidence and operational freshness

Facts used by this decision were checked on 2026-08-08 against current primary sources:

| Evidence | Official source | Fact used | Recheck by |
| --- | --- | --- | --- |
| GB market/licence activity | [Gambling Commission — Remote casino operating licence](https://www.gamblingcommission.gov.uk/licensees-and-businesses/licences-and-fees/remote-casino-operating-licence) | A remote casino operating licence is the relevant Commission licence for offering online casino games to consumers in Great Britain. | 2026-09-07 |
| Licence authority | [Gambling Commission — Public Register](https://www.gamblingcommission.gov.uk/licensees-and-businesses/page/public-register) | The register contains businesses holding operating licences issued by the Commission and regulatory actions. | 2026-09-07 |
| Domain verification | [Gambling Commission — Full business register](https://www.gamblingcommission.gov.uk/public-register/businesses/full) | The official register supports search by business, trading name, domain name or account number and distinguishes remote/casino activities. | 2026-09-07 |
| Statutory remote-licence form | [Gambling Act 2005, section 67](https://www.legislation.gov.uk/ukpga/2005/19/section/67) | A remote operating licence must state that it is remote and authorises remote gambling or activity by remote communication. | 2026-09-07 |
| Online age/identity boundary | [Gambling Commission — Age, ID and financial verification](https://www.gamblingcommission.gov.uk/public-and-players/guide/age-and-id-verification) | Online gambling businesses must verify age and identity before gambling; SevenBet does not perform operator KYC in this workstream. | 2026-09-07 |
| Request country signal | [Vercel — Request headers](https://vercel.com/docs/headers/request-headers) and [Vercel — Geolocation IP headers](https://vercel.com/kb/guide/geo-ip-headers-geolocation-vercel-functions) | Vercel deployments provide `x-vercel-ip-country`; local development does not. The value is a request-local IP-derived country signal, not residence, age or operator eligibility. | 2026-09-07 |

The code-backed policy is checked for no more than 30 days. At or after `validUntil`, commercial and referral remain denied; editorial may remain available only because the policy explicitly allows it. Licence evidence used for future eligibility must have an `observedAt` no more than seven days old and an unexpired evidence/licence window. These are SevenBet operational controls, not claims that a regulator mandates those exact intervals.

## Location authority

The trusted request input is only a valid `x-vercel-ip-country` value received while the runtime is positively identified as a Vercel deployment through exposed Vercel system configuration. Preview and Production use the same adapter. Local development, CI, missing system configuration, missing/invalid headers and non-Vercel requests resolve to unknown location. Raw IP, city, coordinates, cookies and location history are neither read nor stored.

The authority order is:

1. current trusted request-country observation and freshness;
2. conflict detection against account/declaration context;
3. current repository policy for the trusted country;
4. server administrative deny after policy resolution;
5. operator/content/commercial evidence;
6. current redirect contract and server-owned destination.

Account country remains unavailable because the repository has no verified account-country authority. User selection and route country remain editorial preferences only.

## Capability formulas

```text
FINAL_COMMERCIAL_ALLOWED =
  JURISDICTION_COMMERCIAL_ALLOWED
  AND OPERATOR_CONTENT_COMMERCIAL_CONTRACT_ALLOWED

FINAL_REFERRAL_ALLOWED =
  JURISDICTION_REFERRAL_ALLOWED
  AND OPERATOR_CONTENT_COMMERCIAL_CONTRACT_ALLOWED
  AND REDIRECT_CONTRACT_ALLOWED
```

There is no OR fallback. A positive legacy offer, link, slug or action cannot override a jurisdiction or evidence deny.

## GB operator evidence contract

The existing `Casino`, `CasinoCountry`, `CasinoLicense`, `CasinoLicenseEvidence`, `AffiliateProgram`, `AffiliateOffer`, tracking-link and redirect-slug records remain source facts. Runtime eligibility must keep the following layers distinct:

1. published, non-suspended casino/operator/brand identity;
2. a `CasinoCountry` row for `GB` with `AVAILABLE` state;
3. an applicable active Gambling Commission canonical licence;
4. `VERIFIED`, official-source, current licence evidence;
5. exact official-source host validation (`gamblingcommission.gov.uk` or its subdomains over HTTPS);
6. current evidence and licence expiry windows;
7. machine-provable casino-domain coverage by that official evidence;
8. an active, published, connected commercial program supporting `GB`;
9. an active, in-date GB-compatible offer and tracking link;
10. an active internal redirect slug and server-owned safe destination.

Missing, unknown, restricted, expired, suspended, revoked, stale, unverified, unofficial or conflicting state denies the affected commercial/referral capability.

The current schema has no explicit machine-readable licence-to-domain relationship. Free-text or a self-asserted `VERIFIED` flag is not sufficient. Runtime therefore reports domain evidence missing and denies commercial/referral eligibility until COMM-01 supplies an approved evidence representation. This RFC does not invent a string convention or add a schema field merely to produce a passing result.

The accepted normalized regulatory authority values are deliberately narrow: `Gambling Commission` and `UK Gambling Commission`, normalized by exact case/spacing/punctuation rules. Substring matching such as `authority.includes("UK")` is prohibited.

## Entry-point enforcement

| Entry point | Editorial outcome | Commercial/referral authority | Deny behaviour |
| --- | --- | --- | --- |
| `/casinos` | Published reviews and declared market filters remain available | Request jurisdiction AND operator/offer/action evidence | Review-only cards |
| `/casino/[slug]` | Published review remains available | Request jurisdiction AND operator/action evidence | Existing unavailable action |
| `/bonuses` | Published terms remain available | Request jurisdiction AND operator/offer/action evidence | Review-only offer |
| `/best-offers` | GB editorial shortlist may remain visible | Request jurisdiction AND operator/offer/action evidence | No outbound action |
| `/compare` | Declared-context comparison remains editorial | Request jurisdiction AND operator/offer/action evidence | Commercial action unavailable |
| `/r/[slug]` | Not applicable | Re-evaluates current request policy, operator evidence, partner state, redirect and destination | `/outbound/unavailable`; no substitute |
| `/go/[slug]` | Not applicable | No independent external authority remains | `/outbound/unavailable` |
| Public casino/bonus APIs | Published editorial projection remains available | Default deny unless an internal current authority projection is explicitly supplied | Affiliate action fields unavailable |

All request-dependent routes remain dynamic. No positive market decision is cached or accepted from a previous render. `/r` always uses the current request time and rechecks after navigation.

## Administration and kill switch

Existing admin casino fields can edit legacy licence/country facts but cannot establish the complete GB runtime evidence contract. A legacy verification checkbox or timestamp cannot create canonical verified evidence, official-source validity or licensed-domain coverage.

The existing server administrative `forceCommercialDeny` contract remains deny-only. Policy states `SUSPENDED` and `RESTRICTED` also deny. No force-allow control plane or Market Policy CMS is introduced.

## Diagnostics and privacy

Redirect-boundary diagnostics may record only entry point, decision ID, normalized country, market, policy version, reason and capability booleans plus safe internal entity IDs. They must not record raw IP, session/auth tokens, cookies, destination URLs, affiliate secrets or Programme/private/safety content. Ordinary editorial requests do not require per-request log noise.

## Rollout and rollback

The first deployed policy intentionally resolves a trusted GB request to editorial allowed, commercial denied and referral denied. Unsupported, unknown, conflicting, stale and failed contexts also deny commercial/referral. Commercially eligible operators are therefore zero regardless of the current data inventory.

Rollback is an application rollback or an immediate repository policy state change to `SUSPENDED`; neither may restore legacy permissive fallback. `/go` must remain non-commercial after cutover. A later permissive policy change requires a separate approved decision showing COMM-01, LEGAL-02, operator/domain evidence and operational gates are complete.

## Acceptance

GB-MARKET-01 is implementation-complete only when deterministic tests prove trusted GB resolution, unknown/conflict/unsupported/stale/restricted/suspended/admin-deny behaviour, user-filter non-authority, official-source validation, evidence freshness, domain-evidence denial, editorial/commercial separation, redirect-time recheck and the absence of a `/go` or legacy OR fallback. The workstream PR is not merged by the implementing agent.
