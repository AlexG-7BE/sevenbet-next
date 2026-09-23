# RFC-053: Autonomous Learn Content Orchestration

- **Status:** `ACTIVE`
- **Decision authority:** explicit Founder instructions, 22–23 September 2026
- **Scope:** one bounded server-side Learn editorial orchestration pipeline
- **Depends on:** Product Vision & Principles, RFC-013, RFC-017, RFC-027,
  RFC-037, RFC-039, RFC-044, RFC-051 and RFC-052
- **Supersedes:** RFC-027's no-autonomy, no-schedule and no-Production ceiling
  only for the exact pipeline defined here
- **Does not revive:** Commercial/Media MCP, operational OAuth, generic agent
  tools/schedules, customer targeting, private Programme inputs or another
  Article mutation authority

## 1. Decision

B4GAMBLE runs one autonomous Learn editorial cycle without routine human
approval. One hourly authenticated Vercel cron starts or reconciles a managed
OpenAI Agents API session. That session coordinates three separated editorial
roles, has current public web search, and returns one strict structured result.
It has no mutation tool.

The deterministic application validates the complete result and is the only
component allowed to call RFC-052's existing `learn_apply` MCP tool. Completion
is successful only when the tool returns `LIVE`, `COMMITTED`, `PUBLISHED` and
`verified: true`.

This Founder decision supersedes RFC-027's no-autonomy/no-schedule/no-
Production ceiling **only** for this Learn content pipeline. The existing
generic `agents/` package remains isolated, tool-free, unscheduled and unable
to write Production. No partner, commercial, repository, Programme or other
operational agent gains authority through this RFC.

## 2. Role separation

Canonical instructions live in
`lib/learn-content-orchestrator/prompts.ts`. The managed root session must
start with SEO and create later roles only after a `CREATE` handoff. Every
created subagent uses these exact names and authorities:

1. **B4GAMBLE SEO Growth Lead** chooses whether a genuinely new Article should
   be created and returns `SEO_HANDOFF`. `MERGE`, `HOLD` or `DROP` ends the
   cycle as healthy `NO_OP`, but only after a bounded scan across the supplied
   registered taxonomy and published inventory considers multiple materially
   distinct candidate intents and finds no defensible useful uncovered topic.
   Overlap rejects that candidate; it does not end discovery while another
   genuine gap exists. Existing coverage is never an update target. The final
   handoff contains a concise decision rationale, not candidate deliberation or
   chain-of-thought. SEO cannot draft, approve or publish.
2. **B4GAMBLE Research + Content** runs only after `CREATE`, uses current
   public-web evidence, maps material claims to sources and returns
   `CONTENT_PACKAGE` plus a complete create-only candidate `LearnApplyInput`
   with null Article identity/version fields. Research cannot approve, update
   or publish.
3. **B4GAMBLE Editor + Publisher** independently searches and verifies the
   handoff, material claims, sources, safety, duplication, identity and exact
   payload. It returns `QA_PASS` or precise `REWRITE_REQUIRED`; despite the
   role name, it cannot mutate or publish.

Research and Editor may repeat at most two rewrite rounds after the initial
review. Failure to obtain `QA_PASS` becomes `BLOCKED / EDITOR_REWRITE_LIMIT`.
The standard is never lowered to manufacture throughput. Every subagent must
inherit the configured session model and at least high reasoning effort;
provider trace rejects a weaker model or lower-reasoning override.
A healthy `MERGE`, `HOLD` or `DROP` trace contains only SEO. A publication or
post-handoff editorial blocker contains exactly one SEO, one Research and one
Editor trace; extra or missing role traces fail closed.

## 3. Execution and output boundary

The managed session uses the official OpenAI JavaScript SDK with:

- `environment.type = none`;
- an inline, session-scoped agent configuration rather than a reusable agent;
- multi-agent coordination with at most three concurrent subagents;
- programmatic tool calling and live web search only;
- the current high-quality `gpt-6-astra` default and only approved model; and
- a JSON Schema structured-output envelope.

The envelope has required nullable branch fields and is parsed again through
strict Zod contracts into exactly one of:

- `NO_OP`: SEO decision/rationale and no payload;
- `PUBLISH`: `SEO_HANDOFF`, `CONTENT_PACKAGE`, Editor `QA_PASS`, exact
  `LearnApplyInput`, evidence and run metadata; or
- `BLOCKED`: exact safe blocker and no payload.

Non-selected branch data is rejected, so prose or reasoning cannot be confused
with publication authority. Unexpected `requires_action`, malformed output,
missing role traces or missing independent Research/Editor web-search traces
fail closed.

## 4. Input and privacy boundary

Only public editorial context is sent to the session:

- metadata for currently published Articles: ID, slug, title, category,
  locale, published/updated timestamps and public URL;
- registered Learn categories;
- published language/default-locale mappings;
- public Programme route, application route, mission count and public-purpose
  description; and
- protected Help/Responsible Gambling public routes.

Article prose, drafts, users, accounts, customer analytics, private Programme
state, pause data, sensitive inputs, vulnerability signals, affiliate data,
commercial state and credentials are excluded. No such data may be inferred,
requested or used for personalization. Programme, pause or Help data may never
drive affiliate targeting or commercial recommendation.

