# RFC-030: Production Canonical Host Enforcement

- **Status:** Approved for bounded implementation
- **Decision authority:** Founder Office `FULL-SITE-QA-01` overnight Production-readiness brief
- **Approved:** 2026-08-13
- **Scope:** Canonicalise every Vercel Production request to the single public B4GAMBLE origin without affecting Preview, local development or test runners
- **Base:** `c52595405f0800c8c2b51d5951c4a8d45c133034`
- **Depends on:** Product Vision & Principles v2.0, RFC-019, RFC-020, RFC-021 and Vercel's documented system-environment contract
- **Supersedes:** RFC-019 section 5 only where it left generated Vercel Production-host redirects as a separate optional platform action

## 1. Decision

The one public Production origin is the constant trusted origin:

```text
https://b4gamble.com
```

Before auth, Programme, admin, API or page routing, application middleware will inspect the documented `VERCEL_ENV` runtime signal:

1. `production`: an exact `https://b4gamble.com` request continues; every other request origin receives a method-preserving permanent `308` redirect to the constant canonical origin with the original pathname and query string;
2. `preview`: the existing exact generated-deployment-host to exact stable-branch-host `307` contract remains unchanged, including its fail-closed metadata and unexpected-host decisions; and
3. every other or absent value: the request continues unchanged for local development, CI and ordinary test runners.

The Production destination origin is never derived from `Host`, `Forwarded`, `X-Forwarded-Host`, `VERCEL_URL`, `VERCEL_BRANCH_URL`, query input or any other request-controlled value. Only pathname and query are carried from the parsed request URL.

## 2. Why application enforcement is required

Vercel project/domain configuration can canonicalise owned custom domains such as `www`, but it does not provide a repository-verifiable guarantee that every generated or immutable Production deployment hostname will redirect. Vercel documents `VERCEL_ENV` as the runtime environment discriminator and `VERCEL_URL` as the generated deployment hostname. An application guard therefore covers the project hostname, main-branch alias, immutable deployment URLs and any additional Production alias without enumerating hostnames or trusting naming substrings.

No Vercel domain, deployment-protection, DNS or environment mutation is authorised by this RFC. Existing platform redirects may remain as a first layer; the application rule is the consistent fallback.

## 3. Security and compatibility invariants

- The redirect origin is the source constant `https://b4gamble.com`; no Host-header open redirect is possible.
- `308` preserves request methods for API and auth requests as required by the current Next.js redirect contract.
- Pathname and query string are preserved; fragments are not part of an HTTP request and are not processed.
- Preview never redirects to Production and retains exact branch-host auth/session continuity.
- Localhost, CI and tests do not redirect without exact `VERCEL_ENV=production`.
- The canonical Production origin does not redirect, preventing loops.
- The guard runs before Better Auth, Google callbacks, `/login`, Programme, protected Help, admin, APIs, static assets and Next.js internals; all are covered consistently.
- No auth allow-list, cookie, OAuth callback, Programme authority, commercial authority, schema, migration, data, secret or environment value changes.

## 4. Acceptance matrix

Automated tests must cover:

- canonical root and representative public, Programme, login and admin paths continue;
- `http://b4gamble.com`, `https://www.b4gamble.com`, the project `vercel.app` hostname, a main alias and an immutable Production deployment hostname redirect permanently;
- public, API, OAuth and unknown/404 pathnames plus repeated and encoded query values are preserved;
- an unrelated or malicious Host value still redirects only to the constant canonical origin;
- exact Preview deployment requests retain their temporary branch-host redirect and exact Preview branch requests continue; and
- local/CI requests continue unchanged.

Read-only Production verification must enumerate actual aliases where available and record each observed redirect chain. Preview verification must prove that the deployed audit branch remains on its Preview branch origin.

## 5. Release boundary and rollback

This RFC authorises only the bounded source change, regression coverage and Draft-PR Preview verification. It does not authorise merge, Production deployment, DNS/domain changes, environment changes, secret changes, OAuth changes or Production data mutation.

Rollback reverts the middleware resolver and its tests. Existing platform domain redirects and canonical metadata remain independent.
