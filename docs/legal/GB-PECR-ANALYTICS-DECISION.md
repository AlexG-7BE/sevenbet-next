# GB PECR and Analytics Decision

- **Decision date:** 19 August 2026
- **Language-preference clarification:** 3 September 2026
- **Status:** PUBLIC LEGAL IMPLEMENTATION: COMPLETE
- **Owner:** Privacy / Engineering

## Decision

The GB launch is strictly-necessary-only. The public runtime does not load Vercel Analytics, emit page views or custom product events, set analytics markers, run advertising trackers/pixels or run session replay. No cookie banner is shown because there is no optional technology for a person to choose.

This is a narrower product decision than the 2026 statutory statistical-purpose exception. B4GAMBLE does not rely on that exception in this release.

## Evidence classification

### Detected

- Before RFC-036, `@vercel/analytics` was a runtime dependency, a root component could emit page views and a public environment flag could enable client/server events.
- No CMP, public analytics objection control or consent record exists.
- Necessary storage supports authentication/security, anonymous Programme session and claim continuity, access authority, exact-subject same-tab Programme drafts and user-requested same-tab comparison selection.
- The public presentation cookie stores only a requested language. It stores no country, raw IP or commercial authority and is not reused for analytics, affiliate measurement or personalisation.
- Staff-only editorial draft recovery uses local storage on an authenticated admin surface; it is not consumer tracking.
- No advertising pixel, behavioural advertising SDK or session-replay SDK is present.

### Inferred

- Necessary authentication/security and user-requested continuity storage falls within purpose-specific PECR exceptions when limited to those purposes and clearly described.
- The prior Vercel Analytics design was not evidenced against every current statistical-purpose condition: sole improvement purpose, aggregate result, prompt deletion of individual-level data, simple/free objection, processor-only provider role and transfer controls.
- Removing its package, imports, root mount and enable flag is the lowest-risk launch control.

### Planned

- Reassess before any non-essential storage/access technology is introduced.
- A future analytics RFC must map each technology and purpose, identify the applicable exception or obtain prior valid consent, implement required information and simple/free objection or withdrawal, and prove provider role, retention, aggregation and transfers.

### Not detected

- Any currently approved non-essential analytics, advertising, affiliation measurement, fingerprinting, cross-site/device tracking, session replay or social tracking technology.

## Allowed launch technology

| Technology | Purpose | Launch treatment |
|---|---|---|
| Better Auth/session cookies | Sign-in, session integrity and security | Necessary; disclose; no reuse |
| Anonymous Programme session cookie | Deliver the requested anonymous Programme flow | Necessary; short-lived; HTTP-only |
| Pending Programme claim cookie | Complete the requested account claim | Necessary; short-lived; HTTP-only |
| Language-preference cookie | Preserve the public language explicitly requested by the user | Necessary to the requested presentation; language only; no country/commercial authority; no reuse |
| Programme `sessionStorage` | Same-tab exact-subject draft/access continuity | Necessary to the requested flow; clears on lifecycle/withdrawal |
| Comparison `sessionStorage` | Remember the user's same-tab comparison selection | User-requested functionality; no profiling |
| Vercel operational/security logs | Hosting, security and fault handling; not browser storage controlled by the application | Minimise and govern under UK GDPR/provider terms |

Necessary data cannot be used for audience building, commercial targeting, affiliate measurement or product analytics.

## Reopening gate

Non-essential analytics remains off unless a separate approved RFC records: exact technology and keys; provider role/DPA; purposes; fields; retention/aggregation; international transfers; PECR exception analysis; clear public notice; a simple/free objection where using the statistical exception or prior consent where required; withdrawal/reset; no Programme/Help content or identity; automated tests; and Preview evidence.

## Primary source

- [ICO — storage and access technology exceptions](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/what-are-the-exceptions/)
- [ICO — storage and access technologies covered by PECR](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/what-are-storage-and-access-technologies/)