The [official Agents API overview](https://developers.openai.com/api/docs/guides/agents-api/overview)
currently states that managed sessions support US-only data residency and do
not support ZDR. This scope accepts that provider limitation only because the
session input is restricted to public editorial metadata and public web
evidence. It is not authority to send private or sensitive data. B4GAMBLE
project-specific retention/control evidence remains `UNKNOWN` until captured;
no stronger claim is made.

## 5. Deterministic publication gate

Before any side effect the application requires:

- exact run ID, request ID, model, locale and bounded timestamps;
- an allowed published locale and registered category;
- `CREATE` only, with `targetArticleId = null`, `articleId = null` and
  `expectedUpdatedAt = null`;
- a target slug absent from the current published Article inventory;
- all material claims mapped to evidence and independently checked by Editor;
- safe URLs with no affiliate/tracking parameters or commercial route;
- internal-only canonical URL;
- crisis/help and commercial-safety firewall passage; and
- parsing through RFC-052's actual current `learnApplyInputSchema`.

The official MCP client connects server-to-server, verifies that discovery
contains exactly `learn_apply`, and calls only that tool. The model never
receives `LEARN_MCP_SERVICE_TOKEN`. The token is not stored in a reusable agent,
session metadata, prompt, SiteSetting or log.

RFC-052 remains the sole Article mutation authority. `Article`,
`ContentRevision` and `AuditLog` remain canonical. Existing identity,
concurrency, first-party-image, cache invalidation, audit and public
verification behavior remains unchanged. The autonomous path cannot replace
an Article or create a revision; existing-Article changes remain in the human
editorial lifecycle. No GitHub, Vercel or direct database write is an alternate
publication path.

`PERSISTED_NOT_VERIFIED` and committed-but-unverified states are not success.
The same CREATE session output and request ID are retried at most three times;
only that exact replay may complete as `NO_CHANGE`. A third ambiguous/
verification failure halts new cycles with a safe operator code.
Deterministic application/configuration conflicts do not consume three
pointless retries. A transient PostgreSQL serialization conflict remains
retryable with the same request ID so an ambiguous concurrent commit can
converge safely on `NO_CHANGE`.

## 6. Schedule, state and concurrency

`GET /api/internal/cron/learn-content` uses the existing constant-time
`CRON_SECRET` bearer pattern. Vercel invokes it at minute 13 each hour. The
handler launches or reconciles and returns without waiting for the complete AI
run.

Default policy is:

- at most one new editorial cycle in 24 hours;
- at most one Article per cycle;
- no Article quota pressure; and
- `HOLD`/`NO_OP` is healthy.

One existing `SiteSetting` row, key `learn-content-orchestrator:v1`, stores
only a strict metadata object no larger than 4,096 bytes: active run/session,
locale/model, timestamps, next eligibility, publication-attempt count,
consecutive failure count, halt code and last safe result. It stores no secret,
prompt, reasoning, evidence body, Article prose, image/binary or private data.

Each mutation uses a serializable transaction and PostgreSQL transaction-level
advisory lock. Overlapping invocations can only observe/reuse the same run; the
OpenAI session launch also uses a run-derived idempotency key. An active run has
a 12-hour absolute ceiling. Failures retain the 24-hour launch interval rather
than creating quota pressure.

## 7. Safety and commercial firewall

Education, welfare and factual accuracy outrank traffic. The pipeline rejects
promotional urgency, supposedly safe stakes/bets, guaranteed outcomes, chasing
losses, affiliate/tracking URLs, casino/operator CTAs, bonuses, rankings and
commercial conversion paths.

Addiction, loss of control, inability to stop, relapse, severe financial harm
and serious distress require useful neutral action, protected Help or
Responsible Gambling and professional/urgent support where appropriate. Acute
distress or self-harm requires a protected support route and cannot include a
commercial CTA. The Programme is never described as emergency care.

No Commercial/Media MCP is restored. No commercial or media mutation module is
imported by this bounded context/orchestrator.

## 8. Configuration and rollback

New-cycle authority requires exact
`LEARN_CONTENT_AUTONOMY_ENABLED=true`. It also requires RFC-052's independent
`LEARN_MCP_ENABLED=true`, valid service token and actor, plus server-only
`OPENAI_API_KEY`. `LEARN_CONTENT_LOCALES` defaults to `en` and accepts only
published language slugs. `LEARN_CONTENT_MIN_INTERVAL_HOURS` defaults to 24 and
cannot be configured below 24. `LEARN_CONTENT_OPENAI_MODEL` defaults to
`gpt-6-astra` and fails closed unless it is in the code-reviewed model
allowlist. The initial allowlist contains only `gpt-6-astra`; a model change is
a reviewed code/configuration change, never a runtime quality downgrade.

Rollback is independent and non-destructive:

1. set `LEARN_CONTENT_AUTONOMY_ENABLED=false` to stop new editorial cycles;
2. set `LEARN_MCP_ENABLED=false` to stop RFC-052 writes; and
3. redeploy for hosted environment changes.

Neither switch unpublishes Articles or deletes Article, revision, audit or
referenced-image history.

## 9. Schema and release governance

This RFC introduces no Prisma model, table, migration, content/media/job
entity, queue, CMS or generic workflow DSL. It uses the existing `SiteSetting`
only for bounded operational metadata.

RFC-013 remains the release path: feature branch, pull request, required
checks, Vercel Preview, normal merge, exact-main Production deployment and
bounded Production acceptance. The current Founder instruction removes a
routine human approval step for this exact pipeline; it does not remove CI,
verification, evidence or rollback requirements.

Production evidence belongs in
`docs/06_Operations/Autonomous-Learn-Content-Orchestrator.md` and
`docs/CURRENT_STATE.md` only after it is observed. Candidate code or tests are
not Production evidence.
