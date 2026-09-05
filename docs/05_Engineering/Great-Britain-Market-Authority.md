# Great Britain Market Authority

## Status and scope

Approved by Founder Office on 2026-08-08 through GB-MARKET-01 and governed by [RFC-014](../06_RFC/RFC-014-Great-Britain-Market-Eligibility-and-Evidence-Authority.md).

**Detected:** the repository contains one server-authoritative, repository-controlled policy for the Great Britain online-casino market. It governs commercial and referral projection at public casino, bonus, comparison, action and redirect boundaries. COMM-01 extends its lower commercial evidence chain without changing this policy and adds no Prisma model, migration, seed, dependency, operator, partner or destination.

**Detected:** the initial policy supports editorial content but does not activate commercial or referral capability. **Not detected:** final Legal approval, a real GB partner authority, or machine-readable official evidence that a casino domain is covered by a licence. SevenBet is not GB launch-ready on the strength of this implementation.

## Runtime policy

| Field | Value |
| --- | --- |
| Country lookup identity | `GB` |
| Market ID | `gb-online-casino` |
| Jurisdiction ID | `great-britain` |
| State | `SUPPORTED` |
| Policy version | `gb-2026-08-08.1` |
| Checked at | `2026-08-08T00:00:00.000Z` |
| Valid until | `2026-09-07T00:00:00.000Z` |
| Editorial allowed | `true` |
| Commercial allowed | `false` |
| Referral allowed | `false` |

At or after `validUntil`, commercial and referral remain denied. Editorial remains available only when the evaluated policy explicitly permits it. Policy versions are stable evidence contracts, not deployment IDs.

## Location and decision authority

Authority is evaluated in this order:

1. A current, valid `x-vercel-ip-country` observation is trusted only when Vercel system configuration identifies the runtime as Preview or Production.
2. Trusted-signal freshness and conflicts with account/declaration context are checked; the repository currently supplies no account country.
3. The repository policy for the trusted country must exist, match the country, be current and carry evidence IDs.
4. A server administrative override may deny after policy resolution; it cannot allow or bypass a gate.
5. Casino publication, GB availability, canonical licence, official evidence, domain coverage and partner evidence must all pass.
6. The current internal redirect slug, selected offer/link and stored destination must pass again at handoff time.

Local, CI and non-Vercel requests have unknown location. `country` filters, query parameters, route slugs, locale, language and currency are editorial preferences only. The repository has no verified account-country source, so runtime passes `accountCountry = null`.

The capability composition has no fallback:

```text
FINAL_COMMERCIAL_ALLOWED =
  JURISDICTION_COMMERCIAL_ALLOWED
  AND OPERATOR_CONTENT_COMMERCIAL_CONTRACT_ALLOWED

FINAL_REFERRAL_ALLOWED =
  JURISDICTION_REFERRAL_ALLOWED
  AND OPERATOR_CONTENT_COMMERCIAL_CONTRACT_ALLOWED
  AND REDIRECT_CONTRACT_ALLOWED
```

## Operator evidence contract

Future GB commercial eligibility requires all of the following distinct layers:

1. The casino, operator and brand are not suspended, and the casino is published.
2. `CasinoCountry.countryCode = GB` exists with `AVAILABLE` state.
3. A canonical licence is active, unexpired, scoped to GB/Great Britain, and its normalized authority is exactly `Gambling Commission` or `UK Gambling Commission`.
4. At least one associated `CasinoLicenseEvidence` record is `VERIFIED`, has an observation time, is not expired, and uses HTTPS on `gamblingcommission.gov.uk` or an actual subdomain.
5. Licence evidence is less than seven days old. Seven days is SevenBet's internal operational SLA, not a regulator-prescribed interval.
6. Official evidence proves the exact `Casino.domain` relationship.
7. The affiliate program is active, published, connected, not suspended and supports `GB`; the offer and selected tracking link are active and current.
8. An active internal redirect slug selects a server-owned, revalidated safe destination.

