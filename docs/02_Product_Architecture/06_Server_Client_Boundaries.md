# Server and Client Boundaries

## Trust boundary

The client is an interaction and presentation environment, not an authority. Browser input, stored state, route parameters, and previous render decisions are untrusted when used for a mutation, permission, eligibility, referral, disclosure, or safety-sensitive action. The server/application boundary revalidates them.

## Client responsibilities

Clients may render server-provided states, collect explicit input, provide accessibility and navigation, preserve local non-sensitive interaction state, and make clearly defined requests. They must not contain secrets, privileged credentials, policy rules whose outcome controls access, raw internal identifiers where a public reference is safer, or logic that treats a hidden UI action as a security restriction.

## Server responsibilities

Server-side execution owns authentication/session validation, role authorisation, validation of mutations, policy evaluation, access to personal/governance/commercial data, source-of-truth reads, state transitions, audit recording, integration credentials, referral destination construction, and cache/index invalidation. It returns only the data necessary for the specific public or internal purpose.

## Rendering principles

Public views may be server-rendered, client-rendered, cached, or hybrid as implementation evolves, but the rendering choice cannot change policy enforcement. A cached or client-hydrated view must be scoped to the policy decision it represents and be invalidated/bypassed when restriction, suspension, or sensitive data makes reuse unsafe.

The experience layer must make unavailable, restricted, unknown, and stale states clear. It must not simulate certainty because a data dependency failed.

## Authentication and roles

Authentication identifies an actor; authorisation decides whether that actor may invoke a capability; business approval decides whether the action is permitted in the product. These are distinct checks. Internal UI hiding is a convenience only; every internal operation enforces its role and separation-of-duties rule server-side.

## Client data exposure

Public payloads include only publication-permitted, scope-correct facts and the explanations required by the Product Vision. Internal payloads are role- and purpose-scoped. Personal boundaries, audit histories, credentials, provider payloads, internal review notes, commercial terms, and restricted evidence are not bundled for client convenience.

## Baseline alignment

**Detected:** the baseline records Next App Router server components by default, client components for interaction, route handlers, Better Auth, and a middleware convenience layer. **Target:** middleware may guide routing, but it is not the only authorisation or policy boundary; protected layouts and handlers must recheck server-side, and future delivery mechanisms must follow the same rule.
