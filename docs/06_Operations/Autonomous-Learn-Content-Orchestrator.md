# Autonomous Learn Content Orchestrator

**Status:** LIVE — PRODUCTION RELEASE AND AUTONOMOUS PUBLICATION VERIFIED

**Authority:** explicit Founder instruction of 22 September 2026 and RFC-053

## Evidence classification

**DETECTED IN REPOSITORY AND PRODUCTION:** the implementation uses the existing
canonical Article domain, RFC-052 `learn_apply`, one bounded SiteSetting key,
one authenticated hourly cron and an official managed OpenAI Agents API
session. It introduces no Prisma model, migration, content/job/queue entity or
generic operational-agent authority.

**DETECTED, 23 SEPTEMBER 2026:** exact PR/check/merge/deployment identifiers,
hosted configuration, managed-session reconciliation, create-only MCP result,
database evidence and public runtime evidence are recorded below. Protected
values were verified only by presence/scope and were not printed or stored in
documentation.

## Runtime flow

```text
hourly CRON_SECRET request
  → serializable SiteSetting/advisory-lock claim
  → start or inspect managed Agents API session
  → SEO subagent → SEO_HANDOFF
     ├─ MERGE/HOLD/DROP → healthy NO_OP
     └─ CREATE only
          → one public-web Research subagent → CONTENT_PACKAGE
          → one independent public-web Editor subagent → review
          → up to two Research↔Editor rewrites
          → strict PUBLISH or BLOCKED result
  → deterministic validation
  → official MCP client discovers exactly learn_apply
  → same requestId retry semantics
  → success only LIVE + COMMITTED + PUBLISHED + verified=true
```

The launch request returns after the session ID is attached; it does not wait
for the AI run. Later hourly invocations reconcile it. One run is limited to 12
hours and one new cycle cannot launch more often than every 24 hours.

## Hosted configuration

Required Production variables:

```text
CRON_SECRET=<existing server-only secret>
OPENAI_API_KEY=<existing server-only project key>
LEARN_MCP_ENABLED=true
LEARN_MCP_SERVICE_TOKEN=<existing server-only RFC-052 token, at least 32 bytes>
LEARN_MCP_ACTOR_ID=<existing RFC-052 service actor UUID>
LEARN_CONTENT_AUTONOMY_ENABLED=true
LEARN_CONTENT_LOCALES=en
LEARN_CONTENT_MIN_INTERVAL_HOURS=24
LEARN_CONTENT_OPENAI_MODEL=gpt-6-astra
```

Never print values. Verify only presence/scope/sensitivity through the Vercel
control plane. `LEARN_CONTENT_AUTONOMY_ENABLED`, locale, interval and model are
non-secret server configuration; credentials remain Sensitive. Any hosted
variable change requires a new Production deployment. The model value must
also match the code-reviewed allowlist, which initially contains only
`gpt-6-astra`.

The OpenAI project key requires the permissions needed for managed agent
sessions/inference. No MCP credential is supplied to OpenAI. The session has
`environment.type=none`, no shell, no database, no GitHub/Vercel/email tool and
no mutation MCP.

## State and responses

The single `learn-content-orchestrator:v1` SiteSetting value is a strict,
metadata-only object capped at 4,096 bytes. Useful fields are active run/session
ID, locale/model, lease/start/next-eligible timestamps, publication attempts,
consecutive failures, halt code and last safe result. Never add Article prose,
prompt text, source bodies, raw reasoning, binary data, user data or secrets.

Normal response classes:

| Result | Meaning | Operator action |
| --- | --- | --- |
| `STARTED / SESSION_IN_PROGRESS` | A new managed session was attached | None; next hourly run reconciles |
| `NO_OP / SESSION_IN_PROGRESS` | Existing run is still working | None |
| `RETRY_PENDING / SESSION_START_FAILED` | The provider did not create a managed session; the bounded daily cycle remains retryable and logs only sanitized provider status/code/type/parameter/message fields | Correct the provider/configuration failure and retry the same cycle; never expose credentials or prompts |
| `NO_OP / MINIMUM_INTERVAL_ACTIVE` | Daily launch interval has not elapsed | None |
| `NO_OP / HOLD|MERGE|DROP` | SEO correctly declined new publication | Healthy; no action |
| `BLOCKED / <safe code>` | Contract, safety, provider or state gate failed | Investigate code; do not bypass |
| `RETRY_PENDING / <safe code>` | Bounded same-run/session/payload retry remains | Next hourly run retries |
| `PUBLISHED / CREATED|NO_CHANGE` | RFC-052 returned verified LIVE | Verify recorded public projection |
| `BLOCKED / MCP_<deterministic code>` | RFC-052 rejected a non-retryable payload/configuration conflict before commit | Correct the cause; the same failed payload is not retried |