**Detected after COMM-01:** existing licence evidence remains associated with a licence, while [RFC-015](../06_RFC/RFC-015-GB-Commercial-Partner-Authority.md) adds a separate typed repository-controlled exact-domain relationship. Runtime does not interpret free text or an admin-set verification status as domain proof. The real evidence store is empty, so the default authority still denies every commercial/referral action.

## Enforcement matrix

| Entry point | Editorial authority | Commercial/referral authority | Failure behaviour |
| --- | --- | --- | --- |
| `/casinos` | Published snapshot and editorial filter context | Current request policy AND batched operator evidence AND current local offer/link/slug | Review-only card; bonus editorial remains visible |
| `/casino/[slug]` | Published profile service | Current request policy AND operator evidence AND managed route | Published review with unavailable action |
| `/bonuses` | Published offer terms | Current request policy AND batched operator evidence | Review-only offers |
| `/best-offers` | Generic GB editorial shortlist | Current request policy AND batched operator evidence | Shortlist may remain; actions unavailable |
| `/compare` | Declared market comparison context | Current request policy AND batched operator evidence AND managed route | Comparison remains; action unavailable |
| `/outbound/[slug]` | Legacy compatibility input only | No independent commercial authority | Valid managed slugs redirect internally to `/r/[slug]`; invalid slugs go to `/outbound/unavailable` |
| `/r/[slug]` | Not applicable | Current trusted request policy AND operator/domain/partner evidence AND current stored route | `303` to `/outbound/unavailable`; no substitute |
| `/go/[slug]` | Not applicable | Permanently has no external authority | `303` to `/outbound/unavailable` |
| Public casino/bonus APIs and sitemap | Published editorial projection | No request authority is supplied; actions default deny | Editorial data only; action fields unavailable |
| Protected admin redirect preview | Candidate-routing preview only | Not a public eligibility decision and cannot redirect | Omits destination URLs and reports preview-only result |

All request-dependent public pages and route handlers remain dynamic. Normal
commercial UI points directly to `/r/[slug]`; stale `/outbound/[slug]` links
take one internal compatibility redirect to the same route. A rendered action
is never authority for a later click; `/r` resolves with a fresh `now` and
current facts.

## Fail-closed outcomes

| Condition | Editorial | Commercial | Referral |
| --- | --- | --- | --- |
| Current trusted GB request under initial policy | Allowed | Denied — `COMMERCIAL_NOT_ACTIVE` | Denied |
| Unknown or invalid location | Safe editorial behaviour | Denied | Denied |
| Country preference conflicts with trusted location | Safe editorial behaviour | Denied | Denied |
| Unsupported country or missing policy | Safe editorial behaviour | Denied | Denied |
| Stale/future signal or stale policy | Policy-dependent editorial behaviour | Denied | Denied |
| Restricted/suspended market or administrative deny | Policy-dependent editorial behaviour | Denied | Denied |
| Missing/stale/unofficial licence or domain evidence | Published editorial remains separate | Denied | Denied |
| Partner, offer, link, slug or destination failure | Published editorial remains separate | Denied as applicable | Denied |
| Repository/evidence service error | Existing safe editorial projection | Denied | Denied |

`AFFILIATE_REDIRECT_ENGINE_ENABLED` remains the immediate server-side commercial-route kill switch and defaults to false. Policy `SUSPENDED`/`RESTRICTED` and deny-only administrative override provide policy-level containment. Rollback may deploy an earlier application or suspend the policy, but it must not restore `/go` or any legacy permissive fallback.

## Privacy and protected-data boundary

The authority reads no raw IP and creates no location history. Structured diagnostics are limited to entry point, decision ID, normalized country, market, policy version, reason, capability booleans and safe internal IDs. Destination URLs, credentials, cookies, request tokens and personal identifiers are not logged.

