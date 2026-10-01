# The server Learn cycle returns behind a switch, on GPT-5.6 Sol

**Status:** ACCEPTED — ships with the PR that adds this record. Production activation (`LEARN_CONTENT_AUTONOMY_ENABLED=true`, `LEARN_CONTENT_OPENAI_MODEL=gpt-5.6-sol`) is recorded in [CURRENT_STATE](../CURRENT_STATE.md) only after it is observed.

**Decision authority:** explicit Founder instruction, 1 October 2026: bring back the server pipeline that ran before [LEARN-CHATGPT-SCHEDULER-2026-09-30](LEARN-CHATGPT-SCHEDULER-2026-09-30.md) as a switch, turn it on at once, and run it on GPT-5.6 Sol instead of GPT-6 Astra. Amends [RFC-053](../06_RFC/RFC-053-Autonomous-Learn-Content-Orchestration.md) (§12) and partly reverses its §11.

## Decision

- **Restored.** The hourly Vercel cron `/api/internal/cron/learn-content` (`13 * * * *`), the managed OpenAI Agents session provider, the cron handler, the server MCP publisher, the state repository, the role prompts, the model contracts and the deterministic publication gate return exactly as they were at `1150330c`, with the `openai` SDK dependency. The `learn-content-orchestrator:v1` state row resumes from where it stopped.
- **Switch.** `LEARN_CONTENT_AUTONOMY_ENABLED` decides who runs Learn editorial cycles. Exactly `true`: the server cycle runs. Anything else: the cron answers `NO_OP / AUTONOMY_DISABLED` without touching state, a provider or the MCP, and the ChatGPT scheduled task may own the cycle. Changing it is a Vercel variable change plus a redeploy; no code change. Never run both at once: `learn_apply` rejects a duplicate slug, not a duplicate topic.
- **Model.** The only allowed model is `gpt-5.6-sol` (default and allowlist; `LEARN_CONTENT_OPENAI_MODEL` must say `gpt-5.6-sol` or be empty). `gpt-6-astra` now fails closed as `CONFIGURATION_INVALID`. Official pricing at the time of the decision: $4 input and $20 output per 1M tokens, doubled input and 1.5× output for requests above 272K input tokens. Recorded Astra cycles used 1.6–3.8M input tokens each.
- **`learn_context` stays.** The read-only tool from 30 September remains for the Founder's Claude Code and for checks. The server publisher now accepts the Learn MCP surface `learn_apply` plus `learn_context` and still fails closed on any other tool.
- **Publication timeout.** The server's `learn_apply` call may take up to 240 s instead of the MCP SDK's 60 s default. On 30 September an image-generating call committed after 108 s while the server had already given up, which cost one hourly retry.

Unchanged: `learn_apply` is the sole, create-only mutation; the three roles, SEO-first `NO_OP`, rewrite limit, two funnels, localization, hero-image and firewall rules of RFC-053 §§2, 5, 7 and 10; the 8-hour minimum interval; the 12-hour lease; three publication attempts; generated images through `gpt-image-2`.

## Later on 1 October: cadence and ChatGPT

- **Cadence.** The Founder set one new server cycle per 24 hours: Production `LEARN_CONTENT_MIN_INTERVAL_HOURS=24` (the code default and floor stay 8).
- **No ChatGPT.** The Founder drops the ChatGPT subscription and its agents and works only through Claude Code. The ChatGPT scheduled task of LEARN-CHATGPT-SCHEDULER-2026-09-30 is cancelled, not pending. Learn work runs in two places: the server cycle on the OpenAI API, and the Founder's Claude Code, which connects to the Learn MCP with the existing service bearer (and the owner cookie, because the Kazakhstan geo-block also covers `/api/mcp/learn`). The service token is not rotated.
- **One language, one writer.** While Claude Code localizes guides into `sv`, `da` and `de`, the server rotates English only (`LEARN_CONTENT_LOCALES=en`), so two writers never cover the same topic in the same language.
- **OpenAI stays for what Claude cannot do or what runs inside the product:** server text cycles, hero images (`gpt-image-2`), Programme guidance and voice transcription.

## Same-day localization by Claude Code

Founder, 1 October 2026, after the first localization batch (69 guides: 23 each in `sv`, `da` and `de`): the server keeps writing English only, and every new eligible English guide is localized into Swedish, Danish and German by the Founder's Claude Code on the same day. A daily scheduled Claude Code task does it through the Learn MCP, one `learn_apply` at a time, with the localization toolkit kept outside the repository (validator, writer brief, market fact sheets, ledger of source → localized slug). To serve it without database credentials or the geo-block:

- `learn_context` accepts any published language as `targetLanguage`; `launchLocales` still reports the server's own rotation;
- a new read-only `learn_source` tool returns the public content of one published Article by slug (title, excerpt, tags, SEO fields, hero alt text, body blocks), never drafts, authorship or lifecycle fields;
- the server publisher accepts the Learn MCP surface `learn_apply` plus the read-only `learn_context` and `learn_source`.

## First run after activation

The state row still holds run `a173598b-cd32-447c-9387-630710d134e7` as active with a lease that ended on 1 October 00:13 UTC. Its Article (`/en/learn/game-guides/roulette-odds-explained`) was already published on 30 September. The first cron after activation closes that run as `FAILED / ACTIVE_LEASE_EXPIRED` and, because its next eligible time has passed, launches a new cycle at the next language in the rotation (Swedish, cursor 1 of `en,sv,da,de`).

## Evidence

- `tests/learn-content-orchestrator.test.ts`, `tests/learn-content-orchestrator-structural.test.ts` and `tests/learn-context.test.ts` (`learn-content-orchestrator:test`, in `ci:quality`): the restored cycle's suite, `gpt-5.6-sol` as the only model with Astra rejected, the two-tool publisher surface, the 240 s timeout and the `learn_context` scope tests.
- `tests/learn-content-orchestrator-postgres.test.ts` and `tests/learn-context-postgres.test.ts` (`learn-content-orchestrator:postgres-test`, both database CI jobs).