The provider trace must contain only one SEO role for a healthy SEO `NO_OP`.
`PUBLISH` or a post-handoff editorial `BLOCKED` result must contain exactly one
SEO, one Research and one Editor role, with Research and Editor each proving at
least one completed live-web search. Extra/missing roles or a downgraded model/
reasoning configuration fail closed.

The root creates direct children with exact machine task names
`seo_strategist`, `researcher` and `editor`, and exact immutable role markers
defined in `prompts.ts`; role subagents cannot delegate. Runtime trace
classification accepts only an exact normalized task-path leaf, exact marker,
or exact canonical human-role assignment when present. Runner nicknames and
initial task content are provider-nullable. If all optional role signals are
absent, the runtime maps the provider's ascending subagent order to the
canonical SEO → Research → Editor sequence only after proving every subagent
is a direct root child, every root create call completed, call/subagent counts
match and no exact signal conflicts with its position. Nested, extra, missing,
conflicting or ambiguous structure fails closed and logs only bounded per-role
counters, never task text.

SEO treats a duplicate or weak idea as a rejected candidate, not as the end of
the cycle. Before `MERGE`, `HOLD` or `DROP`, it performs a bounded scan across
all supplied registered categories and the published Article inventory,
considers multiple materially distinct intents and selects the strongest useful
uncovered opportunity when one exists. The output records only the final
handoff and concise rationale, never candidate deliberation or chain-of-thought.

RFC-052 marks a PostgreSQL serialization conflict as transient and retryable
with the same request ID. Contract, existing-slug, identity and configuration
conflicts are non-retryable and close the run after one MCP call.

An unexpected `requires_action` halts because the configured session has no
application function tool. `PERSISTED_NOT_VERIFIED`, MCP transport/application
failure and unverified `LIVE` are not completion. After the third ambiguous
publication attempt the state halts new cycles until the cause is resolved and
state is deliberately reconciled.

Logs contain only bounded stage/result codes, run/session or Article IDs,
timestamps, token counts and publication operation. Never log prompts, final
Article text, provider responses, source bodies, tokens, API keys or binary
content.

## Verification

Local/CI commands:

```text
npm run learn-content-orchestrator:test
npm run learn-content-orchestrator:postgres-test
npm run learn-apply:test
npm run learn-apply:postgres-test
npm run typecheck
npm run lint
npm run ci:quality
npm run build
```

The PostgreSQL suite must run only against a disposable loopback `_ci`/test
database. It proves concurrent claims converge on one run, competing session
attachments cannot diverge and the 24-hour interval/locale cursor persist. The
orchestrator PostgreSQL suite runs in both database-capable CI jobs.

## Production acceptance

1. Confirm all required GitHub checks pass on the final PR head and Vercel
   Preview is Ready.
2. Merge normally and record the exact merged `main` SHA.
3. Verify the automatic Production deployment is Ready at that SHA.
4. Add/verify the Production variables above without printing values and
   redeploy so the runtime receives them.
5. Read the bounded SiteSetting state. If and only if a previous acceptance
   failure has `active=null`, `haltedCode=null` and a verified future
   `nextEligibleAt`, reconcile only `nextEligibleAt` to the current instant so
   the new release may run once. Preserve `last` and failure evidence; never
   edit state to fabricate success or replace an active run.
6. Invoke `GET /api/internal/cron/learn-content` once using the existing bearer
   secret. Record only HTTP/result/code/run ID.
7. If `STARTED`, wait for later reconciliation or explicitly invoke the same
   authenticated route after the managed session becomes idle. Never create a
   second cycle.
8. During routine operation, a legitimate `HOLD`, `MERGE`, `DROP` or evidence
   `BLOCKED` remains a healthy truthful editorial result when the real
   session/role/reconciliation path is proven. For the Founder-authorized
   initial Production activation, `LIVE` additionally required a genuinely new
   public Article. Never manufacture an Article.
9. If published, require `CREATED|NO_CHANGE`, `LIVE`, `COMMITTED`,
   `PUBLISHED`, `verified: true`; verify exact public route/metadata, Learn
   collection, sitemap, image/alt text when present, no commercial CTA and the
   RFC-052 service audit actor.

## Rollback and recovery

- Set `LEARN_CONTENT_AUTONOMY_ENABLED=false` and redeploy to stop new cycles.
- Set `LEARN_MCP_ENABLED=false` and redeploy to stop Learn MCP writes.
- Do not unpublish/delete existing Articles or delete revision/audit/image
  history as transport rollback.
