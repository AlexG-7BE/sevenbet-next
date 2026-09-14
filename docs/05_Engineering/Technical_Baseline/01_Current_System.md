# Current System

## 14 September current reconciliation

**DETECTED in current canonical main and Production:** the application provides
registered-customer operations, consented first-party analytics with a closed
22-event dictionary, server-observed outbound attribution, fixed dashboards,
an email template/campaign/message ledger, verified Resend webhook ingestion,
unsubscribe handling and bounded retention. Migrations
`0037_customer_data_analytics_lifecycle_core` and
`0038_commercial_ux_analytics_events` are applied. The bounded lifecycle
provider worker runs only from the protected cron and the exact Production
delivery gate is enabled after the accepted six-case verification. See
[16_Customer_Data_Analytics_Lifecycle_Core.md](16_Customer_Data_Analytics_Lifecycle_Core.md).

**DETECTED:** Customer / Analytics / Lifecycle acceptance is `6/6 PASS`.
Mission 10 and enrollment completion timestamps are canonical and equal;
Programme reporting reads persisted state. The old Vercel Programme taxonomy,
compatibility module and aggregate report are retired. One runtime outbound
writer atomically stores detailed attribution, AnalyticsEvent projections and
the success-only daily aggregate. Historical aggregate and overlapping
detailed totals are never added. The older snapshot below remains historical
context where it conflicts with this current delta.

## Reconciled implementation snapshot

**Detected, reconciled 2026-08-13 at main `c525954`:** B4GAMBLE (the consumer brand previously named SevenBet) is a Next.js App Router application with a PostgreSQL/Prisma persistence layer, Better Auth integration, public decision-support pages, a protected admin area, CMS-oriented builders, affiliate operations, media management, a legacy Programme through Mission 04 and a separately feature-gated PROGRAM-AI path through Mission 10. The repository, Vercel project and compatibility identifiers remain `sevenbet-next`/`SevenBet` where RFC-019 explicitly preserves them.

## Frontend architecture

**Detected:** `app/` uses the App Router and root layout (`app/layout.tsx`). Public routes include the home page, informational/legal pages, learning and responsible-gambling pages, program, catalogue/casino discovery, casino detail, and tools. Dynamic public routes include `/casino/[slug]`, `/learn/[category]`, `/learn/[category]/[slug]`, and `/responsible-gambling/[slug]`.

**Detected:** Admin pages are grouped in `app/admin/(protected)/`; `app/admin/(protected)/layout.tsx` checks server-side staff access, while `app/admin/login/page.tsx` is public and marked non-indexable. The parent middleware provides a redirect convenience layer for `/admin/*` and `/api/admin/*`; authorization is re-checked by the protected layout and route handlers.

**Detected:** Shared presentation components live in `components/`; reusable primitives are in `components/ui.tsx`. Builder, affiliate, casino-editor, and media components are under `components/admin/`. Styling is global CSS in `app/globals.css`, with class names in TSX; Tailwind and a separate CSS-in-JS library are **not detected**.

**Detected, reconciled 2026-08-07:** Loading/error handling is present for bounded public/admin surfaces, and global `app/not-found.tsx` plus `app/global-error.tsx` provide safe recovery. `app/robots.ts`, `app/sitemap.ts`, route metadata, and `app/llms.txt/route.ts` provide SEO/crawler surfaces. Client components are present where interactive state or browser APIs are used; other route pages are server components by default under App Router conventions.

## Backend architecture

