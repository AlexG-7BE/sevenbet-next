# RFC-036: GB Public Legal P0 Closure

- **Status:** COMPLETE
- **Decision authority:** Founder Office `GB-PUBLIC-LEGAL-PACK-01`
- **Decision date:** 2026-08-19
- **Scope:** Great Britain public legal copy, Article 27/ICO/DPIA/vendor-account closure records, strictly-necessary-only launch technology and commercial evidence fail-closure
- **Depends on:** Product Vision & Principles v2.0, RFC-014, RFC-015, RFC-017, RFC-020, RFC-021, RFC-022, RFC-023, RFC-025, RFC-026, RFC-028, RFC-033 and the Programme engineering standards
- **Supersedes:** RFC-026 only for public product-analytics collection and activation; RFC-017 only where this RFC supplies the final P0 assessment documents. All Programme runtime-hardening, reward, Mission, persistence, Help and commercial-firewall decisions remain unchanged.

## 1. Decision

B4GAMBLE will close the repository-controlled parts of the GB public legal pack without activating commercial traffic, changing Production or claiming that an external contract, appointment, registration or account setting has been completed when no durable evidence exists.

The launch-candidate runtime will use only storage and access technology needed for a service the user requests, authentication, security, access authority and same-tab Programme continuity. Vercel Web Analytics and custom-event delivery will be removed from the public runtime, their public environment switch will be removed, and the provider package will be removed. The existing closed event taxonomy may remain only as dormant, provider-free testable code so that Programme call sites need no product change. A later analytics activation requires a separate RFC, a current PECR assessment, a documented user-information/objection or consent design as applicable, provider-role and transfer evidence, and deterministic verification.

GB commercial and referral traffic remains off. A timestamp is not evidence status. Legacy casino-licence data with no explicit `CasinoLicenseEvidence.status` must map to `UNKNOWN`, even if `lastVerifiedAt` is populated. Only an explicit evidence record may map as `VERIFIED`. Existing jurisdiction, partner, operator, exact-domain, licence, offer, tracking, significant-condition, redirect and global-kill-switch authorities remain cumulative and server-owned.

## 2. Evidence classification

### Detected

- 7BE Inc. is a United States controller with no UK establishment or appointed UK representative evidenced in the repository.
- B4GAMBLE intentionally offers an ongoing service to adults in Great Britain and maintains account, session, Programme progress and active-day records.
- Optional Programme typed input, audio and transcripts may reveal health or other special-category information and are sent to OpenAI only after a separate just-in-time explicit-consent authority is active.
- Responses API calls use `store: false`; transcription is in-memory and B4GAMBLE does not persist audio. Provider-account retention, training opt-in, ZDR/MAM, data residency and executed DPA evidence are not present in the repository.
- Vercel Analytics can currently be enabled by a public flag, its root component exists, its SDK is a runtime dependency, and no public consent/preference control exists.
- Necessary authentication/Programme cookies and exact-subject `sessionStorage` are present. No behavioural advertising, ad pixel, session replay, Stripe integration or commercial personalisation from Programme/Help data was detected.
- GB jurisdiction commercial/referral policy is disabled, the affiliate redirect engine defaults off, no real partner authority exists and the repository-controlled exact-domain evidence list is empty.
- Legacy licence mapping currently converts `lastVerifiedAt` into `VERIFIED` without an explicit evidence status.

### Inferred

- UK GDPR Article 27 applies because the controller is outside the UK, deliberately offers an ongoing GB service and monitors service/Programme behaviour; the occasional/low-risk exception is not safely available.
- The ICO data-protection fee is required because B4GAMBLE is a controller using electronic personal data for non-exempt account, Programme, support and service purposes. The correct tier cannot be fixed without current staff and worldwide-turnover facts.
- A DPIA is required because AI/voice processing is combined with highly personal or potentially special-category data and systematic Programme tracking.
- Removing non-essential analytics is the narrowest evidence-backed PECR launch posture. It avoids depending on the 2026 statistical-purpose exception without proof of aggregate-only operation, prompt aggregation, a simple free objection, processor-only use and transfer controls.

### Planned

- Founder/Legal will appoint a qualifying UK representative in writing, publish the representative particulars and retain the mandate.
- Founder/Finance will complete the ICO registration using current staff and turnover facts, pay the applicable fee and retain renewal evidence.
- Account owners will capture and approve the applicable vendor terms, DPAs, subprocessors, locations, transfer mechanisms, transfer assessments and account-side privacy settings.
- The controller will sign the DPIA and legal pack. External counsel will review Article 27, UK consumer terms and the transfer/processor evidence before release.
- Any future real commercial activation will occur through a separate reviewed activation change after all existing authorities pass.

