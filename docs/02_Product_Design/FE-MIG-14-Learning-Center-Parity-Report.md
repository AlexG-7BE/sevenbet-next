# FE-MIG-14 — Learning Center parity report

Date: 2026-08-07

Branch: `codex/fe-mig-14-learning-center`

Base: `8c414429edc0ffb100fda83083de85ad1492e180`

## Authority and scope

- `/learn`: active Figma root `835:6356`; desktop `835:6359`; mobile `835:6473`; 375 first fold `835:6590`; search/filter `835:6414`; learning paths `835:6439`; no-results `835:6465`.
- `/learn/[category]`: desktop `632:4360`; mobile `634:2177`.
- `/learn/[category]/[slug]`: desktop `633:4341`; 1,280 first fold `633:4529`; mobile `635:2148`; unavailable `635:2254`; 375 first fold `635:2304`.
- Unchanged boundaries: Public Header/Footer, Protected Help, Active Control Programme, affiliate redirect services, database schema, APIs and CMS workflows.

## Detected implementation baseline

- 13 current categories, 13 current articles, 15 tag definitions and six current learning paths in `lib/learning-center.ts`.
- Article records provide category, title, summary, difficulty, reading time, tags, author, editor, update date, feature/popularity flags, takeaways, sections, examples, editorial callout, FAQ and related reading.
- Claim-level evidence links, source ownership, review-due dates and compliance-review states are not detected.

## Implemented parity

- The photo-led, sharp-crop, acid-yellow, asymmetric editorial hierarchy is implemented without replacing it with equal SaaS-style cards.
- All current category and article routes remain generated and invalid category/article pairs return 404.
- The complete current article catalogue is rendered in initial HTML. A bounded client island adds case-insensitive query matching over title, summary, category title and tags, plus category/tag/difficulty facets, live result count, clear action and no-results recovery.
- Category pages render only current article records. A category with no record fails closed to an editorial under-review state and does not fall back to offers.
- Neutral article pages render direct answer, current sections/examples/callout, explicit source-unavailable status, visible FAQ and related reading. An internal comparison transition appears only after educational value and disclosure. The responsible-gambling Learning article has no commercial transition and routes to protected Help.
- Existing canonical, BreadcrumbList, Article and visible FAQ/FAQPage contracts remain aligned.

## Asset provenance

- `public/learn/magazine-shelf-charles-postiaux.jpg`: exact licensed Figma asset from node `835:6360`; layer attribution identifies Charles Postiaux / Unsplash.
- `public/learn/welcome-bonus-feature-cover.png`: exact Figma-rendered editorial cover from node `835:6373` (`PAWEL MATERIAL REFINED`). No additional licence claim is inferred.

## Accessibility and semantic audit

- Exactly one page-level `h1` per route template; ordered heading hierarchy beneath it.
- Breadcrumbs and category/related groups use semantic navigation; catalogues and paths use ordered lists; FAQ uses native `details`/`summary`.
- Search has associated labels, native search/select controls, `aria-live` result count and keyboard-operable recovery actions.
- Focus states remain visible, controls meet the 44 px target, reduced-motion treatment removes decorative transforms, and no horizontal overflow was detected from 1,440 through 320 CSS pixels.
- Browser monitoring detected no hydration, page or console errors.

## No-JavaScript architecture

`app/(public)/learn/page.tsx` and all route views are server components. `LearningSearchAndFilter` is the only client component. Next.js emits its complete 13-result initial markup from serialisable server props, so all current article and category links remain readable and usable when JavaScript is disabled; hydration adds only filtering and result recovery.

## Verification

- `npm run fe-mig-14:test`: 6 passed.
- `npm run typecheck`: passed.
- `npm run build`: passed. Existing Prisma direct-endpoint production warnings remain unrelated to FE-MIG-14.
- `npx playwright test tests/learning-center-browser.spec.ts`: 22 passed.
- Public Shell, Home, 10 Steps, Protected Help, Methodology, Affiliate Disclosure and About browser regression group: 90 passed.
- Direct screenshot comparison completed for `/learn` at 1,440 × 900 and 390 × 844 against the authority above.

## Known deviations and release gates

- The current data model cannot support verified/review-due evidence variants. The implementation therefore uses the approved unavailable treatment and makes no verification or compliance-review claim.
- The current article copy is the existing seed content and still requires normal editorial/content release review; this implementation does not promote planned topics into published content.
- The Public Shell is intentionally reused as implemented rather than changed to match screen-local mock chrome.
- Merge, Vercel Preview and Founder Office review remain required. No merge is authorised by FE-MIG-14.
