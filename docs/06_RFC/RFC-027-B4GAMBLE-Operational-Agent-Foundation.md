# RFC-027: B4GAMBLE Operational Agent Foundation

- **Status:** Approved for bounded implementation; Partner Operations application-adapter amendment approved
- **Decision authority:** Founder Office `AGENT-CORE-01`; amended by `COMMERCIAL-OPS-01` instruction
- **Approved:** 2026-08-13
- **Scope:** Isolated internal OpenAI Agents SDK foundation, eight specialist definitions, shared policy/result contracts, explicit cost-aware routing, bounded manual runner, no-key structural evaluation, and one narrow application-side Partner Operations CRM executor
- **Implementation:** merged to `main` by PR #69 at `7c36bffb901db62863b02cb8c2cf771cdadaaf89`
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

For material commercial claims in the `OPERATOR_LICENCE`, `BONUS`, `AVAILABILITY`, `COMMERCIAL_RELATIONSHIP` and `PARTNER` categories, every supporting `PUBLIC_WEB_EVIDENCE` item must carry a supplied `observedAt` timestamp. The timestamp records when the source evidence was observed; it does not prove source validity, present availability, licence status or commercial approval. Undated public-web commercial evidence produces a deterministic `REVIEW` evidence gap and cannot establish a current claim. This RFC sets no arbitrary freshness window.

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
| `partner-operations` | Partner Operations Agent | `standard` | `DRAFT`, `REVIEW`, `BLOCK` |
| `digital-pr-data-story` | Digital PR & Data Story Agent | `standard` | `DRAFT`, `REVIEW`, `BLOCK` |

Each definition contains its requested domain checks and exclusions. The Production Sentinel receives deterministic check evidence and interprets it; it does not perform uptime, crawl, HTTP, sitemap, robots, browser, performance or pixel-diff work. Partner Intelligence cannot mark an operator approved or infer an active partnership. Organisation, brands, jurisdiction or market relevance may be described only to the extent directly supported by supplied evidence; a generic register entry, organisation/brand name, source URL or affiliate page cannot establish jurisdiction, Great Britain relevance, regulator or licence scope, eligibility, availability or commercial approval. Supplied public-web sources are described neutrally unless authority, provenance, ownership or official status is explicitly supported; kind, title, URL, excerpt, timestamp, organisation or brand name do not establish source authority. Its fixed eight-case corpus passed a human-reviewed live evaluation at exact head `eb14b33e110451f9b3855fedfa938ef1802936d7`: `8 PASS / 0 REVIEW / 0 FAIL`. This is bounded corpus evidence, not automatic source verification or universal real-world validation. A public-web tool is not authorised. Digital PR cannot contact journalists. Growth specialists cannot optimise harmful gambling activity.

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

Founder review recorded one non-blocking quality signal: a `DETECTED` finding was worded more broadly than its specific cited evidence excerpt. That signal led to the separately governed Partner Intelligence corpus evaluation recorded below; it did not authorise a semantic verifier or additional agent architecture. Dedicated quality evidence for the other seven specialists remains pending.

## 12. Privacy, security and integration boundary

Wave 1 input must be public, synthetic non-Production fixture content or explicitly approved internal operational material. Real Programme narrative, audio, transcript, Starting Point, support content, session/auth data, user identity and vulnerability signals are prohibited.

The package includes no GitHub write, CMS write, email, deployment, database, affiliate, analytics, search-provider, Slack, Gmail, Calendar, GA4, Search Console, Everflow, Income Access, MyAffiliates, Ahrefs or Semrush integration. Public-web evidence may be gathered separately through an approved process and supplied as evidence; the agent itself has no web tool.

Any future external tool must pass a separate RFC covering authority, authentication, data minimisation, approval/human review, provider contracts, logging, retention, error behaviour and kill switch. The internal Partner Operations CRM adapter approved below is not an external tool and does not broaden the package to arbitrary writes.

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
- Partner Intelligence public-web observation timestamps and its curated no-key eval corpus; and
- credential/logging/source scans.

The single authorised neutral smoke verified SDK connectivity and one schema-valid Compliance Gate result. It does not constitute an eval programme, Production activation or approval of model quality. Partner Intelligence was evaluated separately against its committed deterministic eight-case corpus:

- The initial exact-head run at `aac2393553e26d88ca6e2c563cdb5196d5b2c1f0` produced `7 PASS / 1 REVIEW / 0 FAIL`; the sole REVIEW was Great Britain relevance wording broader than generic register-entry evidence.
- The second exact-head run at `a54b15f3d6a87c890b4a4154b3b39918ba83c97a` produced `7 PASS / 1 REVIEW / 0 FAIL`: the jurisdiction defect was fixed, while ordinary supplied public-web pages were inaccurately labelled authoritative status evidence.
- The final exact-head run at `eb14b33e110451f9b3855fedfa938ef1802936d7` produced `8 PASS / 0 REVIEW / 0 FAIL`: eight cases, seven provider requests, one deterministic Programme/commercial-firewall block before provider invocation, 9,651 input tokens, 3,491 output tokens, 13,142 total tokens and `$0.0764925` aggregate conservative cost. It had zero retries and no technical boundary failure, repository change, Production mutation, external mutation or partner action. Generic register evidence did not establish jurisdiction, Great Britain relevance, regulator or licence scope, eligibility, availability, partnership or approval; ordinary public-web sources were not upgraded; contradictions and missing material facts remained `UNKNOWN`; Programme/private-data commercial targeting was blocked before provider invocation; and neutral research remained bounded `DRAFT`.

