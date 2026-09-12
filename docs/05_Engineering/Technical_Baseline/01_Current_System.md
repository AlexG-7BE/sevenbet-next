# Current System

## 12 September RFC-046 Production reconciliation

**DETECTED in Production:** the
application adds registered-customer operations, consented first-party
analytics, server-observed outbound attribution, fixed dashboards, an email
template/campaign/message ledger, verified Resend webhook ingestion,
unsubscribe handling and bounded retention. The additive schema change is
migration `0037_customer_data_analytics_lifecycle_core`. PR #271 deploys the
bounded lifecycle provider worker only from the protected cron; the exact
delivery gate is `false`. See
[16_Customer_Data_Analytics_Lifecycle_Core.md](16_Customer_Data_Analytics_Lifecycle_Core.md).

**DETECTED:** Production migration/runtime analytics, webhook registration and
worker deployment are verified. **UNKNOWN / HOLD:** provider delivery and the
six controlled acceptance cases remain unproved pending a safe fixture plus
authorised Production database and staff access. The older snapshot below
remains historical context where it conflicts with this current delta.

## Snapshot

**Detected, reconciled 2026-08-13 at main `c525954`:** B4GAMBLE (the consumer brand previously named SevenBet) is a Next.js App Router application with a PostgreSQL/Prisma persistence layer, Better Auth integration, public decision-support pages, a protected admin area, CMS-oriented builders, affiliate operations, media management, a legacy Programme through Mission 04 and a separately feature-gated PROGRAM-AI path through Mission 10. The repository, Vercel project and compatibility identifiers remain `sevenbet-next`/`SevenBet` where RFC-019 explicitly preserves them.

## Frontend architecture

**Detected:** `app/` uses the App Router and root layout (`app/layout.tsx`). Public routes include the home page, informational/legal pages, learning and responsible-gambling pages, program, catalogue/casino discovery, casino detail, and tools. Dynamic public routes include `/casino/[slug]`, `/learn/[category]`, `/learn/[category]/[slug]`, and `/responsible-gambling/[slug]`.

**Detected:** Admin pages are grouped in `app/admin/(protected)/`; `app/admin/(protected)/layout.tsx` checks server-side staff access, while `app/admin/login/page.tsx` is public and marked non-indexable. The parent middleware provides a redirect convenience layer for `/admin/*` and `/api/admin/*`; authorization is re-checked by the protected layout and route handlers.

**Detected:** Shared presentation components live in `components/`; reusable primitives are in `components/ui.tsx`. Builder, affiliate, casino-editor, and media components are under `components/admin/`. Styling is global CSS in `app/globals.css`, with class names in TSX; Tailwind and a separate CSS-in-JS library are **not detected**.

**Detected, reconciled 2026-08-07:** Loading/error handling is present for bounded public/admin surfaces, and global `app/not-found.tsx` plus `app/global-error.tsx` provide safe recovery. `app/robots.ts`, `app/sitemap.ts`, route metadata, and `app/llms.txt/route.ts` provide SEO/crawler surfaces. Client components are present where interactive state or browser APIs are used; other route pages are server components by default under App Router conventions.

## Backend architecture

| Mechanism | Status | Evidence |
| --- | --- | --- |
| Route handlers | Implemented | 90 `route.ts` files under `app/api/`, plus three non-API route handlers (`/go`, `/r` and `/llms.txt`). |
| Service layer | Implemented | `lib/services/` contains program, casino, media, progress, XP, affiliate, and public discovery services. |
| Repository layer | Implemented | `lib/repositories/` contains Prisma-backed repositories for the same principal domains. |
| Input validation | Implemented | Domain validation modules in `lib/cms/`, `lib/casino-builder/`, `lib/affiliate/`, `lib/media/`, and `lib/progress/`. No external validation package is detected. |
| Authorization policies | Implemented | `lib/auth/`, `lib/cms/permissions.ts`, protected layout, and admin handlers. |
| Server actions | Not detected | No `"use server"` directive was found. |
| Middleware | Implemented | `middleware.ts` enforces the exact Preview canonical-host contract, rejects non-GET Programme mutations without the bounded age-attestation header, and scopes admin UX routing; route/layout authorization remains server-owned. |
| Scheduled/background jobs | Partial | No general queue worker is detected. Repository-owned Production smoke and authenticated Vercel Cron routes exist. PR #271 adds a bounded daily lifecycle-queue/retention worker behind the exact disabled delivery gate. |
| Webhooks | Deployed and registered | RFC-046 provides one raw-body, Svix-verified Resend webhook receiver. The exact five-event provider registration and unsigned-event rejection are verified; valid/replay Production evidence is pending. |
| Caching | Partial | `lib/public-casino/cache.ts` exists; no external cache service was detected. |

## Detected product modules

