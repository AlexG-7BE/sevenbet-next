# Autonomous Learn Publication

**Status:** PRODUCTION BASELINE VERIFIED, 21 SEPTEMBER 2026 — CREATE-ONLY
REVISION PENDING PRODUCTION VERIFICATION

**Authority:** explicit Founder instructions of 21–22 September 2026

## Evidence boundary

**DETECTED:** repository-wide inventory contains one Prisma `Article`, one
`ContentRevision` and one `AuditLog` authority. `Article.slug` is globally
unique. Public Learn, metadata, JSON-LD, collection and sitemap all read
published `Article` records through `ArticleService`.

**DETECTED:** the existing Casino-oriented `MediaService` is not a valid Learn
owner. RFC-052 therefore reuses only its lower-level validation, processing,
remote-fetch and `StorageProvider` primitives. Article image URLs remain fields
of the canonical Article document.

**DETECTED IN CANONICAL MAIN AND PRODUCTION:** `learn_apply` is the only
agent-facing Learn mutation. There is no new Prisma model, table, migration,
domain entity, media entity, queue, job or CMS. Human Admin workflow is
unchanged.

**DETECTED IN THE CURRENT RELEASE CANDIDATE, NOT YET A PRODUCTION CLAIM:** the
autonomous mutation is create-only. The public contract requires null Article
identity/version fields, rejects every existing slug and update shape, and
permits `NO_CHANGE` only for an exact replay of the same CREATE request and
intent. Human Admin editing remains unchanged.

**DETECTED IN LIVE AUTHORITATIVE EVIDENCE:** PR #307, its required checks, the
merged-main Production deployment, dedicated service actor, authenticated MCP
discovery/apply/retry, public projection, archive lifecycle and pre-existing
Article parity are recorded below. No credential or service email is recorded.

## Exact tool contract

The endpoint is `POST /api/mcp/learn`. It uses stateless Streamable HTTP and
requires `Authorization: Bearer <service token>`. `tools/list` exposes exactly
`learn_apply`.

```text
learn_apply {
  requestId: string[8..128],
  article: {
    articleId: null,
    expectedUpdatedAt: null,
    locale: current published language-route default locale,
    category: current registered Learn category slug,
    slug: URL-safe globally unique Article slug,
    title: string,
    excerpt: string,
    tags: unique string[] <= 12,
    bodyBlocks: [
      { id, type: "paragraph", text } |
      { id, type: "heading", level: 2 | 3, text } |
      { id, type: "list", style: "bullet" | "numbered", items } |
      { id, type: "quote", text, citation: string | null } |
      { id, type: "callout", title: string | null, text } |
      { id, type: "image", source, alt, caption: string | null } |
      { id, type: "link", label, url, description: string | null }
    ],
    heroImage: { source, alt } | null,
    seo: {
      title: string | null,
      description: string | null,
      canonicalUrl: internal B4GAMBLE URL/path | null
    },
    readingTime: 1..180 minute string,
    difficulty: "Beginner" | "Intermediate" | "Advanced" | null
  }
}

source =
  { type: "url", url: credential-free HTTPS } |
  { type: "base64", data: canonical base64, mimeType, filename } |
  {
    type: "generate",
    prompt,
    aspectRatio: "1:1" | "3:2" | "2:3" | "16:9" | "9:16",
    quality: "low" | "medium" | "high",
    background: "auto" | "opaque" | "transparent"
  }
```

All objects are closed. The body has at most 100 blocks, 12 images and eight
generated images. Base64 is limited to 2.5 MiB decoded and the complete MCP
request to 4,000,000 bytes, below Vercel's 4.5 MB Function payload ceiling.

Success is:

```text
{
  result: "LIVE" | "PERSISTED_NOT_VERIFIED",
  operation: "CREATED" | "NO_CHANGE",
  persistence: "COMMITTED",
  articleId,
  status: "PUBLISHED",
  url,
  publishedAt,
  updatedAt,
  verified,
  images: [{ slot, url, checksum, mimeType, width, height, sizeBytes }],
  verification: { checks, attempts, failureCode }
}
```