- Resolve a halted run from safe state/session/MCP evidence. Never edit state
  to fabricate success. Re-enable only after the causal gate is verified.

Disabling the orchestrator does not disable public Learn reads or unpublish an
Article.

## Production acceptance record

**LIVE — VERIFIED 23 SEPTEMBER 2026.**

- Final remediation [PR #335](https://github.com/AlexG-7BE/sevenbet-next/pull/335)
  passed required CI run
  [`35837795734`](https://github.com/AlexG-7BE/sevenbet-next/actions/runs/35837795734),
  including `Quality`, `Database / Migration Verification`, `Agent Core` and
  the 19m55s `Build / Browser` job. It merged normally as exact `main`
  `2378292085720f7e779085825b01265dcbfd12ce`.
- Original orchestrator [PR #312](https://github.com/AlexG-7BE/sevenbet-next/pull/312)
  merged as `067d27058babcabf57505866889ff056601e9efa`. The bounded remediation
  chain then merged taxonomy-wide opportunity scanning in PR #333
  (`5711b9983b31d951b552d42f170e98646b0ca24c`), safe provider trace evidence
  in PR #334 (`c1de0f00b2d52541edde79b0cfa7d489b132a232`) and the final
  fail-closed provider-order role resolution in PR #335.
- Vercel Production deployment `dpl_2Y7oPFwg2XpanCp4qmKUacBBQg5Q` is `Ready`,
  owns `https://b4gamble.com` and was built from branch `main`, commit
  `2378292`. The blocked acceptance runs before the final repair produced no
  Article or MCP mutation.
- Vercel Production contains the required cron, OpenAI, Learn MCP and Learn
  orchestrator variables. Runtime-safe comparisons verified exact
  `LEARN_CONTENT_AUTONOMY_ENABLED=true`, `LEARN_CONTENT_LOCALES=en`,
  `LEARN_CONTENT_MIN_INTERVAL_HOURS=24` and
  `LEARN_CONTENT_OPENAI_MODEL=gpt-6-astra`. The enabled native cron is
  `/api/internal/cron/learn-content` at `13 * * * *`.
- The bounded pre-run state had `active=null`, `haltedCode=null`, 25 Articles,
  one historical `learn_apply` audit and pre-existing lifecycle-projection
  digest
  `f5cd35f13963327f25d87f1517c30aa962759dd908ed0b6f2bd12e7250c6ed35`.
  A one-time interval reconciliation preserved the prior failure evidence and
  opened exactly one cycle.
- Run `e7fd4249-f2c1-49e5-be86-1f04c35d4b72` attached managed session
  `sess_0cf0a00510ddcec4006ab3945d48e08197a9ffba29dcffc173`. The provider
  completed as `SESSION_IDLE`; safe usage evidence recorded 2,075,180 input,
  27,434 output and 2,102,614 total tokens. One transient fail-closed
  `STATE_CLAIM_FAILED`/Prisma transaction timeout changed no state; the normal
  same-run retry succeeded without launching another cycle.
- The deterministic gate accepted the managed SEO → Research → Editor trace
  and invoked only the discovered `learn_apply`. The MCP request started with
  `articleId=null` and slug `gambling-complaints-and-adr`; it finished
  `operation=CREATED`, `result=LIVE`, `verified=true`. The orchestrator recorded
  `PUBLISHED/CREATED`, cleared `active`, left `haltedCode=null` and set the next
  eligible time to `2026-09-24T08:56:58.238Z`.
- Article `b0c88152-8057-4dcc-83be-fdd0d22ce997`, **“Gambling Complaints in
  Great Britain: How to Use ADR”**, category `licensing`, locale `en-GB`, is
  `PUBLISHED` and unarchived at
  `https://b4gamble.com/en/learn/licensing/gambling-complaints-and-adr`.
  `createdAt` equals `updatedAt`; the service actor owns both fields; its
  `learn_apply` audit says “Autonomous Learn Article created and published”;
  and the Article has zero `ContentRevision` rows. The pre-existing 25-Article
  projection retained the exact pre-run digest, proving the autonomous cycle
  did not update or archive an older Article.
- The Article route returned `200` with an exact self-canonical and `Article`
  JSON-LD. The Learn hub and `licensing` category both returned `200` and
  linked the exact Article; `/sitemap.xml` returned `200` and contained the
  exact URL. The Article has no hero image, so image/alt verification is not
  applicable. Its body links only to B4GAMBLE Help and official Gambling
  Commission evidence, with no internal commercial route, affiliate language
  or tracking parameter. The successful Article remains live.