Programme reflections, Moment Map, goals, urge data, boundaries, Self-Check, Limit Tracker, Protected Help behaviour, XP and streaks are neither inputs nor reachable dependencies of jurisdiction/commercial selection. Commercial targeting from private or safety-sensitive data is prohibited.

## GB evidence register

The following facts were checked from primary sources on 2026-08-08. Recheck is due by 2026-09-07. The owner is Founder Office / compliance authority until a named operational owner is approved.

| Evidence ID | Category | Official source | Checked at | Fact supported | Owner | Recheck by |
| --- | --- | --- | --- | --- | --- | --- |
| `GB-REMOTE-CASINO-LICENCE-2026-08-08` | Market/licence authority | [Gambling Commission — Remote casino operating licence](https://www.gamblingcommission.gov.uk/licensees-and-businesses/licences-and-fees/remote-casino-operating-licence) | 2026-08-08 | A remote casino operating licence is the relevant Commission licence for offering online casino games to consumers in Great Britain. | Founder Office / compliance | 2026-09-07 |
| `GB-PUBLIC-REGISTER-2026-08-08` | Licensing register | [Gambling Commission — Public Register](https://www.gamblingcommission.gov.uk/licensees-and-businesses/page/public-register) | 2026-08-08 | The official register identifies businesses holding Commission operating licences and regulatory actions. | Founder Office / compliance | 2026-09-07 |
| `GB-DOMAIN-REGISTER-2026-08-08` | Domain verification process | [Gambling Commission — Full business register](https://www.gamblingcommission.gov.uk/public-register/businesses/full) | 2026-08-08 | The register supports search by business, trading name, domain name or account number and exposes activity filters. | Founder Office / compliance | 2026-09-07 |
| `GB-GAMBLING-ACT-67-2026-08-08` | Statutory remote-licence form | [UK legislation — Gambling Act 2005 section 67](https://www.legislation.gov.uk/ukpga/2005/19/section/67) | 2026-08-08 | A remote operating licence states that it is remote and authorises specified remote gambling/activity. | Founder Office / compliance | 2026-09-07 |
| `GB-AGE-ID-BOUNDARY-2026-08-08` | Age/account launch boundary | [Gambling Commission — Age and ID verification](https://www.gamblingcommission.gov.uk/public-and-players/guide/age-and-id-verification) | 2026-08-08 | Online gambling businesses perform age/identity checks before gambling; this workstream does not create operator KYC or age authority. | Founder Office / compliance | 2026-09-07 |
| `VERCEL-REQUEST-COUNTRY-2026-08-08` | Request-country signal | [Vercel — Request headers](https://vercel.com/docs/headers/request-headers); [Vercel — Geolocation headers](https://vercel.com/kb/guide/geo-ip-headers-geolocation-vercel-functions); [Vercel — System environment variables](https://examples.vercel.com/docs/environment-variables/system-environment-variables) | 2026-08-08 | Vercel deployments expose `x-vercel-ip-country`; Vercel system configuration distinguishes deployment runtime/environment; local development does not supply the platform signal. | Repository maintainer / compliance | 2026-09-07 |

## Data readiness and remaining gates

**Not verified:** no secure read-only Production database audit was performed by GB-MARKET-01, so underlying published-casino, country, licence, evidence and partner counts must not be guessed.

**Detected:** commercially eligible GB operators are exactly zero under policy version `gb-2026-08-08.1`, irrespective of underlying inventory, because jurisdiction commercial and referral capabilities are false and the real exact-domain evidence store is empty.

- [COMM-01](GB-Commercial-Partner-Authority.md) supplies the fail-closed authority contracts and state gates. A real operator/partner, current licence/domain record, approved destination and commercial terms remain absent.
- LEGAL-02 must supply final external GB legal/compliance sign-off, including age/account and significant-condition decisions where applicable.
- RECOVERY-01 remains a stateful-beta gate.
- The RFC-012 temporary fictional Production exception is unchanged and must not be expanded.
