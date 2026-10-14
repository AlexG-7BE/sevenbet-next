# The weekly funnel count is read through the Learn MCP

**Status:** ACCEPTED — ships with the PR that adds this record. It is live only
after that PR is merged and deployed; [CURRENT_STATE](../CURRENT_STATE.md)
records it as live only once observed.

**Decision authority:** the Founder's plan of 13 October 2026, item 5: a weekly
funnel count (article or network → Programme start → step 3 → casino click, by
country), confirmed the same day with the other build items ("я со всем ок").
Extends the read-only companions of the Learn MCP endpoint
([SOCIAL-TRAFFIC-MCP-2026-10-03](SOCIAL-TRAFFIC-MCP-2026-10-03.md), RFC-052 §2,
RFC-053 §12) and the aggregate-analysis allowance of RFC-046 §6.

## Why

The site exists to make a person start the Programme; the research menu opens
inside it after the third step, and revenue comes from the partner buttons
pressed after that. `social_traffic` counts visits per post, but nothing said,
per country and per source, how many accounts were created, how many started,
how many reached the third step and how many pressed a partner button.

## Decision

- **Tool.** The Learn MCP endpoint (`POST /api/mcp/learn`) lists one more
  read-only tool, `programme_funnel`, next to `social_traffic` and behind the
  same service bearer, owner cookie and rate limit. Input: `{ from?, to? }`, a
  UTC range of at most 92 days, default the last 7.
- **Four stages, each by its own date.** `accountsCreated`
  (`User.createdAt`), `programmeStarts` (`ProgramEnrollment.startedAt`),
  `stepThreeCompletions` (the Mission 08 progress row "Research responsibly",
  `COMPLETED`, by `completedAt`), `outboundClicks` and `partnerClicks`
  (`OutboundClick.attemptedAt` of signed-in people, Production human traffic;
  `partnerClicks` are those that reached the partner). A row is the range's
  activity, not a cohort.
- **Two tables.** `byCountry` groups by the account's sign-up country,
  `bySource` by its sign-up source (the sign-up UTM source, else the
  acquisition source, lower-cased). At most 60 rows each; `totals` cover
  everything.
- **Counts only.** Beside the dates, the only account fields read are the
  sign-up country and the two source fields. No identifier, email, name,
  Programme answer or text, Help, pause or vulnerability value is read or
  returned. Staff accounts are excluded.
- **Small cells are withheld.** A cell of 1 or 2 is returned as `null`. When
  a column has exactly one withheld cell, its smallest other non-zero cell is
  withheld too, so the total cannot give it away. A total of 1 or 2 is
  withheld. Zero is shown.
- **Purpose limitation.** Aggregate, read-only measurement for the Founder's
  weekly look at the funnel. It changes nothing a visitor sees. No page,
  component, offer, ranking, route or letter reads these numbers (one importer,
  the MCP server, pinned by a test), so the prohibition on using Programme
  data to select, rank, time or personalise anything commercial for a person
  is unchanged.
- **No schema change.** No column, table, index or migration.

## Known limits

- Clicks are counted, not people: one signed-in person pressing three partner
  buttons is a cell of 3. The cell names a country or a source, never a person.
- Presses and first steps by people without an account are not here;
  `social_traffic` counts those per consented visit.
- With little traffic most cells are withheld; the totals still read.

## Rollback

Revert the PR. The wider rollbacks of the Learn endpoint
(`LEARN_MCP_ENABLED`, rotating `LEARN_MCP_SERVICE_TOKEN`) still apply.

## Evidence

`tests/programme-funnel.test.ts` (in `learn-content-orchestrator:test`, part of
`ci:quality`): range rules, input rejection before any read, both tables, the
withholding rule over random tables, the row cap, fail-closed errors, the
read-only bounded store and its selected fields, the single importer, MCP
discovery and annotations, error mapping and the bearer gate. The four store
reads were also run once against a local PostgreSQL 16 with test rows on
14 October 2026; there is no PostgreSQL test in CI for this tool yet.
