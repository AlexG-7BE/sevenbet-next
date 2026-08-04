# Repository Structure

## Top-level layout

```text
sevenbet-next/
├── app/              Next.js App Router pages, layouts, route handlers and metadata
├── components/       Public UI, admin builders/editors, shared UI primitives
├── data/             Local JSON data
├── docs/             Product, implementation, and baseline documentation
├── lib/              Auth, CMS, Programme slices, media, affiliate and public-domain logic
├── prisma/           Prisma schema and 17 SQL migrations
├── scripts/          Admin bootstrap, integrity, smoke and visual-QA scripts
├── tests/            Node tests and Playwright browser test
├── .vercel/          Local Vercel-link metadata (not deployment configuration)
├── middleware.ts     Admin-route middleware
├── next.config.mjs   Next configuration
└── package.json      npm manifest and scripts
```

## Routing inventory

| Route category | Detected scope |
| --- | --- |
| Public page routes | 21 non-admin `page.tsx` routes, including dynamic casino, learning and responsible-gambling routes. |
| Admin page routes | 32 `page.tsx` routes under `app/admin/`; 31 are in `(protected)` and `/admin/login` is public. |
| API route handlers | 71 under `app/api/`: auth, administrative CMS/affiliate/media/programme, public resource, legacy progress, and active-control handlers. |
| Non-API route handlers | `/go/[slug]`, `/r/[slug]`, and `/llms.txt`. |
| Metadata routes | `robots.ts` and `sitemap.ts`. |

Route groups do not affect URLs: `(protected)` is an admin implementation grouping. The generic `/admin/[section]` and generic admin/public API resources are dynamic handlers; they are not evidence that every possible entity/resource is implemented.

## Repository statistics and counting rules

The counts exclude `.git/`, `node_modules/`, `.next/`, `test-results/`, `coverage/`, caches, and `tsconfig.tsbuildinfo`. Source files include `.ts`, `.tsx`, `.mjs`, `.prisma`, and migration `.sql` within application areas.

| Measure | Count / result |
| --- | --- |
| Relevant directories | 235 |
| Relevant files | 478 |
| Source files | 390 |
| Test files | 23 |
| Prisma migrations | 17 |
| Application page routes | 56 |
| Admin page routes | 32 |
| API route handlers | 71 |
| Prisma models | 65 |
| Prisma enums | 38 |
| Languages | TypeScript/TSX, JavaScript (MJS), SQL, Prisma schema language, CSS, JSON, Markdown |
| Frameworks | Next.js App Router, React |

**Detected:** no `public/` directory, GitHub Actions workflow, Tailwind/PostCSS configuration, or separate API/server directory. Git metadata has a configured GitHub `origin`; this confirms source hosting only, not a GitHub service integration in the running application.

## Active Control Programme structure

```text
lib/programme/
├── application/      Session, claim, Missions 02–04, artefact, reward, active-day and Dashboard use cases
├── domain/           Mission registry, reward policy, state rules and typed errors
├── infrastructure/   Prisma unit of work and scoped repositories
├── validation/       Shared primitives plus Mission 01–04 validators
├── contract.ts       Stable Programme transport/domain data contracts
├── http.ts           Public error-envelope mapping
├── rate-limit.ts     Provider contract and in-memory development implementation
└── security.ts       Opaque token and request security helpers
```

**Detected:** scoped Programme routes import bounded application use cases and do not import Prisma or the compatibility `ProgrammeFlowService`. The 121-line compatibility facade remains for existing non-route callers and regression coverage; the former central Programme repository is not detected.

**Detected:** `ProgrammeUnitOfWork` provides serializable completion transactions with bounded conflict retry and repeatable-read Dashboard/reward snapshots. Persistence is split across session, progression, artefact, reward/active-day and Dashboard repositories.

**Inferred:** this layout is a bounded hardening of the implemented Missions 01–04, not evidence that Missions 05–10 or the wider target architecture are implemented.
