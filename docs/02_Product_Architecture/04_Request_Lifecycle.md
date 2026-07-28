# Request Lifecycle

## Principle

Every entry point—page request, API request, admin action, redirect, import, job, or future webhook—must reach the same application and policy boundaries. Different transports may not create weaker commercial, permission, or compliance paths.

## Public information request

1. Establish only the context needed for the request, including declared/correctable market context where relevant.
2. Load approved public read models and their current scope/status.
3. Evaluate market, publication, disclosure, and safety policy before rendering any governed item.
4. Render facts, limitations, uncertainty, review context, and non-commercial control/support routes.
5. Return an explanatory unavailable/restricted state when no permitted commercial option exists; do not substitute an unverified option.

Public rendering must not mutate business state except for narrowly defined, privacy-governed operational events. The UI treats all supplied display data as untrusted for later write or referral use.

## Public referral request

1. Receive an intentional referral action from an approved public context.
2. Re-establish the authoritative current scope; never trust an earlier page render, client flag, or URL parameter as eligibility proof.
3. Verify market/operator/offer/referral status, disclosure, safety restrictions, and destination validity.
4. Record only the minimum auditable handoff event permitted by policy.
5. Present the disclosed external handoff or deny it with a safe, non-commercial explanation.

Referral routing is an enforcement point. It must fail closed when an approval expires, is suspended, cannot be evaluated, or is inconsistent.

## Authenticated user request

1. Authenticate the actor and identify the requested capability.
2. Authorise the actor for that capability and owned data scope.
3. Validate intent and input at the delivery boundary.
4. Run the owning application command, enforcing domain invariants and policy.
5. Persist atomically where the command changes state; return a purpose-specific result without exposing internal models.
6. Emit audit/operational events appropriate to the sensitivity of the action.

Registration never becomes a prerequisite for core education, support, basic Control Program access, or publicly permitted research.

## Internal governance request

1. Authenticate and authorise the staff actor using least privilege.
2. Create, edit, approve, restrict, or suspend only within the actor's role and separation-of-duties constraints.
3. Require evidence, scope, effective date, and rationale for market-sensitive, commercial, or material editorial changes.
4. Apply workflow/policy checks before state transition.
5. Append an immutable audit record sufficient to explain who changed what, when, why, and under what approval.
6. Rebuild/invalidate affected derived views so public surfaces reflect restrictions promptly.

An emergency suspension path can be shorter, but it must record the actor and reason and trigger follow-up review. It cannot grant permanent approval.

## Integration, import, and future event request

Inbound provider data is untrusted. An adapter authenticates/verifies its transport, normalises the payload, records provenance and raw-reference metadata as permitted, and passes a candidate record to a reviewable import workflow. It cannot publish content, change eligibility, or activate a referral directly. Retries must be idempotent; failures must be observable; unknown mappings remain quarantined.

## Error and safety behaviour

Errors reveal no secrets or unnecessary personal data. For informational content, a safe degraded state explains limitations. For governed action—referral, publication, eligibility, permission, or sensitive change—failure means deny, restrict, or queue for review. Telemetry must permit diagnosis while following data minimisation and never using safety-sensitive context for promotional optimisation.

## Open Decisions

### ARCH-OD-07 — Freshness and expiry execution

Before publishing time-sensitive claims, evidence, or offers in a governed MVP, an RFC must approve the mechanism that executes review deadlines; its ownership, idempotency, failure detection, backlog escalation, manual fallback, and fail-closed behaviour. A deadline that cannot be evaluated or processed must not leave the affected commercial exposure available.
