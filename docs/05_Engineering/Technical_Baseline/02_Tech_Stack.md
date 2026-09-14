# Technology Stack

## Detected foundation

| Technology | Status and evidence | Active use |
| --- | --- | --- |
| Node.js 24.x | Detected `package.json` engine; verified Vercel Production major and CI setup match it. | Development target, build, scripts and tests. |
| npm | Detected from `package-lock.json` and `package.json`. | Package management. |
| Next.js 15.5.21 | Detected exact dependency and imports; App Router under `app/`; `next.config.mjs`. | Web framework, route handlers, metadata, middleware. |
| React 19 | Detected dependency and TSX components. | UI. |
| TypeScript | Detected `tsconfig.json`, `.ts/.tsx` source, `tsc --noEmit`. | Application, services and tests. |
| CSS | Detected `app/globals.css` and component class names. | Global/class-based styling and responsive rules where authored. |
| Prisma 6 + PostgreSQL | Detected package imports, `prisma/schema.prisma`, migrations and `lib/db/prisma.ts`. | ORM/client and persistence. |
| Better Auth 1.7.1 | Detected exact root dependency, configuration and `/api/auth/[...all]`. The operational OAuth Provider dependency/plugin and custom connector routes are absent in PR5. | Email/password sessions, Admin staff resolution, Programme continuation and optional Google identity-only authentication. |
| Zod 4.4.3 | Detected exact dependency and strict RFC-046 event/template/campaign input schemas. | Closed, bounded request and domain validation. |
| sanitize-html 2.17.5 | Detected exact dependency in versioned RFC-046 template administration. | Allowlist sanitization before template persistence/rendering. |
| Svix 1.99.1 | Detected exact dependency in the RFC-046 Resend webhook receiver. | Exact raw-body signature verification before event normalization. |
| Playwright 1.61.1 resolved | Detected dev dependency, lockfile and browser suites. | Chromium browser testing; required OPS manifest uses an isolated local production build. |
| ESLint 9.39.5 + eslint-config-next 15.5.21 | Detected exact dev dependencies and flat config. | Required static analysis with zero warnings. |
| PostCSS 8.5.23 + Sharp 0.35.0 | Detected bounded npm overrides beneath Next.js 15.5.21. | Patched transitive build/image dependencies; retained only after quality, build and browser regression. |
| Node test runner + tsx | Detected test scripts and `.test.ts` files. | Unit/integration-style repository tests and TypeScript scripts. |

## Tooling and configuration

**Detected:** `next build`, `next dev -p 4173`, `next start -p 4173`, Prisma generation via `postinstall`, TypeScript strict/no-emit checking, ESLint, explicit deterministic Node-test manifests, isolated browser CI, build-secret scanning, guarded fresh-PostgreSQL migration verification, fixed first-party analytics dashboards, aggregate-only RFC-046 sanity, bounded cron/readiness CLIs, and the read-only PR5 Commercial projection.

**Not detected:** Vercel Analytics runtime/package, Tailwind, a separate UI-component library, Yup, a test-coverage threshold, repository Docker image or infrastructure-as-code. The repository defines PostgreSQL as a disposable GitHub Actions service for CI; hosted Prisma Postgres authority is documented separately. Neither is an application-container architecture.

## Dependency caution

All root runtime dependencies in `package.json` have corresponding source
imports except Prisma, which is used by generation/migrations and imports
through `@prisma/client`. The root manifest and lockfile contain no MCP SDK or
operational OAuth Provider. The isolated `agents/` package retains the official
`@openai/agents` SDK; its lockfile contains a transitive MCP client, but Agent
source has no MCP imports/tools and the package is excluded from Next.js. No
unused-dependency assertion is made beyond that evidence.
