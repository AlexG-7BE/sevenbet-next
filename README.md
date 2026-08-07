# SevenBet Next

SevenBet is an online-casino-first, regulated-first decision-support product for adults. It combines public discovery and education with a private 10-Step Programme and a separate, non-commercial Protected Help area.

The approved product authority is [Product Vision & Principles](docs/Product-Vision-and-Principles.md). Read [Project State](docs/PROJECT_STATE.md) and the [Roadmap](docs/ROADMAP.md) before planning work.

## Current implementation

- Next.js App Router public and admin application
- server-owned Public Shell with responsive navigation and account presentation
- Home and `/10-steps` acquisition journeys
- database-backed Casino Directory, Casino Profile, Bonuses, Best Offers and Comparison
- Learning Center with category/article routes and E05 client-side search/filter over an SSR catalogue
- Affiliate Disclosure, Ranking Methodology, About and Bonus Guide
- dedicated Protected Help routes under `/responsible-gambling/**`
- private Programme flow through Missions 01–04 with server-owned progress and deterministic rewards
- Prisma/PostgreSQL, Better Auth, CMS/editorial, media and affiliate-routing foundations

The page-level frontend migration programme is complete. Frontend/design-system consolidation is not: **FE-DS-01 — Frontend & Design System Consolidation** is the next authorized frontend workstream.

## Documentation map

- [Project State](docs/PROJECT_STATE.md) — current operational truth
- [Roadmap](docs/ROADMAP.md) — forward execution sequence
- [Figma Screen Inventory](docs/02_Product_Design/Figma-Screen-Inventory-and-Delivery-Plan.md) — current route/family/status authority
- [Frontend Migration Record](docs/02_Product_Design/Frontend-Migration-Audit-and-P0-Implementation-Plan.md) — completed historical migration record
- [Technical Baseline](docs/05_Engineering/Technical_Baseline/README.md) — evidence-based implementation baseline

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:4173`.

## Validation commands

```bash
npm run typecheck
npm run build
npm run cms:test
```

Focused route and domain tests are listed in `package.json`. The repository's `npm run lint` command still invokes the deprecated interactive `next lint` path and is not a configured non-interactive lint gate.

## Visual QA

With the application running:

```bash
npm run visual:qa
```

The script checks selected routes for one `h1`, horizontal overflow and screenshot output. It is not a maintained visual-regression system; that decision belongs to FE-DS-01.

## Public origin

Set the production origin in the deployment environment:

```text
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

This keeps canonical URLs, sitemap, robots and structured data aligned with the deployed host.
