# SMM agents read social traffic through the Learn MCP

**Status:** ACCEPTED — ships with the PR that adds this record. It is live only
after that PR is merged and deployed; [CURRENT_STATE](../CURRENT_STATE.md)
records it as live only once observed. Amended on 12 October 2026: the report
also counts Programme starts and first-step completions (see
[the amendment](#amendment--programme-starts-per-source-and-post-12-october-2026)).

**Decision authority:** explicit Founder instruction in chat, 3 October 2026:
"Дать агентам доступ к аналитике сайта: визиты и клики в казино по каждой
соцсети и посту — Да, отдельным PR" (give the agents access to site analytics:
visits and casino clicks per social network and per post — yes, in a separate
PR). Amends [RFC-046](../06_RFC/RFC-046-Customer-Data-Analytics-and-Lifecycle-Core.md)
§11 and extends the read-only companions of the Learn MCP endpoint in
[RFC-052](../06_RFC/RFC-052-Autonomous-Learn-Publication.md) §2 and
[RFC-053](../06_RFC/RFC-053-Autonomous-Learn-Content-Orchestration.md) §12.

## Why

Five Claude SMM agents (Instagram, Threads, X, Facebook, YouTube) post links to
b4gamble.com with UTM tags (`utm_source=x&utm_medium=social&utm_campaign=post&utm_content=<post>`,
the short links `/ig`, `/x/<code>`, `/t/<code>` and similar). They could not
see whether a post brought visits or partner clicks, so they could not learn
which posts work. The first-party analytics already record this for visitors
who allow analytics cookies.

## Decision

- **Tool.** The Learn MCP endpoint (`POST /api/mcp/learn`) lists one more
  read-only tool, `social_traffic`. For a UTC range (default the last 7 days,
  at most 92) it returns, per UTM source, campaign and content, the count of
  consented Production human visits (`AnalyticsSession.startedAt` in range),
  partner-button clicks (`OutboundClick.attemptedAt` in range, credited to the
  UTM tags of the consented visit they happened in) and of those clicks the
  ones that reached the partner (`SUCCEEDED`), with the top five visitor
  countries per row. Visits without UTM tags whose referrer is Instagram,
  Threads, X, Facebook, YouTube, Pinterest or TikTok form `social_referrer`
  rows per network, because bio links can drop the tags. Site-wide totals
  (all consented visits, all partner clicks, clicks without analytics consent)
  give the share.
- **Why the Learn endpoint.** The Founder's Claude Code already connects to it
  with the existing service bearer and the owner cookie that passes the
  Kazakhstan geo-block, so the agents can call the tool as soon as it deploys,
  with no new token, Vercel variable or connector. The CRM endpoint is not
  used because RFC-055 §8 keeps analytics out of the CRM data boundary; a new
  endpoint would need its own token, configuration and redeploy for the same
  read.
- **Counts only.** No anonymous ID, session ID, user ID, IP, email, landing
  path, referrer host or other per-person value leaves the server; rows carry
  only lower-cased UTM values, a network name, counts and two-letter country
  codes. The tool writes nothing and adds no column, table or migration.
- **Boundary kept.** The server Learn publisher still calls only
  `learn_apply`; it accepts `social_traffic` in the listed surface so its
  fail-closed discovery check keeps passing. Nothing from `social_traffic`
  reaches the OpenAI session (RFC-053 §4). Programme, Help, pause and
  vulnerability data are not read. (Since the 12 October 2026 amendment below,
  two aggregate Programme counters are read; Help, pause and vulnerability
  data are still not read.)

## RFC-046 boundary, stated precisely

RFC-046 §11 names the Better Auth staff session with `analytics.view` as the
only internal path to the fixed analytics dashboards. This decision adds a
second, narrower path for the approved scope only: aggregate UTM/referrer
counts, readable with the Learn MCP service bearer. The bearer holder (today
the Founder's Claude Code and the server publisher) can read those counts; it
gains no customer, identity, Programme or dashboard access. Rollback: remove
the tool in a PR, or disable the whole endpoint with `LEARN_MCP_ENABLED`
(this also stops Learn publication), or rotate `LEARN_MCP_SERVICE_TOKEN`.

## Known limits

- Only consented visits carry UTM tags; partner clicks without consent are
  counted site-wide but cannot be credited to a post.
- A visit is a 30-minute analytics session; a click is credited to the visit
  it happened in, not to the visitor's first touch.
- The Learn MCP rate limit (20 authenticated requests per 10 minutes per client
  address in each server instance, shared by every tool and by the client's own
  connect and list calls) is unchanged. Several agents starting at the same moment from one address can
  hit it and receive HTTP 429; they should retry later.

## Amendment — Programme starts per source and post (12 October 2026)

**Decision authority:** explicit Founder approval in chat, 12 October 2026
("да, делай"), for this scope: the report says how many of the visitors a
social source, campaign or post brought started the Programme and how many
completed its first step.

**Previous boundary.** This record and RFC-046 §15 said the tool reads and
returns no Programme value. The Founder approval supersedes that for two
aggregate counters and nothing else.

- **Added output.** Each row gains `programmeStarts`, `stepOneCompletions` and
  `programmeStartCountries` (at most three `{ countryCode, starts }`);
  `totals` and `site` gain the two counters.
- **Source.** The `programme_started` observations and the
  `programme_step_completed` observations of the first step (Mission 01) that
  RFC-046 §5–§6 already record for visitors who allowed analytics cookies;
  Production human traffic only; `occurredAt` in the range. No new tracking
  and no new column, table, index or migration.
- **Once per visitor.** One person's start can be observed while anonymous and
  again with the account. Both rows carry the same browser analytics ID, so a
  counter counts an analytics ID once per range and the earliest observation
  decides the credit.
- **Attribution.** These observations carry no session. An event is credited
  to the same analytics ID's most recent consented visit that began at or
  before the event, at most 30 days before it, and has a social touch by this
  record's rule (a UTM tag or a social-network referrer); it counts in that
  visit's row and country. An event with no such visit counts only in the
  site-wide totals.
- **Purpose limitation kept.** Aggregate, read-only measurement. It changes
  nothing a visitor sees, and no page, offer, ranking or route reads these
  numbers. RFC-046 §6 allows aggregate product analysis of Programme
  observations and forbids using them to select, rank, time or personalise a
  casino, offer, bonus, affiliate link or advertisement for an individual;
  that prohibition is unchanged. Programme answers, Help, pause and
  vulnerability data are not read.
- **Counts only, still.** The analytics ID is read only inside the store to
  match an event to a visit. No anonymous, session or user ID, and no time of
  an individual event, leaves the server.
- **Consequences.** A row can show a small number with a country (for example
  one start from Sweden for one post); the report already shows visit counts
  at that grain. A count is per browser, so a person who starts on two
  devices counts twice.
- **Rollback.** Revert the PR that adds this amendment; the report returns to
  visits and partner clicks. The wider rollbacks above still apply.

Evidence: the Programme cases in `tests/social-traffic.test.ts` (latest social
visit, 30-day window, no social visit, one count per visitor, no identifier in
the output, only the Learn MCP tool imports the report) and in
`tests/social-traffic-postgres.test.ts` (Production human filter and both
reads on PostgreSQL).

## Evidence

- `tests/social-traffic.test.ts` (in `learn-content-orchestrator:test`, part of
  `ci:quality`): range rules, referrer mapping, grains, filter, limit, no
  per-person fields, error mapping, MCP discovery and annotations, the bearer
  gate and the publisher surface.
- `tests/social-traffic-postgres.test.ts` (in
  `learn-content-orchestrator:postgres-test`, both database CI jobs): real
  PostgreSQL aggregation through the HTTP handler, exclusion of staff-marked,
  Preview and out-of-range rows, and an unchanged database digest.
