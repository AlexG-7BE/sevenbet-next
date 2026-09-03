# GEO, Language and Global Casino Catalog

## Audit scope

**DETECTED on 3 September 2026:** the isolated implementation worktree is based
on authoritative repository SHA
`da36c3f85fd59c4e28efa9e279bb70e9f66608fb`. A recursive repository scan found
2,084 active paths after excluding dependencies, generated output, build
artifacts, test output, caches and `tsconfig.tsbuildinfo`; 1,883 paths were under
`app`, `components`, `lib`, `prisma`, `scripts`, `tests` and `docs`.

## Public request model

**DETECTED:** `lib/market/registry.ts` defines six published public languages
(`en`, `de`, `es`, `el`, `sv`, `da`) and keeps regional BCP-47 variants internal.
`lib/market/presentation-resolver.ts` resolves language independently from the
trusted request country. `lib/jurisdiction/request-country.ts` remains the
trusted Production/Preview country ingress. Public route, query, cookie and
`Accept-Language` values cannot grant market authority.

**DETECTED:** `middleware.ts` normalises public BCP-47 and market-first legacy
paths to one-hop `308` language canonicals, removes `country`, and rewrites only
central allowlisted localizable routes. Programme and excluded route families
retain separate authorities.

**DETECTED:** the `b4g_presentation` cookie uses language-only v2 values. Legacy
country/locale values are discarded. The public selector exposes published
languages only and posts through a signed return-path boundary.

## Casino publication and projection

**DETECTED:** the public repository selects the newest immutable published
`CasinoVersion` per non-archived published Casino. PostgreSQL JSON projection
returns only the exact requested `CasinoCountry` object or an empty array. It
does not transfer every market profile and does not create database rows.

**DETECTED:** discovery, detail, comparison and offer services receive the
trusted request market separately from language. Demo/synthetic IDs are
excluded from the catalog. Public global identity is combined with only
exact-market facts; missing facts stay missing. Offer and tracking resolution
is exact-country and cannot fall back to GB or another profile.

**DETECTED:** `lib/public-casino/presentation-disposition.ts` produces
`PROMOTABLE`, `INFORMATIONAL_ONLY` or `HIDDEN`. Informational DTOs remove
promotional score/rank/highlights, bonus/offer and outbound action. Hidden
records do not enter public discovery/detail/comparison. Best Offers and Bonuses
require promotable records.

## Query and cache behavior

**DETECTED:** country query parameters are ignored by public query parsers and
removed during canonical migration. Public Casino and comparison APIs take
country only from the trusted server request signal.

**DETECTED:** global discovery performs one publication read and one batched
context read for a 50-Casino deterministic test case. The repository exact-market
JSON projection bounds per-record profile transfer. No per-Casino query is
introduced.

**DETECTED:** market-sensitive HTML responses are private/no-store, so their
isolation does not depend on a shared CDN honouring a custom `Vary` dimension.
Public APIs are private/no-store and vary on `X-Vercel-IP-Country`. Unprefixed
language negotiation additionally varies on `Accept-Language` and `Cookie`.
Language-only canonicals never expose country. This matches Vercel's documented
rule that responses carrying `private` or `no-store` are ineligible for CDN
caching: <https://vercel.com/docs/caching/cdn-cache>.

## SEO and privacy

**DETECTED:** metadata, OpenGraph URLs, structured data, internal navigation and
language alternates emit language-only URLs. Non-English indexability stays
disabled under the existing publication policy.

**DETECTED:** no raw IP storage, country cookie, new analytics identifier,
Prisma schema change or migration is introduced. Programme, Help and safety
data remain outside commercial resolution. Help/Responsible Gambling market
resources use trusted request country independently from presentation language.

## Known limits

**UNKNOWN:** no configured market currently has a live Production-eligible
partner route in the audited data. Passing `PROMOTABLE` branches are therefore
verified deterministically with injected test authority, not claimed as live
commercial evidence.

**UNKNOWN:** legal permission for neutral information differs by market and can
change. The conservative repository policy permits missing/unknown neutral
identity only for GB and DE; other configured markets fail closed until a new
bounded evidence review changes that policy.
