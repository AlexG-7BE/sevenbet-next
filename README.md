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

## Next Build Steps

- Add persistent program progress with localStorage or user accounts.
- Add real filter/search state to `/catalog`.
- Split casino data enrichment into CMS-ready fields.
- Add country, payment and provider SEO pages.
- Add editorial methodology and affiliate disclosure pages.
# sevenbet-next