Pre-commit failures are MCP error results with stable `code`, safe `message`,
`persistence: NOT_COMMITTED`, explicit `retryable` and bounded details.
Deterministic contract, identity, existing-slug and configuration failures are
not retried as if they were transient. A PostgreSQL serialization conflict is
explicitly retryable with the same request ID. Stack traces, credentials,
binary data, Article prose and raw provider output are never returned.

## Runtime configuration

Required for the endpoint:

```text
LEARN_MCP_ENABLED=true
LEARN_MCP_SERVICE_TOKEN=<server-only random value of at least 32 bytes>
LEARN_MCP_ACTOR_ID=<UUID of B4GAMBLE Content Agent>
```

Required only when `source.type=generate` is used:

```text
LEARN_IMAGE_GENERATION_ENABLED=true
OPENAI_API_KEY=<server-only secret>
LEARN_OPENAI_IMAGE_MODEL=gpt-image-2   # optional approved default/snapshot
```

Existing Production `MEDIA_STORAGE_PROVIDER=S3` and its existing S3-compatible
configuration are required for any image. `LOCAL` is rejected in Production.
`LEARN_IMAGE_MAX_BYTES` may lower, never raise, the 10 MiB remote/generated
ceiling. `LEARN_APPLY_PUBLIC_ORIGIN` is optional; when set in Production it
must equal `https://b4gamble.com`.

Provision or verify the actor once with Production database authority supplied
only to the explicit operator process:

```text
LEARN_MCP_ACTOR_EMAIL=<dedicated service email> npm run learn-apply:provision-actor
```

The command outputs the non-secret actor UUID. Configure that UUID as
`LEARN_MCP_ACTOR_ID`, then remove the provisioning email/input from the
operator shell. Re-running with the same email is idempotent. Any existing
record whose name, role, user link or requested UUID differs fails closed.

## Apply lifecycle

1. Parse the closed DTO and validate a complete placeholder Article before any
   external or storage work.
2. Resolve the exact service actor and current Article/request audit.
3. Reuse safe prior image metadata for equivalent retries; otherwise resolve,
   validate, process, upload and verify all images.
4. Build and validate the final `ArticleDocumentInput`.
5. Run `ArticleService.applyPublishedDocument` in one serializable,
   advisory-locked transaction.
6. Create one final `PUBLISHED` Article plus its `learn_apply` audit. An
   existing slug conflicts; the autonomous transaction has no Article update
   or `ContentRevision` branch.
7. Invalidate the new Article path, Article cache, `/learn` and
   `/sitemap.xml`.
8. Perform bounded public verification. Return `LIVE` only when every
   policy-applicable check passes.

Natural create identity is the global slug. `articleId` and
`expectedUpdatedAt` are literal null; slug/category moves and Article
replacement are unsupported. Independently overlapping creates for the same
slug cannot both commit. A committed retry with the same request and intent is
`NO_CHANGE` only when the Article created by that audit still exactly matches.
`NO_CHANGE` still runs canonical cache invalidation and public verification,
but writes no revision, audit or timestamp. A different request conflicts even
when its desired document happens to be identical.

## Image behavior and recovery

Remote HTTPS content is acquired through DNS pinning and private-network/
metadata blocking, then copied. Supplied and generated bytes follow the same
validation. Every stored key is immutable and content-addressed:

```text
content/learn/<sha256>.<jpg|png|webp|avif|gif>
```

If database publication fails, only `created=true` objects from that apply are
considered for deletion. A pre-existing deduplicated object is never a cleanup
candidate. Publication and cleanup serialize on the image key; Article and
revision-snapshot references prevent deletion. After commit, the exact prepared
bytes are checked again and restored under the same deterministic key if an
earlier concurrent failure removed them. A currently referenced or
unverifiable object is retained and a safe structured compensation event is
emitted.

If persistence succeeds but cache invalidation or public verification fails,
do not archive or revert automatically. Inspect `failureCode`, verify the
published Article through Admin/read-only database evidence, restore cache/
public reachability and call the same desired state with the same request ID so
the existing committed CREATE is verified through the idempotent `NO_CHANGE`
path. The committed Article remains the truth.

To disable new autonomous writes, set `LEARN_MCP_ENABLED=false`. To stop only
generation, set `LEARN_IMAGE_GENERATION_ENABLED=false`. Existing Articles and
images remain public. Content rollback uses the existing authenticated Article
revision/lifecycle; never delete Article, revision, audit or referenced image
objects as transport rollback.

