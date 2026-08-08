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
| Better Auth 1.6.23 | Detected imports/configuration and `/api/auth/[...all]`. | Email/password session authentication and admin staff resolution. |
| Playwright 1.61.1 resolved | Detected dev dependency, lockfile and browser suites. | Chromium browser testing; required OPS manifest uses an isolated local production build. |
| ESLint 9.39.5 + eslint-config-next 15.5.21 | Detected exact dev dependencies and flat config. | Required static analysis with zero warnings. |
| Node test runner + tsx | Detected test scripts and `.test.ts` files. | Unit/integration-style repository tests and TypeScript scripts. |

## Tooling and configuration

**Detected:** `next build`, `next dev -p 4173`, `next start -p 4173`, Prisma generation via `postinstall`, TypeScript strict/no-emit checking, ESLint, explicit deterministic Node-test manifests, isolated browser CI, build-secret scanning and guarded fresh-PostgreSQL migration verification.

**Not detected:** Tailwind, a separate UI-component library, Zod/Yup, a test-coverage threshold, repository Docker image or infrastructure-as-code. PostgreSQL runs as a GitHub Actions service only; it is not an application container architecture.

## Dependency caution

All runtime dependencies in `package.json` have corresponding source imports except Prisma, which is used by generation/migrations and imports through `@prisma/client`. No unused-dependency assertion is made beyond that evidence.