| Module | Status | Main evidence | Persistence/admin availability | Limitation visible from evidence |
| --- | --- | --- | --- | --- |
| Public content, learning, responsible-gambling, self-check and budget tool | Implemented | Public `app/` routes and presentation components | Static/local data surfaces; no public editorial CMS route was confirmed | Jurisdiction/compliance enforcement is not established by these pages alone. |
| Program, progress, XP and achievements | Implemented with two runtime modes | `app/program`, `app/api/program/**`, mission-specific services/repositories and the PROGRAM-AI mission registry | Prisma models; admin program, XP-rule and achievement pages | Legacy Missions 01–04 and feature-gated PROGRAM-AI Missions 01–10 coexist; the exact server flag selects the runtime. |
| Active Control Programme | Legacy M1–M4 plus feature-gated M1–M10 implemented | Session, claims, Dashboard, legacy Missions 02–04, PROGRAM-AI Missions 02–10, artefact, review, reward and active-day routes | Migrations 0015–0019; Better Auth ownership; server-owned progression and exact `715 XP` clean PROGRAM-AI path | Production activation is an operational authority, not a repository fact; Project State records a live-state contradiction. |
| PROGRAM-AI and voice | Implemented in source, exact gates required | `ProgramAiExperience`, `/api/program/program-ai/**`, Mission 02–10 registry/coordinator, OpenAI transcription and guidance adapters | Additive migration 0018; narrow authority + confirmed Starting Point; closed structural M2–M10 persistence; three Reviews | Current 8 MiB audio contract conflicts with Vercel's complete request ceiling; proposed RFC-031 is not implementation authority. |
| Program Builder | Implemented | Admin program routes, `ProgramBuilder.tsx`, `program-builder.service.ts` | Version/snapshot/revision persistence and preview routes | Scope is program content, not a general CMS conclusion. |
| Casino CMS and public casino rendering/discovery | Implemented | Casino admin routes, `CasinoBuilder.tsx`, public routes/services | Prisma-backed casinos, versions, revisions, SEO and related records | Public CMS path is environment-gated by `PUBLIC_CASINO_CMS_ENABLED`. |
| Affiliate platform, routing and integrations | Implemented | Affiliate admin/API routes, `/r/[slug]`, `lib/affiliate*` | Prisma-backed networks, programs, offers, links, mapping/import records; typed GB agreement metadata | Actual external provider connection and real partner agreement are not detected. |
| GB jurisdiction, operator and commercial evidence authority | Implemented, non-commercial policy | `lib/jurisdiction/`, `lib/affiliate-commercial/`, public services, `/r/[slug]`, `/go/[slug]` | Repository-controlled GB policy and exact-domain evidence store plus existing Casino/Affiliate records | Current policy denies commercial/referral; real partner/domain evidence and external legal/regulatory/partner release gates are not complete. |
| Media manager | Implemented | Admin media routes/components and `lib/media/` | Prisma media assets; LOCAL and S3 provider implementations | S3 activation depends on environment configuration. |
| Authentication and staff administration | Implemented; Google activation is configuration-dependent | Better Auth handler, identity-only Google account hooks, restricted auth paths, consolidated Programme access authority, explicit same-email link recovery, standalone login, session-derived Programme home/header, staff/profile checks and bootstrap scripts | Prisma User/Session/Account/AdminUser; Google rows retain identity association without durable OAuth token/scope material; access/claim continuation is tab-only | Legacy preview-token fallback remains explicitly gated. Project State records live Production Google availability as a contradiction because repository approval does not establish Production authority. |
| Customer data, first-party analytics and fixed reporting | Implemented and verified in Production | Better Auth customer observer, closed 19-event relational contract, consent/session service, Programme observers, outbound observation and fixed admin dashboards | Migration 0037 adds session/event/click/consent/email state and customer metadata; no arbitrary analytics JSON | Analytics is observational and cannot change identity, Programme, XP, GEO or commercial authority. |
| Public Contact email | Implemented in source | `/contact`, `POST /api/contact`, `lib/contact/*` direct-HTTPS Resend adapter | No application-database message persistence | Runtime delivery is fail-closed and configuration-dependent; account/Programme mail remains separate. |
| Lifecycle and campaign email | Provider/code ready; delivery disabled | Versioned templates, eligibility, idempotent queue, protected-cron worker, messages, campaign review, unsubscribe and signed webhook | Migration 0037 relational stores and protected Admin surfaces | Provider delivery and six-case acceptance are on HOLD; queued intent is not delivery evidence. |
| Payments and general notifications | Not detected | No payment processor or active general notification transport found | — | Contact and an unwired lifecycle adapter are not evidence of operational account, reminder or marketing email. |

## Admin and CMS

**Detected:** The admin shell, login, protected routes, permission checks, program/casino builders, affiliate management, media manager, lists, editor forms, revisions, previews, publication states, and role-based CMS permissions are present. The data model includes `EditorialStatus`, `AdminRole`, audit logs, program/casino versions and revisions.

**Inferred:** This is a domain-specific CMS/admin implementation for program, casino, affiliate and media operations, rather than evidence of a generic all-content CMS. Article persistence is modeled, but an article admin/editor route was not detected.

## Assessment

- **Implementation completeness estimate: 58%** (historical engineering estimate, not a measurement). The application now also has bounded GB market and commercial-partner authorities, proven Preview/Production isolation and completed RECOVERY-01 managed Preview-restore evidence. Completeness remains reduced by real licensed-domain/partner evidence, external legal approval, Programme operational/deployment gaps and unconfirmed Production integrations.
- **Architecture readiness: 6/10** (historical engineering estimate). A concrete codebase, domain persistence, layering patterns, migrations, auth boundaries, deterministic CI, isolated Preview, managed restore evidence and fail-closed GB commercial authority are ready to inspect. Before regulated launch, the team must still resolve real operator/partner evidence, legal/compliance ownership, routine recovery monitoring/separate Production incident authority and remaining Programme/privacy lifecycle gates.
- **May Phase 2 begin safely?** Yes, as an architecture-alignment phase, provided it treats the observed codebase as evidence to reconcile with Product Vision—not as an approved architecture.
