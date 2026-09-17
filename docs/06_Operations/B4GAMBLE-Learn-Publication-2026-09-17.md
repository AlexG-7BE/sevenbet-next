# B4GAMBLE Learn Publication — 17 September 2026

**Status:** COMPLETE — 24/24 ARTICLES PUBLISHED AND VERIFIED IN PRODUCTION

**Authority:** explicit Founder publication instruction of 17 September 2026

**Code PR:** [#304](https://github.com/AlexG-7BE/sevenbet-next/pull/304)

**Reviewed code head:** `93d7c689a1d922004b97446f7adaad47d1ebf18d`

**Code merge / Production main:** `38c93dbb3cb5df0ae6603532c1f91474ead32e84`

**Verified code deployment:** `dpl_HYhAFLV8XggZXh6yT2qZUjQ9neru`

## Evidence boundary

**DETECTED:** the release used the canonical `Article` and `ContentRevision`
models, the existing `ArticleService`, and the existing governed PostgreSQL CMS
lifecycle. It introduced no CMS, content store, MCP, import endpoint,
authentication change, schema change, migration, commercial data change,
tracking change or Learn/Article redesign.

**DETECTED:** the supplied ZIP SHA-256 was
`6b45ac03ca6800ca25d102089249663e0fd4b58247f17c5e09a12e429b32d12a`.
The original `B4GAMBLE_Learn_CMS_Inputs.json` SHA-256 matched the handoff value
`4369a084395ce2f666cf027f4b4821f02cc0fd5e2829c5848b901afa68c2c06e`.
The normalized release corpus after the two evidence-based link corrections
had SHA-256
`2ac8bee2105af8f9f61f29322c57d03a4f5824d96f4e0e2662a111c12027f325`.

**DETECTED:** the only content corrections changed link blocks
`bankroll-limits:b034` and `gambling-journal:b043` from the nonexistent
`/en/product` target to the existing `/en` home target. No prose, category,
slug, title, SEO text or other body block changed.

## Code release

**DETECTED IN PR #304 AND VERIFIED IN PRODUCTION:** Responsible Gambling
related-reading queries now request only `responsible-gambling` Articles. A
second defensive selection filter rejects any non-protected candidate and does
not fall back to casino, bonus, game or other categories when fewer protected
results exist. Non-protected Articles keep their existing cross-category
behavior. `LearningArticleView`, Suspense, cache behavior, typography, layout,
components, responsive presentation and public shell were unchanged.

The focused regression added query-construction and selection/output tests for
protected and general Articles. The reviewed head passed Article Learning,
Responsible Gambling and public IA tests, typecheck, lint, optimized build and
all required GitHub/Vercel contexts, including Database / Migration and Build /
Browser.

## CMS lifecycle result

**DETECTED IN THE GOVERNED PRODUCTION DATABASE AND AUTHENTICATED ADMIN:**

- new Article records created: 24;
- pre-existing Article records overwritten: 0;
- full-document draft update operations: 24;
- requested for review: 24;
- approved: 24;
- published: 24;
- skipped or archived: 0;
- final state: 24 `PUBLISHED`, zero draft and zero in-review records.

Each Article has four immutable `ContentRevision` records and five `AuditLog`
events: create, full-document update, request review, approve and publish. The
final read-only publication journal recorded 24 exact persisted documents and
24 real `publishedAt` / `lastReviewedAt` values against deployed main
`38c93dbb3cb5df0ae6603532c1f91474ead32e84`.

## Published records

| Article ID | Category / slug | Published at (UTC) |
| --- | --- | --- |
| `9006e911-ea3f-4f2d-b478-27914ace1cb9` | [responsible-gambling/signs-gambling-is-a-problem](https://b4gamble.com/en/learn/responsible-gambling/signs-gambling-is-a-problem) | `2026-09-17T17:33:21.348Z` |
| `4b6f4415-b54e-4f19-8e86-c46f502b8be6` | [responsible-gambling/how-to-stop-gambling](https://b4gamble.com/en/learn/responsible-gambling/how-to-stop-gambling) | `2026-09-17T17:33:25.849Z` |
| `d4232db1-9731-4d57-92d4-49f9a27bac76` | [responsible-gambling/how-to-stop-chasing-losses](https://b4gamble.com/en/learn/responsible-gambling/how-to-stop-chasing-losses) | `2026-09-17T17:33:31.634Z` |
| `975893a6-b2a5-4fbe-9a72-bc97d8397378` | [responsible-gambling/how-to-manage-gambling-urges](https://b4gamble.com/en/learn/responsible-gambling/how-to-manage-gambling-urges) | `2026-09-17T17:33:36.445Z` |
| `32d418c5-1cf2-4975-a785-d01d648cd3c1` | [responsible-gambling/bankroll-limits](https://b4gamble.com/en/learn/responsible-gambling/bankroll-limits) | `2026-09-17T17:33:42.254Z` |
| `393b714b-f914-4125-81f0-87171fb38298` | [responsible-gambling/gambling-time-limits](https://b4gamble.com/en/learn/responsible-gambling/gambling-time-limits) | `2026-09-17T17:33:47.373Z` |
| `8a5f3daa-733d-4474-bd10-67f05f4ce82e` | [responsible-gambling/gambling-journal](https://b4gamble.com/en/learn/responsible-gambling/gambling-journal) | `2026-09-17T17:33:53.875Z` |
| `00a2fc76-ece1-4e29-ba76-724705239ae0` | [responsible-gambling/self-exclusion-and-gambling-blocks](https://b4gamble.com/en/learn/responsible-gambling/self-exclusion-and-gambling-blocks) | `2026-09-17T17:33:58.988Z` |
| `fd2cd59c-ddec-4599-991b-62ab86b02f3a` | [responsible-gambling/gambling-to-cope-with-stress](https://b4gamble.com/en/learn/responsible-gambling/gambling-to-cope-with-stress) | `2026-09-17T17:34:04.761Z` |
| `4807a43f-7b43-4ac7-ae5a-f69f35e99980` | [responsible-gambling/gambling-relapse-next-steps](https://b4gamble.com/en/learn/responsible-gambling/gambling-relapse-next-steps) | `2026-09-17T17:34:09.573Z` |
| `2cb48cf5-a1d8-4e56-b889-0da96fc218d6` | [responsible-gambling/supporting-someone-with-a-gambling-problem](https://b4gamble.com/en/learn/responsible-gambling/supporting-someone-with-a-gambling-problem) | `2026-09-17T17:34:15.237Z` |
| `31805a0c-2cf7-40b7-b236-60bcd39efb4b` | [responsible-gambling/gambling-debt-first-steps](https://b4gamble.com/en/learn/responsible-gambling/gambling-debt-first-steps) | `2026-09-17T17:34:20.788Z` |
| `3a2fbe04-7943-4c9b-898b-9a83519a9cb5` | [casino-bonuses/welcome-bonus-terms](https://b4gamble.com/en/learn/casino-bonuses/welcome-bonus-terms) | `2026-09-17T17:32:18.475Z` |
| `41cda3a2-9fb8-4298-998f-4327a6b0a47e` | [casino-bonuses/wagering-requirements](https://b4gamble.com/en/learn/casino-bonuses/wagering-requirements) | `2026-09-17T17:32:23.793Z` |
| `b3b03b79-0d15-4430-83d6-9fb2fe7f27eb` | [casino-safety/choosing-an-online-casino](https://b4gamble.com/en/learn/casino-safety/choosing-an-online-casino) | `2026-09-17T17:32:29.376Z` |
| `5ca08092-ec93-4474-bd10-67f05f4ce82e` | [game-guides/slots-rtp-volatility](https://b4gamble.com/en/learn/game-guides/slots-rtp-volatility) | `2026-09-17T17:32:34.196Z` |
| `88188ddb-c8de-419f-ac1e-d69138e06b35` | [game-guides/blackjack-basics](https://b4gamble.com/en/learn/game-guides/blackjack-basics) | `2026-09-17T17:32:39.554Z` |
| `dccaa4a6-e0cf-462b-97dc-161655cf5545` | [game-guides/live-casino-basics](https://b4gamble.com/en/learn/game-guides/live-casino-basics) | `2026-09-17T17:32:44.888Z` |
| `f5d485f8-f38c-41d7-8504-666e256420d3` | [payments/payments-withdrawals](https://b4gamble.com/en/learn/payments/payments-withdrawals) | `2026-09-17T17:32:51.338Z` |
| `e6107164-6bcb-481b-ac15-f04925470544` | [casino-safety/mobile-casino-safety](https://b4gamble.com/en/learn/casino-safety/mobile-casino-safety) | `2026-09-17T17:32:56.877Z` |
| `747721dc-4dda-461b-8d44-6e46f048512b` | [crypto-casinos/crypto-casino-risks](https://b4gamble.com/en/learn/crypto-casinos/crypto-casino-risks) | `2026-09-17T17:33:01.373Z` |
| `ffa42a55-76ed-442a-9513-6f2ea95d404e` | [sports-betting-basics/sportsbook-bonus-basics](https://b4gamble.com/en/learn/sports-betting-basics/sportsbook-bonus-basics) | `2026-09-17T17:33:06.084Z` |
| `48a8c02f-5979-4318-b3ea-bf491859e6aa` | [casino-glossary/gambling-glossary](https://b4gamble.com/en/learn/casino-glossary/gambling-glossary) | `2026-09-17T17:33:11.408Z` |
| `47e94cbc-32ab-4b54-959d-37c0db332a8e` | [industry-news/gambling-industry-updates](https://b4gamble.com/en/learn/industry-news/gambling-industry-updates) | `2026-09-17T17:33:16.655Z` |

## Production acceptance

**VERIFIED ON THE CANONICAL PUBLIC SITE:**

- `/en/learn` reports 24 guides and contains all 24 unique canonical Article
  links; search returned the exact gambling-journal result and the Responsible
  play filter returned exactly 12 matching guides;
- all 24 public routes returned meaningful HTTP 200 Article pages and every
  persisted body fragment and link block was present in the rendered output;
- every page had the intended SEO title and description, self canonical, no
  accidental `noindex`, and consistent Article and BreadcrumbList JSON-LD;
- `sitemap.xml` contained all 24 canonical routes;
- all 32 unique internal Article/help/methodology/category targets returned a
  meaningful 200 result after redirects; all 37 distinct external source URLs
  were checked directly or against their official page when automated fetching
  was blocked;
- all 12 Responsible Gambling pages rendered three same-category `READ NEXT`
  links, protected Help, the neutral contextual CTA, and no casino, bonus,
  affiliate or redirect link inside the Article surface;
- desktop `1280 × 720` and mobile `390 × 844` Learn/Article checks found no
  horizontal overflow; the long debt heading, no-image hero, content sections,
  source blocks and responsive navigation remained readable;
- contents links resolved to real heading IDs and scrolled the selected heading
  into view; relevant browser console inspection found no page runtime errors;
- authenticated Production Admin reported Articles 24, Published 24, In review
  0 and Drafts 0.

The release does not claim search-engine indexing, ranking or traffic. No
independent clinical review was performed or inferred; editorial review and
Founder publication authority are recorded separately from clinical review.

## Bounded rollback and recovery

Rollback must target only the 24 IDs in this record. Through the existing
authorized CMS/service path, transition each affected `PUBLISHED` Article to
`ARCHIVED` with the real actor and optimistic concurrency value. This preserves
the Article, all revisions and audit history and invokes the existing public
Article cache invalidation. Do not delete rows or revisions.

To recover content, use the existing archive/restore transition to return the
specific Article to draft, restore the intended immutable `ContentRevision` if
required, then repeat review, approval and publication. Code rollback, if ever
required, reverts PR #304 through the normal RFC-013 PR/deployment path; it does
not change Article content state or undo migration `0043`.
