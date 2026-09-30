# Learn editorial cycles move from a Vercel cron to a ChatGPT scheduled task

**Status:** ACCEPTED. STEP 1 (retire server-side text AI, add `learn_context`) is live since [PR #430](https://github.com/AlexG-7BE/sevenbet-next/pull/430) (`73673889`, Production deployment `dpl_8JTVV3MrJio8bWRk7xmc2M2GoGsP`, 30 September 2026, 12:49 UTC). STEP 2, the ChatGPT scheduled task, is **PENDING STEP 2 / NOT ACTIVE YET** until the Founder confirms it is configured in ChatGPT.

**Decision authority:** explicit Founder instruction, 30 September 2026. Amends [RFC-053](../06_RFC/RFC-053-Autonomous-Learn-Content-Orchestration.md) (§11) and [RFC-052](../06_RFC/RFC-052-Autonomous-Learn-Publication.md) (§2 tool surface). Keeps [LEARN-COMMERCIAL-LOCALIZED-2026-09-30](LEARN-COMMERCIAL-LOCALIZED-2026-09-30.md) as the editorial rule set.

## Decision

Old execution, **retired**:

```text
Vercel cron (hourly) → corporate OPENAI_API_KEY → GPT-6 Astra managed Agents session
  → SEO / Research / Editor subagents → deterministic gate → Learn MCP learn_apply
```

New intended execution, **PENDING STEP 2 / NOT ACTIVE YET**:

```text
ChatGPT scheduled task (one cycle every 8 hours)
  → SEO Growth Lead → Research + Content → Editor + Publisher
  → Learn MCP: learn_context (read-only) → learn_apply (create-only) → Production
```

Vercel no longer starts or reconciles paid OpenAI text-agent sessions for Learn. No replacement server-side LLM path (Claude API, another OpenAI endpoint, Vercel AI, a queue, another cron or GitHub Actions) is introduced.

## STEP 1 — what changed

- `vercel.json` no longer schedules `/api/internal/cron/learn-content`. The two other crons (Programme expiry purge, customer lifecycle) are unchanged.
- The route file stays for observability. It imports nothing and always answers `200 {"result":"NO_OP","code":"CHATGPT_SCHEDULER_OWNS_EXECUTION"}`: it cannot start or inspect a managed session, read or write orchestrator state, or call `learn_apply`.
- The server orchestrator code is deleted: the OpenAI managed-session provider, the cron handler, the server MCP publisher (which required exactly one tool), the state repository, the prompts and the model-output contracts/validation. The unused `openai` npm dependency is removed. The final orchestrator source, including the role prompts and the deterministic publication gate, remains in git at `1150330c` (`lib/learn-content-orchestrator/`).
- `LEARN_CONTENT_AUTONOMY_ENABLED=false` in Vercel Production. No code reads it any more; it stays `false` so a revert cannot silently restart paid server cycles. `LEARN_CONTENT_MIN_INTERVAL_HOURS` and `LEARN_CONTENT_OPENAI_MODEL` are no longer read.
- Learn MCP (`POST /api/mcp/learn`, same bearer authentication, private/no-store) adds one read-only tool, `learn_context`. Discovery now lists exactly `learn_context` and `learn_apply`.
- The historical `learn-content-orchestrator:v1` SiteSetting row is kept untouched as evidence.

## `learn_context`

Input `{ "targetLanguage": "en" }`; the language must be one of the ordered launch languages in `LEARN_CONTENT_LOCALES` (Production `en,sv,da,de`), each validated against the published language registry. It reuses `collectLearnContentSafeContext()` and returns only:

- `generatedAt`; `target` (language, locale, public path prefix); `launchLocales` in configured order; `sourceLocale = en-GB`;
- `articles` (at most 500): id, slug, title, category, locale, published/updated timestamps, public URL of `PUBLISHED` Articles in the target locale, plus the `en-GB` source guides for `sv`, `da` and `de`;
- `categories` (slug, title, description); `publicProgramme` (route, application route, mission count, description); `protectedRoutes`.

It never returns Article prose, drafts, users, analytics, Programme or pause state, vulnerability data, affiliate/conversion data, partner state or secrets. A strict schema rejects any extra field, and the tool has no write path (`readOnlyHint: true`, `destructiveHint: false`, `idempotentHint: true`).

## What does not change

- `learn_apply` stays the sole mutation authority and create-only: `articleId = null`, `expectedUpdatedAt = null`, slug-collision rejection, `requestId` idempotency, first-party image preparation and storage, Article validation, the service audit actor, cache invalidation, public verification, `CREATED | NO_CHANGE` and `LIVE | PERSISTED_NOT_VERIFIED`, compensation of newly created image objects. Success is only `LIVE` + `COMMITTED` + `PUBLISHED` + `verified: true`; `PERSISTED_NOT_VERIFIED` is not success.
- Generated hero images still call the OpenAI Images API (`gpt-image-2`) server-side through `lib/learn-apply/openai-image-adapter.ts` with `OPENAI_API_KEY`, so **OpenAI API image charges remain possible** until a separate migration is authorized. Programme AI also reads `OPENAI_API_KEY` (`lib/programme/program-ai/runtime-config.ts`), so the key must stay in Vercel.

## Editorial specification for STEP 2

The retired orchestrator's behaviour is the specification the ChatGPT task must reproduce:

- **Cadence.** One editorial cycle every 8 hours, at most one Article per cycle, rotating through `launchLocales` in order. `HOLD`, `MERGE` and `DROP` are healthy outcomes. The retired server also capped a cycle at 12 hours and a publication at 3 attempts with the same `requestId`.
- **Roles.** B4GAMBLE SEO Growth Lead → B4GAMBLE Research + Content → B4GAMBLE Editor + Publisher. SEO first; `MERGE`/`HOLD`/`DROP` ends the cycle as `NO_OP` without Research or Editor. Only `CREATE` proceeds: one Research pass, one independent Editor pass, at most two rewrite rounds, otherwise `BLOCKED`. No role publishes; only an Editor `QA_PASS` may call `learn_apply`. Result classes: `NO_OP`, `PUBLISH`, `BLOCKED`.
- **SEO.** Live public web evidence plus `learn_context`; a bounded taxonomy-wide opportunity scan before any `NO_OP`; a weak or duplicate candidate rejects only itself; pure transactional queries belong to offer pages; existing Articles are never update targets. Non-English cycles localize eligible English guides first: `casino-bonuses`, `payments`, `casino-safety`, then `responsible-gambling`, then `game-guides`, `casino-basics`, `casino-glossary`; never `country-guides`, `licensing`, `industry-news`, `crypto-casinos`, `sports-betting-basics` or a guide built on one market's rules. A localization is a new CREATE with a native search intent, a new native ASCII slug and every market fact, regulator, currency/payment fact and support service replaced.
- **Research.** Independent live web search; primary sources first; every material claim mapped to evidence; the answer in the first paragraph; something usable (calculation, checklist, decision rule, exercise or plan); native language, not translation; create-only `LearnApplyInput` with a unique slug, useful alt text and a hero image (16:9, high quality, opaque, restrained editorial image with no text, numbers, logos, brands or real people; alt text in the Article language).
- **Two funnels.** Commercial categories link only their own language's `/{lang}/bonuses`, `/{lang}/casinos` or `/{lang}/best-offers`; no operator names, bonus amounts, rankings, urgency, guaranteed outcomes, affiliate or tracking parameters, `/r/`, `/go/`, `/outbound/` or casino pages. `responsible-gambling` stays commercial-free, leads to `/program?entry=start` (English) or `/{lang}/program?entry=start`, links protected Help and describes the Programme only as a free self-management programme with ten missions. Crisis, loss-of-control, self-harm or severe-harm material gets protected Help and never a commercial CTA.

**Gap to close before relying on STEP 2:** the deterministic gate (evidence mapping, same-language offer links, tracking/affiliate and commercial-route rejection, crisis Help requirement, commercial firewall, mandatory hero image) ran only inside the retired server orchestrator. `learn_apply` itself enforces the schema, create-only identity, slug collision, image handling and public verification, not those editorial rules; `heroImage` is nullable there. Until the gate moves into `learn_apply` (a separate Founder-approved change, because it alters `learn_apply` for every caller), the ChatGPT Editor is the only check on those rules.

## Evidence

- `tests/learn-content-orchestrator.test.ts` and `tests/learn-content-orchestrator-structural.test.ts` (`learn-content-orchestrator:test`, in `ci:quality`): the retired route's fixed response and zero network calls, no cron, no OpenAI SDK or managed-session code, `learn_context` scope per language, 500 ceiling, field allowlist, invalid input, MCP discovery and bearer authentication.
- `tests/learn-content-orchestrator-postgres.test.ts` (both database CI jobs): `learn_context` over real PostgreSQL returns only `PUBLISHED` rows in scope and leaves every Article, SiteSetting, revision and audit row byte-identical.
- `tests/learn-apply.test.ts`: every create-only, idempotency, image and verification test unchanged; discovery lists `learn_context` beside the one mutation tool.
