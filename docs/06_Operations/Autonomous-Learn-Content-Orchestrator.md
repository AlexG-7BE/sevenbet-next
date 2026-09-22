# Autonomous Learn Content Orchestrator

**Status:** IMPLEMENTED CANDIDATE — PRODUCTION RELEASE EVIDENCE PENDING

**Authority:** explicit Founder instruction of 22 September 2026 and RFC-053

## Evidence classification

**DETECTED IN REPOSITORY CANDIDATE:** the implementation uses the existing
canonical Article domain, RFC-052 `learn_apply`, one bounded SiteSetting key,
one authenticated hourly cron and an official managed OpenAI Agents API
session. It introduces no Prisma model, migration, content/job/queue entity or
generic operational-agent authority.

**UNKNOWN UNTIL RELEASE:** PR/check/merge/deployment identifiers, hosted
environment configuration and the first autonomous Production-cycle result.
Do not treat this section as a Production activation claim until the acceptance
record below is replaced with observed evidence.

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
8. A legitimate `HOLD`, `MERGE`, `DROP` or evidence `BLOCKED` is a valid
   autonomous editorial result if the real session/role/reconciliation path is
   proven. Do not manufacture an Article.
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

**UNKNOWN — PENDING RELEASE.** Replace this paragraph only with exact observed
PR, check run, merge SHA, Ready deployment, redacted environment-presence and
autonomous-cycle evidence. If publication occurs, include the public Article
URL and RFC-052 result; otherwise record the legitimate no-publication result.
