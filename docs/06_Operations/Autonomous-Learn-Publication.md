# Autonomous Learn Publication

**Status:** IMPLEMENTED IN RFC-052 CANDIDATE — PRODUCTION ACTIVATION AND LIVE
EVIDENCE PENDING

**Authority:** explicit Founder instruction of 21 September 2026

## Evidence boundary

**DETECTED:** repository-wide inventory contains one Prisma `Article`, one
`ContentRevision` and one `AuditLog` authority. `Article.slug` is globally
unique. Public Learn, metadata, JSON-LD, collection and sitemap all read
published `Article` records through `ArticleService`.

**DETECTED:** the existing Casino-oriented `MediaService` is not a valid Learn
owner. RFC-052 therefore reuses only its lower-level validation, processing,
remote-fetch and `StorageProvider` primitives. Article image URLs remain fields
of the canonical Article document.

**DETECTED IN THIS CANDIDATE:** `learn_apply` is the only agent-facing Learn
mutation. There is no new Prisma model, table, migration, domain entity, media
entity, queue, job or CMS. Human Admin workflow is unchanged.

**UNKNOWN UNTIL RECORDED BELOW:** Production actor/configuration, merged SHA,
deployment identity and real authenticated MCP acceptance.

## Exact tool contract

The endpoint is `POST /api/mcp/learn`. It uses stateless Streamable HTTP and
requires `Authorization: Bearer <service token>`. `tools/list` exposes exactly
`learn_apply`.

```text
learn_apply {
  requestId: string[8..128],
  article: {
    articleId: UUID | null,
    expectedUpdatedAt?: ISO-8601 UTC | null,
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
    readingTime: string | null,
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
  operation: "CREATED" | "UPDATED" | "NO_CHANGE",
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
`persistence: NOT_COMMITTED` and bounded details. Stack traces, credentials,
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
6. On update, preserve the old current document as `ContentRevision`, replace
   the canonical row and keep it `PUBLISHED`.
7. Invalidate old/new Article paths, Article cache, `/learn` and
   `/sitemap.xml`.
8. Perform bounded public verification. Return `LIVE` only when every
   policy-applicable check passes.

Natural identity is the global slug. A slug move requires `articleId`.
`expectedUpdatedAt` is recommended when the agent has a previously read
version. Independently overlapping writes from the same observation cannot
both commit. A committed retry with the same request and intent is a
`NO_CHANGE`, including when its expected timestamp is now stale because that
exact request produced the current version. `NO_CHANGE` still runs canonical
cache invalidation and public verification, but writes no revision, audit or
timestamp.

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
public reachability and call the same desired state with a new request only
when a new verification run is required. The committed Article remains the
truth.

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

## Production acceptance record

Fill this section only from live authoritative evidence after merge.

- **Merge SHA:** `UNKNOWN`
- **Ready Production deployment:** `UNKNOWN`
- **Service actor:** `UNKNOWN` (record UUID, name and role only; never email or
  credential)
- **MCP discovery:** `UNKNOWN`
- **Real bounded apply:** `UNKNOWN`
- **Public Article/SEO/JSON-LD/Learn/sitemap/image verification:** `UNKNOWN`
- **Acceptance Article archive and pre-existing Article parity:** `UNKNOWN`
