# B4GAMBLE Operational Agents

This private package is the bounded internal foundation approved by
[RFC-027](../docs/06_RFC/RFC-027-B4GAMBLE-Operational-Agent-Foundation.md).
It uses the official OpenAI Agents SDK to read supplied evidence, analyse it,
and draft structured recommendations. It is not part of the consumer Next.js
runtime.

## Trust boundary

Wave 1 agents have no tools, handoffs, sessions, persistent memory, database,
Prisma, consumer-runtime import, GitHub/CMS write, email, affiliate activation,
deployment, Production mutation, external OAuth, paid SEO integration, or
automatic schedule. OpenAI SDK tracing is disabled, provider storage is set to
false, and the runner does not print raw provider errors.

Only public evidence, non-Production fixtures, or explicitly approved internal
operational evidence belongs in a run. Do not supply real Programme narrative,
audio, transcript, Starting Point, support content, session/auth data, user
identity, or vulnerability signals.

```text
explicit JSON file
      |
      v
strict input schema -> deterministic preflight -> one selected specialist
                                                -> one explicit model route
                                                -> strict structured output
                                                -> local usage/cost envelope
```

Hard-boundary preflight results stop without an OpenAI call. Ordinary uptime,
HTTP, crawl, sitemap, numeric aggregation, threshold, test, schema, and visual
checks remain deterministic and must be supplied to an agent as evidence if
interpretation is required.

## Registry

| Key | Purpose | Default tier | Recommendations |
| --- | --- | --- | --- |
| `compliance-gate` | Compliance and policy review | `high_consequence` | PASS / REVIEW / BLOCK |
| `repo-architecture-guardian` | Repository architecture/governance review | `standard` | GO / GO_WITH_CONDITIONS / STOP |
| `production-sentinel-analyst` | Interpret deterministic Production-check evidence | `standard` | EXPECTED / REGRESSION / AMBIGUOUS / CRITICAL |
| `programme-ai-eval` | Evaluate supplied Programme AI output/eval evidence | `high_consequence` | PASS / REVIEW / BLOCK |
| `growth-opportunity-radar` | Rank safe evidence-backed growth opportunities | `standard` | DRAFT / REVIEW / BLOCK |
| `serp-competitor-intelligence` | Analyse supplied public search/competitor evidence | `standard` | DRAFT / REVIEW / BLOCK |
| `partner-intelligence` | Analyse supplied public potential-partner evidence | `high_consequence` | DRAFT / REVIEW / BLOCK |
| `digital-pr-data-story` | Draft credible PR/data-story opportunities | `standard` | DRAFT / REVIEW / BLOCK |

List the runtime registry without an API key:

```bash
npm run agent:run -- list
```

## Input and result contracts

The runner accepts one UTF-8 JSON file of at most 256 KiB. Its closed root
contains `request`, optional `context`, `evidence[]`, and `claims[]`. Evidence
IDs are the only citations an agent may place on a finding or risk.

The structured result always contains:

```text
agent, status, recommendation, summary, findings[], risks[], actions[],
evidenceGaps[], confidence, execution
```

`execution` is deterministic rather than model-authored. It reports whether the
provider was invoked, selected tier/model, selection source, reasoning effort,
limits, token usage, conservative upper-bound text-token cost, pricing date,
and pricing source.

`VERIFIED` is intentionally not a classification. The only classifications are
`DETECTED`, `INFERRED`, `PROPOSED`, and `UNKNOWN`.

## Cost-aware routing

The closed catalogue follows the official OpenAI model page reviewed on
2026-08-13:

| Tier | Model | Input / MTok | Output / MTok |
| --- | --- | ---: | ---: |
| `bulk` | `gpt-5.6-luna` | $0.20 | $1.20 |
| `standard` | `gpt-5.6-terra` | $2.00 | $12.00 |
| `high_consequence` | `gpt-5.6-sol` | $5.00 | $30.00 |

The specialist default is explicit. `--tier` or `--model` can override it, but
not both, and only catalogue models are accepted. There is no fallback or
automatic escalation. The default is two turns; accepted values are one to
four. The default timeout is 90 seconds; accepted values are 5–180 seconds.

Recheck [official model availability and pricing](https://developers.openai.com/api/docs/models)
before changing the catalogue or running a material paid evaluation.

## Structural validation

From this directory, with the repository's declared Node 24 runtime:

```bash
npm install
npm run check
```

Tests do not need `OPENAI_API_KEY`. They cover strict contracts, the eight-agent
registry, shared policy inheritance, unsupported commercial evidence,
synthetic Production data, vulnerability targeting, Programme/affiliate
mixing, a neutral proposal, architecture scope creep, explicit model routing,
cost calculation, and the package security boundary.

## Run one specialist manually

A non-blocked run is a live paid provider call:

```bash
npm run agent:run -- run \
  --agent compliance-gate \
  --input fixtures/live-smoke/compliance-neutral.json \
  --tier bulk \
  --max-turns 2
```

Never pass an API key as an argument. The runner reads only
`OPENAI_API_KEY` from its process environment.

## First live smoke gate

Do not run the live smoke until Founder Office confirms that the dedicated key
is stored safely. The recommended ignored destination is `agents/.env.local`;
the repository's `.env*` rule already ignores it. Do not commit or print the
file, and do not paste the key into chat.

After safe configuration, the exact first smoke command is:

```bash
cd agents && npm run smoke:live
```

The fixture contains no real-person or private Programme data and explicitly
uses the lowest-cost tier. This smoke proves only connectivity and one
schema-valid result. It does not approve model quality or activate Production.

## Add a specialist

1. Add one closed key to `AGENT_KEYS`.
2. Add a complete registry definition with purpose, checks, prohibited actions,
   allowed recommendations, and explicit default tier.
3. Inherit the shared policy; do not duplicate or weaken it.
4. Keep the shared input/result contracts unless an approved RFC changes them.
5. Add registry, prompt, contract, and policy/eval fixtures.
6. Update this README and governing documentation.

Adding a tool, persistent memory, autonomous orchestration, external
integration, schedule, consumer-runtime import, or Production use requires a
new approved RFC. A registry edit cannot authorise those capabilities.

## Future integration boundary

Public-web evidence may be gathered by an approved separate process and passed
in as evidence. Gmail, Calendar, GA4, Search Console, Everflow, Income Access,
MyAffiliates, Ahrefs, Semrush, Slack, CMS/GitHub writes, email, deployment,
affiliate activation, and Production mutation remain outside Wave 1.
