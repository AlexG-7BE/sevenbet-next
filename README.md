# SevenBet Next

SevenBet is a decision-support platform for adults considering regulated gambling. It combines neutral discovery with a private, control-first 10-Step Programme. It is not a gambling operator and this repository is not evidence of market or launch approval.

## Architecture

- **Next.js 15 App Router / React 19** with server components by default and bounded client islands for interactive controls.
- **Public Shell** for acquisition, learning, legal and commercial-discovery routes.
- **Programme shell and services** for the private 10-Step journey. Missions 01–04 are implemented; Missions 05–10 remain future product work.
- **Protected Help shell** for `/responsible-gambling` and its ten governed articles, isolated from casino, bonus and affiliate recovery.
- **Casino and offer services** that project latest published CMS snapshots through server-owned repositories and public DTOs.
- **Governed commercial handoff** from confirmation UI to managed same-origin `/r/[slug]`; failures return to neutral `/outbound/unavailable`. `/go/[slug]` is compatibility-only.
- **Private control tools:** `/self-check` is an eight-question, non-clinical local reflection; `/tools/budget-calculator` is the user-defined Personal Gambling Limit Tracker. Neither produces a commercial recommendation.
- **Legal surfaces:** substantive `/privacy` and `/terms` pages are server-rendered, `noindex, follow`, and intentionally excluded from the XML sitemap pending release governance.
- **Admin/CMS:** Prisma/PostgreSQL repositories, Better Auth staff access, and domain-specific programme, casino, editorial, media and affiliate builders.

The public page-level frontend migration and FE-DS-01 Design System v1 consolidation are merged. OPS-01 establishes deterministic CI, release governance and operational runbooks; separate product, legal/compliance, data-partner, environment-isolation and recovery gates remain.

## Local development

Prerequisites: Node.js 24.x and the environment values described in `.env.example`.

```bash
npm install
npm run dev
```

Open <http://localhost:4173>.

## Validation

```bash
npm run typecheck
npm run lint
npm run build
npm run ci:structural
npm run ci:browser
npm run cms:test
npm run programme:test
```

`npm run ci:migrations` is intentionally CI-only and refuses any database except loopback port 5432 with a name ending in `_ci`. `npm run ops:smoke` performs read-only checks against the production origin. The Programme suite currently includes seven known rolling-date fixture failures and remains visible but non-required in CI.

## Documentation

- [Product Vision & Principles](docs/Product-Vision-and-Principles.md) — constitutional product authority.
- [Project State](docs/PROJECT_STATE.md) — concise current-state ledger.
- [Roadmap](docs/ROADMAP.md) — delivery sequence and remaining gates.
- [Figma inventory](docs/02_Product_Design/Figma-Screen-Inventory-and-Delivery-Plan.md) — current visual authorities and implementation classification.
- [Technical baseline](docs/05_Engineering/Technical_Baseline/README.md) — evidence-backed implementation baseline.
- [Operations](docs/06_Operations/README.md) — release, environment, migration, recovery and incident runbooks.
