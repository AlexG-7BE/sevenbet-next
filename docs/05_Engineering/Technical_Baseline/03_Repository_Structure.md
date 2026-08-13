# Repository Structure

## Top-level layout

```text
sevenbet-next/
├── agents/           Isolated private operational-agent package; not imported by the consumer runtime
├── app/              Next.js App Router pages, layouts, route handlers and metadata
├── components/       Public UI, admin builders/editors, shared UI primitives
├── data/             Local JSON data
├── docs/             Product, implementation, and baseline documentation
├── lib/              Auth, CMS, Programme slices, media, affiliate and public-domain logic
├── prisma/           Prisma schema and 19 SQL migrations
├── public/           88 tracked public image/SVG assets at current main
├── scripts/          Admin bootstrap, integrity, smoke and visual-QA scripts
├── tests/            Node tests and Playwright browser tests
├── .github/          Required CI, scheduled smoke, CODEOWNERS, PR template and Dependabot
├── .vercel/          Local Vercel-link metadata (not deployment configuration)
├── middleware.ts     Admin-route middleware
├── next.config.mjs   Next configuration
└── package.json      npm manifest and scripts
```

## Routing inventory

| Route category | Detected scope |
| --- | --- |
| Public/non-admin page routes | 31 `page.tsx` files, including dynamic casino, learning and responsible-gambling routes. |
| Admin page routes | 32 `page.tsx` files under `app/admin/`; 31 are in `(protected)` and `/admin/login` is public. |
| API route handlers | 90 `route.ts` files under `app/api/`: auth, administrative CMS/affiliate/media/programme, Contact, Cron, public resources, legacy progress and active-control handlers. |
| Non-API route handlers | `/go/[slug]`, `/r/[slug]`, and `/llms.txt`. |
| Metadata routes | `robots.ts` and `sitemap.ts`. |

Route groups do not affect URLs: `(protected)` is an admin implementation grouping. The generic `/admin/[section]` and generic admin/public API resources are dynamic handlers; they are not evidence that every possible entity/resource is implemented.

## Repository statistics and counting rules

The counts use tracked current-main paths and exclude `.git/`, dependencies, generated/build/test output, caches and `tsconfig.tsbuildinfo`. Source files include tracked `.ts`, `.tsx`, `.mjs`, `.prisma`, and migration `.sql` across the repository, including the isolated `agents/` package and tests.

| Measure | Count / result |
| --- | --- |
| Tracked files at current main | 996 |
| Source files (`.ts`, `.tsx`, `.mjs`, `.prisma`, migration `.sql`) | 665 |
| TS/TSX/MJS test/spec files under `tests/` | 94, plus one CJS test |
| Prisma migrations | 19 |
| Application page routes | 63 |
| Admin page routes | 32 |
| API route handlers | 90 |
| Public assets | 88 |
| Prisma models | 68 |
| Prisma enums | 38 |
| Languages | TypeScript/TSX, JavaScript (MJS/CJS), SQL, Prisma schema language, CSS, JSON, Markdown |
| Frameworks | Next.js App Router, React |

**Detected:** a populated `public/` directory is present; Tailwind configuration and a separate API/server directory are not. GitHub Actions provides deterministic PR jobs and a scheduled Production smoke. Git metadata has a configured GitHub `origin`; there is no GitHub service integration in the running application.

## Active Control Programme structure

```text
lib/programme/
├── application/      Session, claim, legacy Missions 01–04, PROGRAM-AI M1–M10, artefact, reward, active-day and Dashboard use cases
├── domain/           Mission registry, reward policy, state rules and typed errors
├── infrastructure/   Prisma unit of work and scoped repositories
├── validation/       Shared primitives plus Mission 01–04 validators
├── program-ai/       M1–M10 contracts, exact validation, registry/reward policy, OpenAI adapters and bounded guidance
├── contract.ts       Stable Programme transport/domain data contracts
├── http.ts           Public error-envelope mapping
├── rate-limit.ts     Shared PostgreSQL fixed-window runtime limiter with isolated-test memory seam
├── runtime-expiry-*  Bounded transient purge, Cron authority and execution helper
└── security.ts       Opaque token and request security helpers
```

**Detected:** scoped Programme routes import bounded application use cases and do not import Prisma or the compatibility `ProgrammeFlowService`. The compatibility facade remains for existing non-route callers and regression coverage; the former central Programme repository is not detected.

**Detected:** `ProgrammeUnitOfWork` provides serializable completion transactions with bounded conflict retry and repeatable-read Dashboard/reward snapshots. Persistence is split across session, progression, artefact, reward/active-day and Dashboard repositories.

**Detected:** the RFC-022 M1 slice remains mission-specific. RFC-025's approved bounded PROGRAM-AI registry/coordinator implements Missions 02–10 without growing the compatibility `ProgrammeFlowService` or introducing a runtime plugin/workflow DSL. Concrete OpenAI adapters remain below provider-neutral ports.

**Detected:** migration 0019 adds the shared transient rate-limit bucket; bounded purge code covers expired anonymous sessions, unconsumed claims and expired buckets, with a separately authenticated Cron route. Deployment activation remains an operations fact, not inferred from code.
