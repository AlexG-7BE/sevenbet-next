# Technology Stack

## Detected foundation

| Technology | Status and evidence | Active use |
| --- | --- | --- |
| Node.js | Detected runtime; scripts use `node` and package scripts. No repository-level Node version constraint (`engines`, `.nvmrc`, `.node-version`) detected. | Development, build, scripts and tests. |
| npm | Detected from `package-lock.json` and `package.json`. | Package management. |
| Next.js 15 | Detected dependency and imports; App Router under `app/`; `next.config.mjs`. | Web framework, route handlers, metadata, middleware. |
| React 19 | Detected dependency and TSX components. | UI. |
| TypeScript | Detected `tsconfig.json`, `.ts/.tsx` source, `tsc --noEmit`. | Application, services and tests. |
| CSS | Detected `app/globals.css` and component class names. | Global/class-based styling and responsive rules where authored. |
| Prisma 6 + PostgreSQL | Detected package imports, `prisma/schema.prisma`, migrations and `lib/db/prisma.ts`. | ORM/client and persistence. |
| Better Auth 1.6.23 | Detected imports/configuration and `/api/auth/[...all]`. | Email/password session authentication and admin staff resolution. |
| Playwright | Detected dev dependency and `tests/public-casino-browser.spec.ts`. | Browser testing. |
| Node test runner + tsx | Detected test scripts and `.test.ts` files. | Unit/integration-style repository tests and TypeScript scripts. |

## Tooling and configuration

**Detected:** `next build`, `next dev -p 4173`, `next start -p 4173`, Prisma generation via `postinstall`, TypeScript strict/no-emit checking, and multiple focused test scripts.

**Not detected:** ESLint configuration or a working lint dependency. `package.json` declares `next lint`, but no ESLint configuration/package is present and Next.js 15 no longer provides the prior `next lint` command. Tailwind, PostCSS, Docker, a separate UI-component library, Zod/Yup, and a test-coverage configuration are also not detected.

## Dependency caution

All runtime dependencies in `package.json` have corresponding source imports except Prisma, which is used by generation/migrations and imports through `@prisma/client`. No unused-dependency assertion is made beyond that evidence.
