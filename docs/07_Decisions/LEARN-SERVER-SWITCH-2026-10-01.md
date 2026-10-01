# The server Learn cycle returns behind a switch, on GPT-5.6 Sol

**Status:** ACCEPTED — ships with the PR that adds this record. Production activation (`LEARN_CONTENT_AUTONOMY_ENABLED=true`, `LEARN_CONTENT_OPENAI_MODEL=gpt-5.6-sol`) is recorded in [CURRENT_STATE](../CURRENT_STATE.md) only after it is observed.

**Decision authority:** explicit Founder instruction, 1 October 2026: bring back the server pipeline that ran before [LEARN-CHATGPT-SCHEDULER-2026-09-30](LEARN-CHATGPT-SCHEDULER-2026-09-30.md) as a switch, turn it on at once, and run it on GPT-5.6 Sol instead of GPT-6 Astra. Amends [RFC-053](../06_RFC/RFC-053-Autonomous-Learn-Content-Orchestration.md) (§12) and partly reverses its §11.

## Decision

- **Restored.** The hourly Vercel cron `/api/internal/cron/learn-content` (`13 * * * *`), the managed OpenAI Agents session provider, the cron handler, the server MCP publisher, the state repository, the role prompts, the model contracts and the deterministic publication gate return exactly as they were at `1150330c`, with the `openai` SDK dependency. The `learn-content-orchestrator:v1` state row resumes from where it stopped.
- **Switch.** `LEARN_CONTENT_AUTONOMY_ENABLED` decides who runs Learn editorial cycles. Exactly `true`: the server cycle runs. Anything else: the cron answers `NO_OP / AUTONOMY_DISABLED` without touching state, a provider or the MCP, and the ChatGPT scheduled task may own the cycle. Changing it is a Vercel variable change plus a redeploy; no code change. Never run both at once: `learn_apply` rejects a duplicate slug, not a duplicate topic.
- **Model.** The only allowed model is `gpt-5.6-sol` (default and allowlist; `LEARN_CONTENT_OPENAI_MODEL` must say `gpt-5.6-sol` or be empty). `gpt-6-astra` now fails closed as `CONFIGURATION_INVALID`. Official pricing at the time of the decision: $4 input and $20 output per 1M tokens, doubled input and 1.5× output for requests above 272K input tokens. Recorded Astra cycles used 1.6–3.8M input tokens each.
- **`learn_context` stays.** The read-only tool from 30 September remains for the ChatGPT task and for checks. The server publisher now accepts the Learn MCP surface `learn_apply` plus `learn_context` and still fails closed on any other tool.
- **Publication timeout.** The server's `learn_apply` call may take up to 240 s instead of the MCP SDK's 60 s default. On 30 September an image-generating call committed after 108 s while the server had already given up, which cost one hourly retry.

Unchanged: `learn_apply` is the sole, create-only mutation; the three roles, SEO-first `NO_OP`, rewrite limit, two funnels, localization, hero-image and firewall rules of RFC-053 §§2, 5, 7 and 10; the 8-hour minimum interval; the 12-hour lease; three publication attempts; generated images through `gpt-image-2`.

## First run after activation

The state row still holds run `a173598b-cd32-447c-9387-630710d134e7` as active with a lease that ended on 1 October 00:13 UTC. Its Article (`/en/learn/game-guides/roulette-odds-explained`) was already published on 30 September. The first cron after activation closes that run as `FAILED / ACTIVE_LEASE_EXPIRED` and, because its next eligible time has passed, launches a new cycle at the next language in the rotation (Swedish, cursor 1 of `en,sv,da,de`).

## Evidence

- `tests/learn-content-orchestrator.test.ts`, `tests/learn-content-orchestrator-structural.test.ts` and `tests/learn-context.test.ts` (`learn-content-orchestrator:test`, in `ci:quality`): the restored cycle's suite, `gpt-5.6-sol` as the only model with Astra rejected, the two-tool publisher surface, the 240 s timeout and the `learn_context` scope tests.
- `tests/learn-content-orchestrator-postgres.test.ts` and `tests/learn-context-postgres.test.ts` (`learn-content-orchestrator:postgres-test`, both database CI jobs).