## Verification commands

```text
npm run learn-apply:test
npm run learn-apply:postgres-test
npm run article-learning:test
npm run article-learning:postgres-test
npm run media:test
npm run responsible-gambling:test
npm run public-ia:test
npm run learn-apply:browser
npm run typecheck
npm run lint
npm run build
```

The required GitHub workflow additionally runs the Learn unit/structural suite
in Quality and its PostgreSQL acceptance in both database-capable jobs.

## Historical Production acceptance record

**DETECTED, 21 SEPTEMBER 2026:** [PR #307](https://github.com/AlexG-7BE/sevenbet-next/pull/307)
merged normally after every required check passed.

- **Merge SHA:** `d162974e4848a429b7ea7ad1ba5075ff11dd5261`.
- **Required checks:** GitHub Actions run `35605143698` passed Agent Core,
  Quality, Database / Migration Verification and Build / Browser. The two
  database-capable jobs both passed `learn-apply:postgres-test`; the browser
  job passed the production build and full browser regression including the
  Learn desktop/mobile fixture. Vercel Preview was Ready.
- **Ready Production deployment:** `dpl_H42JWUgsKD6T1HRKBj4nYypxAjCM`, source
  `main` at the exact merge SHA above, was `READY` and owned the `b4gamble.com`
  aliases. It was a redeploy of the automatic merged-main deployment after the
  new server-only Production variables were stored as Sensitive.
- **Service actor:** `c1b54223-33ec-4e68-9c7e-f16a146d79ca`, exact name
  `B4GAMBLE Content Agent`, role `AUTHOR`, no linked human user. Creation,
  update, audit and archive history all name this actor.
- **MCP discovery/auth:** malformed unauthenticated POST failed with HTTP 401
  before parsing. An official MCP SDK client authenticated by header and
  discovered exactly `["learn_apply"]`.
- **Real bounded apply:** one complete call created Article
  `963e0b4b-20f7-41fe-95a8-1986b7bc009e` as `PUBLISHED` and returned
  `CREATED`, `COMMITTED`, `LIVE`, `verified: true`. Generated hero and inline
  placements deduplicated to one 1536x1024 WebP at checksum
  `bbf6ebb4ba6ebcdc4fb4a2b34300a6a8953773b5180f733a0b210ba3b222178f`.
  The audit stored no raw request identifier.
- **Retry:** the identical authenticated request returned `NO_CHANGE`,
  `COMMITTED`, `LIVE` with the same Article ID, timestamps, URLs and checksum;
  it added no revision or second `learn_apply` audit.
- **Public verification:** the tool passed exact identity/version, SEO,
  indexable robots, Article/Breadcrumb JSON-LD, OpenGraph, Learn collection,
  sitemap and public-image checks on its first attempt. Independent Chromium
  checks at 1440x900, 390x844 and 320x800 returned HTTP 200, exact title,
  description, canonical and OpenGraph image, two loaded placements and no
  horizontal overflow.
- **Archive/recovery:** the first guarded archive call exceeded the existing
  five-second remote interactive-transaction timeout and was confirmed fully
  rolled back: still `PUBLISHED`, zero archive revisions and zero archive
  audits. The safe retry used `ArticleService.transition("archive")` with the
  exact observed timestamp and committed `ARCHIVED` at
  `2026-09-21T14:04:40.954Z`. After the bounded cache fallback the route was
  HTTP 404 and absent from the Learn collection and sitemap. The fixture was
  not deleted; its one pre-archive revision and both `learn_apply`/`archive`
  audit events remain as governed history.
- **Pre-existing Article parity:** before acceptance there were exactly 24
  published Articles and no fixture. SHA-256 over the complete, ID-ordered 24
  rows excluding the fixture was
  `c985981a021efafe012345538d95c01cf76f0bbe4bc0ad8263b114b612c041dc`
  before and after. Final state remains 24 published Articles plus the one
  archived acceptance history row.

## Create-only revision acceptance record

**UNKNOWN — PENDING RELEASE.** Replace this paragraph only with the exact PR,
merged `main` SHA, Ready Production deployment, create-only schema discovery,
bounded autonomous-cycle result and verified Article/state evidence. Do not
rewrite the historical 21 September acceptance record.
