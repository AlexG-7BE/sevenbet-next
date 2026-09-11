# GB PECR and Analytics Decision

- **Original strictly-necessary decision:** 19 August 2026
- **Current amendment:** 11 September 2026
- **Status:** ANALYTICS CONSENT IMPLEMENTATION: CANDIDATE — PRODUCTION ACTIVATION NOT VERIFIED
- **Owner:** Privacy / Engineering under explicit Founder authority

## Current decision

RFC-046 supersedes the RFC-036 permanent hard-disable only for the new bounded
analytics purpose. B4GAMBLE may operate first-party Product Core analytics only
after the person makes an affirmative, specific analytics choice. Missing or
denied consent means the application creates no browser analytics identifier
and accepts no client event.

B4GAMBLE does not rely on the PECR statistical-purpose exception for this
design. Although the Core supports aggregate service improvement, it also
supports durable sessions, authenticated journey linkage and internal
commercial-click attribution. The current ICO exception guidance excludes
individual visitor tracking, conversion linkage and advertising/affiliate
measurement from that narrow exception.

Necessary authentication, security, requested Programme continuity, language
preference and comparison storage remain separately purpose-limited. An
analytics choice never grants email marketing permission and never changes
Programme, Help, GEO, legal or commercial authority.

## Evidence classification

### DETECTED in the implementation candidate

- The Vercel Analytics package/root runtime is absent.
- A first-party consent component explains the purpose and offers equally
  accessible decline/allow controls plus a persistent Privacy choices control.
- The signed consent cookie is browser-readable only as a UI hint. Opaque
  anonymous/session cookies are HTTP-only and issued only on a grant.
- The server verifies the consent signature at ingestion and clears identity
  cookies on denial/withdrawal.
- The event schema is a strict 19-event relational dictionary with no arbitrary
  JSON, email, raw IP, auth token, affiliate destination or Programme wording.
- Local, Preview, test, internal and obvious bot traffic is tagged and excluded
  from Production human dashboards.
- Individual analytics/session/click data defaults to 395-day bounded
  retention and is included in data-subject export/erasure behavior.
- No advertising pixel, fingerprinting, session-replay or cross-site analytics
  SDK is present.

### INFERRED

- Necessary authentication/security and user-requested continuity storage can
  remain under their specific PECR treatment when disclosed and not reused.
- Prior affirmative consent is the conservative applicable browser-storage
  basis for the RFC-046 identity/event design; this repository record is not a
  substitute for legal advice or live consent evidence.

### NOT YET VERIFIED

- Production migration 0037, public analytics flag and consent/event flow.
- Production controller/processor agreement applicability, hosting/database
  region and transfer evidence for the exact accounts.
- Any consent record created by a real Production visitor under this version.

## Technology treatment

| Technology | Purpose | Treatment |
| --- | --- | --- |
| Better Auth/session cookies | Sign-in, integrity and security | Necessary; no analytics reuse |
| Anonymous Programme/claim storage | Deliver and save the requested Programme | Necessary/user-requested; no analytics reuse |
| Language-preference cookie | Preserve requested presentation language | Necessary to the request; no GEO inference |
| Comparison session storage | Remember same-tab user selection | User-requested; no profiling |
| Analytics consent cookie | Remember grant or denial | Choice record; signed; bounded |
| Analytics anonymous/session cookies | First-party Product Core identity/session | Prior affirmative consent; clear on denial |
| Server redirect outcome row | Operational/commercial outcome after RFC-042 | Legitimate operational record; optional identity/source enrichment omitted without analytics consent |
| Vercel operational/security logs | Hosting, security and fault handling | Minimise under provider terms; not application analytics storage |

## Consent and withdrawal controls

The public choice states that analytics is first party and excludes email,
Programme answers and partner tokens. Decline is available before collection.
Privacy choices remains available after either decision. A denial clears
anonymous/session identifiers. If preference persistence is unavailable, the
UI reports failure and no client event is accepted.

Changing browser analytics preference does not withdraw email consent. Email
withdrawal uses the separate account/unsubscribe authority.

## Reopening gate

Any additional technology, event, property, provider, purpose, retention,
advertising use, replay, fingerprinting or cross-site/device linkage requires
new decision evidence. The gate must cover exact fields, provider role/DPA,
retention, transfers, notice, lawful/PECR basis, withdrawal, security tests and
Programme/Help/commercial separation.

## Primary sources

- [ICO — storage and access technology exceptions](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/what-are-the-exceptions/)
- [ICO — managing consent in practice](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/how-do-we-manage-consent-in-practice/)
