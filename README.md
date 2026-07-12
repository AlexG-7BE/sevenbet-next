# SevenBet Next

Production-oriented React/Next rebuild of the SevenBet mindful gambling + casino affiliate site.

## Run

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:4173
```

## What Is Included

- Next App Router structure
- Component-based design system
- Typed casino data layer
- Control-first homepage funnel
- Self-check client page
- Budget calculator client page
- 10-step program page
- Bonus guide
- Best bonuses page
- Catalog and casino detail pages
- Playwright visual QA script

## Visual QA

Start the site first:

```bash
npm run dev
```

Then:

```bash
npm run visual:qa
```

The script checks important routes for one `h1`, horizontal overflow and saves screenshots.

## AI and crawler access

The site exposes:

- `/robots.txt`
- `/sitemap.xml`
- `/llms.txt`

Set the public production URL in Vercel:

```text
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

This keeps sitemap and AI-readable links canonical after deployment.

## CMS Phase 1

The project includes a Phase 1 headless CMS foundation:

- admin preview shell at `/admin`;
- temporary token gate through `SEVENBET_ADMIN_PREVIEW_TOKEN`;
- admin CRUD API at `/api/admin/:entity`;
- public read API at `/api/public/:resource`;
- safe affiliate redirect route at `/go/:slug`;
- Prisma schema and SQL migration under `prisma/`;
- CMS architecture notes in `docs/cms-phase-1.md`.

Run the lightweight CMS checks:

```bash
npm run cms:test
```

Open admin locally with:

```text
http://localhost:4173/admin?token=phase-1-local-admin
```

For production, set a long random `SEVENBET_ADMIN_PREVIEW_TOKEN` in the hosting environment before opening `/admin`.

## Next Build Steps

- Replace the in-memory CMS repository with Prisma and PostgreSQL.
- Add production admin authentication and invitations.
- Add persistent program progress with localStorage or user accounts.
- Add real filter/search state to `/catalog`.
- Split casino data enrichment into CMS-ready fields.
- Add country, payment and provider SEO pages.
- Add editorial methodology and affiliate disclosure pages.
# sevenbet-next
