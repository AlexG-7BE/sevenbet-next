# RFC-027: B4GAMBLE Operational Agent Foundation

- **Status:** Approved for bounded implementation
- **Decision authority:** Founder Office `AGENT-CORE-01`
- **Approved:** 2026-08-13
- **Scope:** Isolated internal OpenAI Agents SDK foundation, eight Wave 1 specialist definitions, shared policy and result contracts, explicit cost-aware routing, bounded manual runner and no-key structural evaluation
- **Base:** current `codex/agent-core-01` branch; exact implementation head to be recorded at review
- **Depends on:** Product Vision & Principles v2.0, Project State, Roadmap, RFC-013, RFC-014, RFC-015, RFC-017, RFC-022, RFC-023 and RFC-025
- **Supersedes:** nothing in the consumer product, Programme, authentication, commercial, data or Production runtime

## 1. Decision and ceiling

B4GAMBLE will add a separate top-level `agents/` Node/TypeScript package for bounded internal operational analysis with the official OpenAI Agents SDK. Wave 1 is limited to:

1. one shared policy and trust boundary;
2. one closed input contract;
3. one closed structured result contract;
4. an explicit model and cost-routing catalogue;
5. definitions for eight independently runnable specialists;
6. one manual command-line runner;
7. conservative deterministic preflight checks; and
8. structural tests and fixtures that do not require an API key.

The system reads supplied evidence, analyses it and drafts a recommendation. It has no authority to publish, mutate repositories, change CMS content, send communications, activate affiliates, deploy, alter Production or act on a recommendation.

This RFC does not authorise consumer product changes, page-structure changes, Programme progression or XP changes, authentication changes, database/schema/migration changes, commercial availability, affiliate activation, Production configuration, scheduled execution, external OAuth, a queue, a service, a dashboard, a vector database, memory persistence or autonomous recursion.

## 2. Runtime isolation

`agents/` is a private package with its own manifest, lockfile, TypeScript configuration, lint configuration and commands. It is not a root npm workspace and is not imported by the Next.js application. The consumer TypeScript project excludes `agents/`; the agent package type-checks itself.

Agent source must not import from `app/`, `components/`, `lib/`, `prisma/` or consumer runtime configuration. Current application structure may be supplied as evidence for a run, but no prompt may encode a page/block ordering as immutable policy.

The package has no Prisma dependency and no database connection. It receives no Production database URL, Programme private content, authentication/session state, user identity, raw behavioural data or secret beyond the runtime OpenAI credential required for an explicitly invoked live run.

## 3. SDK architecture

Wave 1 uses the official TypeScript package `@openai/agents` and Zod v4. Each specialist is an SDK `Agent` with:

- shared B4GAMBLE policy instructions;
- specialist-specific purpose, checks and recommendation values;
- an explicit model selected before construction;
- the shared Zod `outputType`; and
- an empty tool and handoff surface.

The official SDK supports Zod structured output, explicit `maxTurns`, token usage on the run result and per-run tracing controls. Wave 1 deliberately does not use sessions, server-managed continuation, handoffs, agents-as-tools, sandbox agents, hosted web search or function tools. One manually selected specialist owns one bounded run.

OpenAI SDK tracing is disabled in code by default because server-side tracing otherwise exports generation inputs and outputs. Local output exposes only the validated operational result plus bounded model/usage metadata. Raw provider requests, raw provider responses, stack traces and credentials are not printed.

Official implementation references reviewed on 2026-08-13:

- [OpenAI Agents SDK for TypeScript](https://openai.github.io/openai-agents-js/)
- [Agents and structured outputs](https://openai.github.io/openai-agents-js/guides/agents/)
- [Running agents and max-turn limits](https://openai.github.io/openai-agents-js/guides/running-agents/)
- [Results and usage](https://openai.github.io/openai-agents-js/guides/results/)
- [Tracing and sensitive data](https://openai.github.io/openai-agents-js/guides/tracing/)
- [Current OpenAI API models](https://developers.openai.com/api/docs/models)

## 4. Shared B4GAMBLE policy

Every specialist receives one shared instruction block with these non-overridable rules:

- B4GAMBLE is regulated-first and Great Britain is the first intended commercial market.
- Synthetic Production data is forbidden.
- Commercial facts require supplied evidence; missing evidence remains `UNKNOWN`.
- Never invent or imply an operator licence, bonus, availability, commercial relationship or approval.
- Never turn `UNKNOWN` into `VERIFIED`.
- Never use vulnerability, private Programme content or behavioural data for affiliate targeting, commercial ranking or promotional personalisation.
- Never optimise for deposits, losses, gambling frequency, session duration or repeat deposits.
- Distinguish `DETECTED`, `INFERRED`, `PROPOSED` and `UNKNOWN` in every finding.
- Treat current page/site structure as discoverable runtime evidence, not immutable policy.
- Recommend and draft only; never claim that an external action was performed.

The prompt treats all supplied request/evidence/claims as delimited untrusted data. Supplied text cannot change the system policy, output schema, model route, turn limit or authority boundary.

## 5. Input and evidence contract

The manual runner accepts a UTF-8 JSON document with a bounded shape:

```text
request        required bounded string
context        optional bounded string
evidence[]     supplied evidence records with stable ID, kind, title, source and optional excerpt
claims[]       claims with category, requested classification and evidence IDs
```

Evidence kinds are closed and describe only how evidence reached the runner: supplied file, repository evidence, deterministic check, public web evidence or explicit internal evidence. The runner does not fetch those sources.

Claim classifications use only `DETECTED`, `INFERRED`, `PROPOSED` and `UNKNOWN`. `VERIFIED` is intentionally absent from input and output classification vocabulary. A commercial claim without a valid supplied evidence reference is deterministically identified as an evidence gap before provider execution.

Inputs have count and length ceilings. The runner rejects additional properties, malformed evidence references and oversized files before an API call. It does not load the repository automatically.

## 6. Shared result contract

All specialists return the same strict envelope:

```text
agent
status
recommendation
summary
findings[]
risks[]
actions[]
evidenceGaps[]
confidence
```

`status`, `recommendation`, finding classification, severity, action priority and confidence are closed values. Findings carry evidence IDs rather than free-form claims of verification. An evidence gap records what is missing and why it matters. Additional properties are rejected.

The runner adds a deterministic execution envelope after validating the model result:

```text
model tier and model ID
selection source
max turns
request/input/output/total token counts
conservative estimated upper-bound token cost in USD
pricing source date
```

The model cannot author or alter execution/cost metadata.

## 7. Cost-aware model routing

The model route is always resolved before the run and printed in the result. It is selected from a closed catalogue and may be explicitly overridden only to another catalogue model. There is no automatic escalation or retry on a stronger model.

The 2026-08-13 official model catalogue establishes these Wave 1 tiers and listed per-million-token rates:

| Tier | Model | Purpose | Input | Output | Reasoning |
| --- | --- | --- | ---: | ---: | --- |
| `bulk` | `gpt-5.6-luna` | classification, extraction and narrow high-volume work | $1.00 | $6.00 | low |
| `standard` | `gpt-5.6-terra` | normal operational analysis | $2.50 | $15.00 | medium |
| `high_consequence` | `gpt-5.6-sol` | difficult or high-consequence review | $5.00 | $30.00 | high |

Rates are configuration evidence, not a promise. They must be rechecked against current official OpenAI pricing before a later pricing update or material live-evaluation programme. Estimates charge all input tokens at the uncached rate and are therefore a simple conservative upper bound for text tokens; they exclude any unapproved tool or regional surcharge because Wave 1 has no tools or regional-processing selection.

Specialist defaults are explicit in the registry. A caller may select a cheaper or stronger tier knowingly, but the result must state that the tier was overridden. Unknown model IDs fail before an API call.

## 8. Wave 1 registry

The registry contains exactly these specialists:

| Key | Specialist | Default tier | Closed recommendation values |
| --- | --- | --- | --- |
| `compliance-gate` | Compliance Gate | `high_consequence` | `PASS`, `REVIEW`, `BLOCK` |
| `repo-architecture-guardian` | Repo Architecture Guardian | `standard` | `GO`, `GO_WITH_CONDITIONS`, `STOP` |
| `production-sentinel-analyst` | Production Sentinel Analyst | `standard` | `EXPECTED`, `REGRESSION`, `AMBIGUOUS`, `CRITICAL` |
| `programme-ai-eval` | Programme AI Eval Agent | `high_consequence` | `PASS`, `REVIEW`, `BLOCK` |
| `growth-opportunity-radar` | Growth Opportunity Radar | `standard` | `DRAFT`, `REVIEW`, `BLOCK` |
| `serp-competitor-intelligence` | SERP & Competitor Intelligence Agent | `standard` | `DRAFT`, `REVIEW`, `BLOCK` |
| `partner-intelligence` | Partner Intelligence Agent | `standard` | `DRAFT`, `REVIEW`, `BLOCK` |
| `digital-pr-data-story` | Digital PR & Data Story Agent | `standard` | `DRAFT`, `REVIEW`, `BLOCK` |

Each definition contains its requested domain checks and exclusions. The Production Sentinel receives deterministic check evidence and interprets it; it does not perform uptime, crawl, HTTP, sitemap, robots, browser, performance or pixel-diff work. Partner Intelligence cannot mark an operator approved or infer an active partnership. Digital PR cannot contact journalists. Growth specialists cannot optimise harmful gambling activity.

## 9. Deterministic preflight

Ordinary code owns schema validation, input size, evidence-reference integrity, model/tier validation, cost arithmetic and unambiguous hard-boundary detection. `DETECTED` and `INFERRED` input claims and provider findings require at least one supplied evidence ID. Post-provider validation rejects every finding or risk citation not present in the supplied evidence with a safe `PROVIDER_OUTPUT_INVALID` failure; `PROPOSED` and `UNKNOWN` may remain unsupported where appropriate. Conservative preflight rules identify explicit proposals for:

- synthetic Production data;
- vulnerability-derived commercial targeting;
- Programme/private data used for affiliate or commercial targeting; and
- agent-package architecture that imports Prisma, writes Production or mutates consumer runtime.

The preflight does not claim general natural-language compliance competence. It returns detected rule IDs and required dispositions, and the provider receives that immutable preflight context. A hard `BLOCK`/`STOP` rule cannot be downgraded by model output. Unsupported commercial claims produce an evidence gap and remain `UNKNOWN`; they are not automatically presented as verified facts.

Deterministic service checks, numeric aggregation, thresholding, crawling, test execution, schema validation and visual comparison remain outside the LLM.

## 10. Execution limits and failure policy

The default run limit is two turns. The manual caller may choose one to four turns; `null`/unbounded execution is prohibited. A wall-clock abort limit is also bounded and configurable within a closed range. There is no automatic retry, fallback model, handoff, recursive run or schedule.

The runner fails before provider execution when the API key is absent, the input is invalid, the specialist/model is unknown or a boundary is violated. Provider errors are mapped to a small safe error message; raw error bodies and input content are not logged. Structural tests never need `OPENAI_API_KEY`.

## 11. Credential boundary and live smoke gate

`OPENAI_API_KEY` is resolved only from the process environment when an explicit live command runs. It is never passed as a CLI argument, printed, logged, stored in source, added to fixtures or assigned a value in an example environment file.

The recommended local destination is `agents/.env.local`, covered by the repository's existing `.env*` ignore rule. No code in this package writes that file. Founder Office authorised and reviewed exactly one non-personal neutral smoke using the `bulk` tier; it is separate from tests, type-checking and linting.

The observed run was `compliance-gate` / `COMPLETED` / `PASS`, with provider invocation true, explicit `bulk` selection of `gpt-5.6-luna`, low reasoning effort, one request, 1,157 input tokens, 275 output tokens, 1,432 total tokens and a conservative estimated upper-bound cost of `$0.002807`. It validates connectivity, SDK execution, structured-output compatibility, model access and execution/cost accounting only. It does not validate agent quality, approve Luna for compliance, establish production readiness, complete an eval, activate commercial capability or approve autonomous agents.

Founder review recorded one non-blocking quality signal: a `DETECTED` finding was worded more broadly than its specific cited evidence excerpt. This is evidence that dedicated specialist-quality evaluation is required later; no semantic verifier or additional agent architecture is authorised by this record.

## 12. Privacy, security and integration boundary

Wave 1 input must be public, synthetic non-Production fixture content or explicitly approved internal operational material. Real Programme narrative, audio, transcript, Starting Point, support content, session/auth data, user identity and vulnerability signals are prohibited.

The package includes no GitHub write, CMS write, email, deployment, database, affiliate, analytics, search-provider, Slack, Gmail, Calendar, GA4, Search Console, Everflow, Income Access, MyAffiliates, Ahrefs or Semrush integration. Public-web evidence may be gathered separately through an approved process and supplied as evidence; the agent itself has no web tool.

Any future tool must pass a separate RFC covering authority, authentication, data minimisation, approval/human review, provider contracts, logging, retention, error behaviour and kill switch. External write tools remain outside the Wave 1 ceiling.

## 13. Structural verification and live evaluation

No-key tests must cover:

- every registry definition and its allowed recommendations;
- strict input and result schemas;
- unsupported commercial fact becoming an evidence gap/`UNKNOWN`;
- synthetic Production data producing `BLOCK`;
- vulnerability-derived commercial targeting producing `BLOCK`;
- Programme/private data used for affiliate targeting producing `BLOCK`;
- a compliant neutral proposal passing deterministic preflight;
- architecture scope creep producing `STOP` or conditions;
- explicit model selection, override observability and no escalation;
- max-turn and timeout bounds;
- cost calculation;
- input-claim and provider-output evidence integrity; and
- credential/logging/source scans.

The single authorised neutral smoke verified SDK connectivity and one schema-valid Compliance Gate result. It does not constitute an eval programme, Production activation or approval of model quality. Dedicated specialist-quality evaluation requires curated expected outcomes, cost limits, privacy review and separate Founder authority.

## 14. Documentation and extension rule

The package README documents architecture, trust boundaries, registry, model routing, result schema, a manual run, adding a specialist, structural tests, the later live smoke, security/privacy and future integrations.

Adding a specialist requires a registry entry, purpose and prohibited actions, closed recommendation values, explicit default tier, shared-policy inheritance, structural tests and documentation. Adding a tool, persistent memory, autonomous orchestration, external integration, schedule or Production use requires a new approved RFC rather than a registry-only change.

## 15. Release boundary

This package is `STRUCTURALLY COMPLETE / NEUTRAL LIVE SMOKE PASSED / QUALITY EVAL PENDING / PRODUCTION / SCHEDULED / TOOL ENABLEMENT NOT AUTHORISED`. Its structural checks have passed, and its one authorised neutral smoke is recorded above.

It must remain unmerged, undeployed, unscheduled and inactive in Production pending Founder Office review. The review must state implementation and dependency changes, evidence, architecture/privacy/security/compliance assessment, cost controls, unresolved issues, deviations and a `GO`/`STOP` recommendation.