| Mechanism | Status | Evidence |
| --- | --- | --- |
| Route handlers | Implemented | 116 `route.ts` files under `app/api/`, plus four non-API route handlers (`/go`, `/r`, `/partner-creatives/[creativeId]/frame` and `/llms.txt`). |
| Service layer | Implemented | `lib/services/` contains program, casino, media, progress, XP, affiliate, and public discovery services. |
| Repository layer | Implemented | `lib/repositories/` contains Prisma-backed repositories for the same principal domains. |
| Input validation | Implemented | Domain validation modules in `lib/cms/`, `lib/casino-builder/`, `lib/affiliate/`, `lib/media/`, and `lib/progress/`. No external validation package is detected. |
| Authorization policies | Implemented | `lib/auth/`, `lib/cms/permissions.ts`, protected layout, and admin handlers. |
| Server actions | Not detected | No `"use server"` directive was found. |
| Middleware | Implemented | `middleware.ts` enforces the exact Preview canonical-host contract, rejects non-GET Programme mutations without the bounded age-attestation header, and scopes admin UX routing; route/layout authorization remains server-owned. |
| Scheduled/background jobs | Bounded | No general queue worker is detected. Repository-owned Production smoke and authenticated Vercel Cron routes exist; the bounded daily lifecycle-queue/retention worker is active behind exact Production configuration. |
| Webhooks | Deployed and registered | RFC-046 provides one raw-body, Svix-verified Resend webhook receiver. The exact five-event provider registration plus valid, invalid and replay outcomes are verified. |
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
| Affiliate platform, routing and integrations | Implemented | Affiliate admin/API routes, `/r/[slug]`, canonical tracking registration and `lib/affiliate*` | Prisma-backed networks, programs, offers, links, relationships, exact-market activations and revisions/import records | Affiliate lifecycle state is compatibility/workflow data, not public Commercial authority. |
| Exact-market commercial authority | Implemented and active | trusted-GEO normalization, exact `MarketActivation`, public services, `/r/[slug]`, `/go/[slug]` | One exact activation binds factual Casino, Partner, route, offer and tracking evidence | Missing, ambiguous, unhealthy, unsafe or legally blocked state fails closed; CRM, media, ranking and analytics are non-authoritative. |
| Media manager | Implemented | Admin media routes/components and `lib/media/` | Prisma media assets; LOCAL and S3 provider implementations | S3 activation depends on environment configuration. |
| Authentication and staff administration | Implemented; Google activation is configuration-dependent | Better Auth handler, identity-only Google account hooks, restricted auth paths, consolidated Programme access authority, explicit same-email link recovery, standalone login, session-derived Programme home/header, staff/profile checks and bootstrap scripts | Prisma User/Session/Account/AdminUser; Google rows retain identity association without durable OAuth token/scope material; access/claim continuation is tab-only | Legacy preview-token fallback remains explicitly gated. Project State records live Production Google availability as a contradiction because repository approval does not establish Production authority. |
| Customer data, first-party analytics and fixed reporting | Implemented and verified in Production | Better Auth customer observer, closed 22-event relational contract, consent/session service, persisted-state Programme observers, transactional outbound observation and fixed admin dashboards | Migrations 0037 and 0038 add session/event/click/consent/email state, customer metadata and bounded Commercial UX events; no arbitrary analytics JSON | Analytics is observational and cannot change identity, Programme, XP, GEO or commercial authority. |
| Public Contact email | Implemented in source | `/contact`, `POST /api/contact`, `lib/contact/*` direct-HTTPS Resend adapter | No application-database message persistence | Runtime delivery is fail-closed and configuration-dependent; account/Programme mail remains separate. |
| Lifecycle and campaign email | Active under bounded Production controls | Versioned templates, eligibility, idempotent queue, protected-cron worker, messages, campaign review, unsubscribe and signed webhook | Migration 0037 relational stores and protected Admin surfaces | Six-case acceptance passed; queued intent still is not delivery evidence. |
| Payments and general notifications | No payment or generic notification platform detected | No payment processor or general queue/notification transport found | — | Bounded Contact and active lifecycle email are purpose-specific and are not evidence of a payment or generic notification platform. |

## Admin and CMS

**Detected:** The admin shell, login, protected routes, permission checks, program/casino builders, affiliate management, media manager, lists, editor forms, revisions, previews, publication states, and role-based CMS permissions are present. The data model includes `EditorialStatus`, `AdminRole`, audit logs, program/casino versions and revisions.

**Inferred:** This is a domain-specific CMS/admin implementation for program, casino, affiliate and media operations, rather than evidence of a generic all-content CMS. Article persistence is modeled, but an article admin/editor route was not detected.

## Assessment

- **Implementation completeness estimate: 58%** (historical engineering estimate, not a measurement). The application now also has bounded GB market and commercial-partner authorities, proven Preview/Production isolation and completed RECOVERY-01 managed Preview-restore evidence. Completeness remains reduced by real licensed-domain/partner evidence, external legal approval, Programme operational/deployment gaps and unconfirmed Production integrations.
- **Architecture readiness: 6/10** (historical engineering estimate). A concrete codebase, domain persistence, layering patterns, migrations, auth boundaries, deterministic CI, isolated Preview, managed restore evidence and fail-closed GB commercial authority are ready to inspect. Before regulated launch, the team must still resolve real operator/partner evidence, legal/compliance ownership, routine recovery monitoring/separate Production incident authority and remaining Programme/privacy lifecycle gates.
- **May Phase 2 begin safely?** Yes, as an architecture-alignment phase, provided it treats the observed codebase as evidence to reconcile with Product Vision—not as an approved architecture.