### Not detected

- No evidence supports publishing a UK representative name/address/email, an ICO registration number, an executed vendor DPA, a transfer mechanism, ZDR/MAM approval or a real GB commercial partner.
- No current code imports Stripe or sends payment data.
- No approved CMP, analytics objection control, advertising tracker, user-level analytics or session replay exists.
- No schema, migration, reward, achievement, Mission ordering, prerequisite, protected Help, Production configuration or Production-data change is required by this RFC.

## 3. Public technology rule

The public runtime must not import or render `@vercel/analytics`, call its browser/server SDK, or expose an environment value capable of enabling it. Runtime product-analytics clients and servers are disabled by repository policy and use no provider sink. Necessary storage remains purpose-limited:

- authentication and security session cookies;
- short-lived anonymous Programme session and pending-claim cookies;
- exact-subject same-tab Programme continuity and access-authority `sessionStorage`;
- user-requested same-tab comparison selection; and
- staff-only local editorial draft recovery outside the consumer service.

Necessary storage cannot be reused for analytics, advertising, affiliation measurement or commercial personalisation. The Privacy Notice must identify the necessary categories and state that non-essential analytics, advertising trackers and session replay are not run in this launch posture. A cookie banner is not presented because there is no optional technology to choose; the decision must be revisited before any non-essential storage or access is introduced.

## 4. Commercial evidence rule

All existing RFC-014/RFC-015 authorities remain cumulative. In addition:

1. `lastVerifiedAt`, `reviewedAt`, an active licence label or a source URL does not itself create `VERIFIED` status.
2. A legacy licence without an explicit evidence record maps to `UNKNOWN` and cannot satisfy operator/commercial evidence authority.
3. An explicit `CasinoLicenseEvidence` record supplies its stored closed status; only `VERIFIED` may be treated as verified, subject to source, relationship, currency and expiry checks.
4. Public claim copy must describe source and checked date rather than translate unknown evidence into a verified, trusted, safe, best or current claim.
5. The exact-domain activation list remains empty in this change. Affiliate and sponsored-copy readiness does not activate an action.

## 5. Programme and identity boundary

The Programme has exactly two entry confirmations: 18-or-over and agreement to Terms/acknowledgement of Privacy. The optional personal-input authority appears immediately before typed or voice input and must be unchecked, explicit, separate and withdrawable. Withdrawal invalidates server authority, stops future AI/transcription processing and clears the active browser draft. Protected Help remains available without Programme consent and contains no casino, offer or affiliate actions.

Google remains identity-only. Public copy must say it does not verify age and B4GAMBLE does not supply Programme words to Google. OAuth tokens remain transient and stripped from the stored application account relationship. Account creation grants no marketing permission and no XP.

## 6. OpenAI boundary

Repository controls remain: server-only credentials; exact provider/model flags; `store: false` and `background: false` on Responses; no tools; strict output schemas; bounded time/size; one in-memory transcription file; no saved audio; no content logging; and no AI authority over XP, completion, eligibility, safety or commerce.

The controller must not infer account controls from code. Before approval it must capture organisation/project training opt-in state, data-retention configuration, ZDR/MAM eligibility and status, region/project identity, DPA/transfer terms, subprocessors and retention evidence. If the captured controls conflict with the Privacy Notice or DPIA, release stops until documents and/or configuration are corrected.

## 7. Verification and release boundary

Deterministic tests must prove:

- the required legal documents exist and use the approved closure vocabulary;
- the public runtime has no Vercel Analytics package/import/root component/enable flag;
- the Privacy Notice states the strictly-necessary-only posture and conditional UK-representative field without invented particulars;
- Programme access, just-in-time consent, withdrawal, Google identity and protected Help boundaries remain exact;
- Responses use `store: false`, transcription remains bounded/in-memory and logs exclude user content;
- legacy timestamps cannot produce `VERIFIED` evidence;
- exact-domain records are empty and commercial/referral activation remains denied; and
- legal, Programme, commercial, type, build and browser regressions pass.

This RFC authorises code and documentation only on Draft PR #78. It does not authorise merge, Production deployment, Production environment/configuration, a provider-account mutation, a vendor contract acceptance, an ICO payment, a representative appointment or a real commercial activation.