Across the three fixed-corpus runs, the bounded campaign executed 24 cases through 21 provider requests, used 26,874 input tokens and 10,834 output tokens (37,708 total), and recorded `$0.229695` conservative cumulative cost, zero retries and zero technical-boundary failures. Both measured wording defects were fixed without regression in the other cases.

`PARTNER-INTEL-EVAL-01` is `FIXED EIGHT-CASE CORPUS PASSED AT EXACT HEAD / 8 PASS / 0 REVIEW / 0 FAIL / HUMAN-REVIEWED QUALITY EVIDENCE COMPLETE`. The bounded Partner Intelligence implementation passed its committed fixed eight-case human-reviewed live evaluation only at the exact head stated above. This establishes acceptable behaviour only for the committed corpus and tested boundaries. Human review remains mandatory for real commercial evidence and decisions. It does not establish universal correctness, automatic source validity/currentness, real-world partner approval or full agent-set quality; the other seven specialists remain unevaluated by this campaign.

## 14. Documentation and extension rule

The package README documents architecture, trust boundaries, registry, model routing, result schema, a manual run, adding a specialist, structural tests, the later live smoke, security/privacy and future integrations.

Adding a specialist requires a registry entry, purpose and prohibited actions, closed recommendation values, explicit default tier, shared-policy inheritance, structural tests and documentation. Adding a tool, persistent memory, autonomous orchestration, external integration, schedule or Production use requires a new approved RFC rather than a registry-only change.

## 15. Release boundary

This package is `STRUCTURALLY COMPLETE / NEUTRAL LIVE SMOKE PASSED / PARTNER-INTEL-EVAL-01 FIXED EIGHT-CASE CORPUS PASSED AT EXACT HEAD / 8 PASS / 0 REVIEW / 0 FAIL / HUMAN-REVIEWED QUALITY EVIDENCE COMPLETE / PRODUCTION / SCHEDULED / TOOL ENABLEMENT NOT AUTHORISED`. Its structural checks, one authorised neutral connectivity smoke and bounded Partner Intelligence corpus campaign are recorded above. The isolated package has no public-web tool, partner contact or commercial activation authority, and full eight-specialist quality is not established.

PR #69 merged the isolated package to `main`. It remains undeployed, unscheduled and inactive in Production; merge did not authorise agent quality claims, tools, external integrations or Production use. Any later activation review must state implementation and dependency changes, evidence, architecture/privacy/security/compliance assessment, cost controls, unresolved issues, deviations and a `GO`/`STOP` recommendation.

## 16. `COMMERCIAL-OPS-01` Partner Operations amendment

Founder instruction on 2026-08-19 authorises one bounded expansion while preserving package isolation:

1. `partner-operations` replaces `partner-intelligence` as the canonical registry key and name. `partner-intelligence` remains an explicit input compatibility alias resolved to the same definition; there is no duplicate specialist logic.
2. The true Partner Operations contract is `shared/commercial/partner-operations-contract.ts`. The isolated package re-exports it and still has no Prisma, Next.js or consumer-runtime dependency.
3. The protected Next.js application creates a strictly bounded CRM/evidence snapshot. The input schema contains no Programme narrative/input/audio/transcript, Starting Point, Mission answer, Help usage, pause, self-check, vulnerability, self-exclusion or user-behaviour field. A deterministic content firewall rejects protected-data attempts before provider invocation.
4. The server-only provider adapter uses the existing standard model route, no tools, no handoffs, `store: false`, one request, a 90-second timeout and strict JSON Schema output. Absence or failure of the provider leaves the CRM usable and writes nothing.
5. Model output is parsed again with Zod and all evidence references are checked against the supplied snapshot before execution. Raw text never mutates Prisma.
6. The application-side executor applies a closed operation union inside one transaction with idempotency and audit records. It may maintain profile facts, evidence, B2B contacts, research notes, tasks, next actions, drafts, supplied responses, evidenced received terms, stage proposals and preparation-only activation packets.
7. The union contains no send, submit, approval, activation, term-acceptance, tracking, affiliate-record, jurisdiction, deployment or Production operation. Stage recommendations exclude `APPROVED` and `ACTIVE`; proposals create timeline entries rather than changing the CRM stage.

This is a narrow internal write adapter, not autonomous sales or a general agent tool framework. No Gmail/OAuth, web tool, schedule, queue, memory, recursion, external communication or Production operator is added. Human approval and RFC-015 runtime readiness remain separate authorities.

One non-personal Partner Operations connectivity smoke was executed under this amendment using the explicit bulk route. It completed `REVIEW` in one `gpt-5.6-luna` request with 1,461 input tokens, 331 output tokens, 1,792 total tokens and a `$0.003447` conservative upper bound. The empty relationship remained `UNKNOWN` and no external or database action was proposed or available. This is connectivity/evidence-discipline evidence only, not real-partner validation or authority.
