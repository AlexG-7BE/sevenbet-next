# Production Programme AI and Google Activation — Founder Reconciliation

**Date:** 2026-08-14
**Authority:** Founder
**Status:** APPROVED / CURRENT PRODUCTION STATE

## Decision

The live Production activation of the B4GAMBLE Programme AI experience and Google identity sign-in is intentional and Founder-approved.

The Production state observed by FULL-SITE-QA-01 is therefore not an unauthorised runtime activation and must not be rolled back merely because older RFCs and project-state records described Production as off at earlier checkpoints.

The following Production capabilities are approved to remain active:

- the feature-on 10-mission Programme experience;
- the existing bounded Programme AI provider path under the already implemented runtime gates;
- Google identity sign-in through the existing Better Auth architecture;
- the existing explicit account-linking protections and recovery flow.

Google remains identity-only. This decision does not turn Google into age verification, KYC, jurisdiction proof or commercial authority.

## Evidence reconciliation

FULL-SITE-QA-01 correctly detected that Production rendered the feature-on Programme and presented Google sign-in. Its conclusion that this state lacked Founder authority was based on stale repository documentation, not on an unapproved Production change.

The Founder had already intentionally enabled the required Production runtime configuration and manually verified the resulting Programme/Google behaviour before FULL-SITE-QA-01.

Accordingly:

- `ENV-01` / the Programme-AI-and-Google authority contradiction is **RESOLVED AS DOCUMENTATION DRIFT**;
- any `CONTRADICTION / HOLD`, `unauthorised activation`, or instruction to disable Production Programme AI / Google in FULL-SITE-QA-01, `PROJECT_STATE.md`, or `ROADMAP.md` is superseded by this decision for this issue only;
- Programme AI and Google must **not** be disabled as part of PR #72;
- no secret values are recorded by this decision.

## Scope boundary

This approval does **not** waive or close unrelated findings from FULL-SITE-QA-01.

In particular, it does not by itself approve or resolve:

- alternate Production `vercel.app` host exposure;
- unsafe cache headers;
- legacy/demo public-data defects;
- admin RBAC/error defects;
- request-size enforcement defects;
- the Vercel voice-upload payload contract mismatch;
- CSP, Pexels provenance/privacy, article authority, Firefox/assistive-technology, or other separately recorded follow-up work;
- any commercial/affiliate activation;
- any Production database mutation.

## Release disposition

With the Programme AI / Google authority issue reconciled, PR #72 may proceed through normal review/merge gates based on its remaining technical findings and verification evidence.

The canonical-host fix and the other confirmed safe fixes in PR #72 are intended to be deployed to Production after merge and verified with a bounded Production smoke.

## Rollback

This decision changes documentation/authority state only. It does not itself mutate Production configuration.

If a future incident requires containment, Programme AI and Google retain their existing bounded runtime/configuration rollback paths, but no rollback is requested by this decision.
