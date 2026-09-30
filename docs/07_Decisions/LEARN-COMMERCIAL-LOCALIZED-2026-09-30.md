# Learn serves two funnels, in every launch language, with a hero image

**Status:** PROPOSED — NOT YET LIVE until merged and deployed

**Decision authority:** explicit Founder instructions, 30 September 2026: Learn guides must lead to revenue (partner CTA through the offer pages) and to the Programme start and registration; guides are localized into the launch languages; every guide has a picture. The Founder rewrote the three ChatGPT agent instructions (SEO Growth Lead, Research + Content, Editor + Publisher) to match and asked for the same rules in the autonomous pipeline. Amends [RFC-053](../06_RFC/RFC-053-Autonomous-Learn-Content-Orchestration.md) §§5 and 7 (§10).

## Decision

- **Commercial funnel.** Guides in `casino-bonuses`, `payments`, `casino-safety`, `game-guides`, `casino-basics`, `casino-glossary` and `country-guides` answer the questions of adults who gamble and lead to the offer pages of their own language (`/{lang}/bonuses`, `/{lang}/casinos`, `/{lang}/best-offers`). No casino or operator names, bonus amounts, rankings, urgency, casino pages, click redirects or tracking. Game and country guides join the automatic offer bridge (`lib/articles/article-bridges.ts`), which still shows offers only where they may be presented.
- **Programme funnel.** `responsible-gambling` guides stay commercial-free and now lead to the free Programme start: the page shows the mid-guide Programme block and a Start Programme action beside Responsible Gambling and Help (`LearningArticleView`). Before this decision these guides showed no Programme block and ended with Help only. The closing Programme block of every guide is localized instead of hard-coded English.
- **Localization.** English guides are localized into Swedish, Danish and German as new articles with native slugs, market facts and support services, commercial guides first, then `responsible-gambling`. The autonomous pipeline gives runs in another language the English inventory as source (`learnContentInventoryLocales`).
- **Language hubs.** `/{lang}/learn` lists its own guides first, then the English guides marked as English, so the first translation no longer hides the rest.
- **Hero image.** Every autonomous Article carries a hero image (`HERO_IMAGE_REQUIRED`).
- **Firewall gap closed.** The publication firewall now judges localized paths like bare ones, so `/en/casino/…`, `/sv/r/…` and similar routes are rejected; before, only unprefixed commercial routes were.

## Evidence

- `tests/learn-content-orchestrator.test.ts` (`learn-content-orchestrator:test`, in `ci:quality`): same-language offer links pass only in commercial categories, wrong-language, query-string, casino, `/r/`, `/go/`, `/outbound/` and protected-guide offer links fail, Programme links pass in protected guides, a missing hero image fails.
- `tests/learning-center-parity.test.ts` (in `ci:structural`): the bridge categories and the protected guide's Programme block, Start Programme action and Help link.
- `tests/crawler-ready-metadata.test.ts` (`seo-crawler:test`): the mixed language hub.

## Not in this change

- `LEARN_CONTENT_LOCALES` on Vercel stays `en` until the Founder approves the hosted change to `en,sv,da,de`.
- `learn_apply` creates only; existing guides get no hero image or Programme link block through the agents.
