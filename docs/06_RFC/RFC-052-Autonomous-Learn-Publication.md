# RFC-052: Autonomous Learn Publication

- **Status:** `ACTIVE`
- **Decision authority:** explicit Founder instructions, 21–22 September 2026
- **Scope:** one service-authenticated, create-only `learn_apply` MCP mutation
  for canonical Learn Articles
- **Depends on:** Product Vision & Principles, RFC-013, RFC-023, RFC-027,
  RFC-037, RFC-039, RFC-044 and RFC-051
- **Supersedes:** RFC-051 only for the exact Learn-only MCP endpoint and direct
  MCP SDK dependency defined here
- **Does not revive:** Commercial/Media MCP, operational OAuth, DCR, browser
  consent, delegated Founder authority, Partner/route mutation or promotional
  media authority

## 1. Decision

B4GAMBLE exposes exactly one autonomous Learn mutation, `learn_apply`. One
call supplies one complete new Article, SEO and image state. The operation
resolves `CREATE` or a same-request idempotent `NO_CHANGE`, prepares every
dependency before database mutation, atomically creates the canonical Article
as `PUBLISHED`, invalidates public Article surfaces and performs bounded public
verification. Autonomous update or replacement of an existing Article is not
authorized.

This is a transport and application operation over the existing Article
domain. `Article` remains the only Learn content authority. `ContentRevision`
remains immutable prior-version history; `AuditLog` remains audit authority;
`AdminUser` remains actor authority. No new model, table, content/media/job
entity, queue, CMS, migration or publication state machine is introduced.

The existing human `DRAFT → IN_REVIEW → APPROVED → PUBLISHED` Admin lifecycle
remains unchanged and is the only route for editing an existing Article. The
autonomous create does not execute those transitions and never writes a
`ContentRevision` for replacement.

## 2. Boundary relative to RFC-051

RFC-051 remains authoritative for Commercial and Media retirement. RFC-052
does not restore the former shared OAuth provider, discovery documents, DCR,
consent pages, refresh/access-token persistence, Commercial tools, Media tools
or retired connector registrations.

The new endpoint is the isolated `/api/mcp/learn` stateless Streamable HTTP
resource. It exposes one tool and requires one server-held bearer credential.
It has no browser session, interactive MFA or query-secret path. The direct
`@modelcontextprotocol/sdk` dependency exists solely for this exact transport.

## 3. Canonical input and identity

The closed input contains:

- `requestId`;
- required literal-null `articleId` and required literal-null
  `expectedUpdatedAt`;
- every current `ArticleDocumentInput` field;
- the complete current block union: paragraph, heading, list, quote, callout,
  image and link;
- nullable hero image;
- SEO title, description and canonical URL;
- reading time and difficulty; and
- image source union `url | base64 | generate`.

The database's global unique `Article.slug` is the create identity. A non-null
Article ID or version is rejected by the public tool contract. Any Article
already using the target slug fails closed before image preparation or
mutation. The only exception is an exact replay of the same `requestId` and
same normalized CREATE intent against the Article created by that request;
that replay may return `NO_CHANGE`. A reused request ID with different intent,
missing/mismatched audit identity, or an Article that appears while
dependencies are prepared also fails closed.

Only locales accepted by the current published language registry and
categories present in the current Learn category registry can publish.
Responsible Gambling presentation, protected Help and related-reading
constraints remain unchanged.

## 4. Atomicity, revisions and replay

The application layer validates the create-only contract before calling
`ArticleService.applyPublishedDocument`. The Article boundary validates again
and runs one serializable transaction with sorted PostgreSQL advisory locks
for request, target slug and referenced content-addressed image keys.

- Create writes one final `PUBLISHED` Article and one `learn_apply` audit.
- Same-request no-change writes no revision, audit or timestamp. It still
  revalidates and verifies the Article created by that request so a retry can
  recover a prior post-commit cache/verification failure.
- A different request that sees the same slug, including a concurrent Article
  created after dependency inspection, conflicts even when its document bytes
  happen to match. It cannot be treated as an idempotent replay.

Raw `requestId` is never persisted or logged. Audit metadata stores its
SHA-256, the normalized intent/document fingerprints and bounded resolved-image
metadata. Same-request retry after an ambiguous network result returns
`NO_CHANGE` when the committed Article still matches. Content-addressed image
keys and reusable audit metadata prevent repeated image objects or provider
generation on an equivalent retry. A later independent Article change makes
an old request replay conflict instead of reverting content.

## 5. Image acquisition and storage

All source modes become controlled first-party objects; arbitrary remote URLs
are never persisted directly in an Article.

1. HTTPS URL acquisition uses the existing DNS-pinned, redirect-bounded,
   private-address-blocking remote fetch primitive.
2. Base64 accepts canonical raster bytes only, with a 2.5 MiB decoded ceiling
   inside the platform's 4.5 MB Function payload limit.
3. Generation uses the existing `OPENAI_API_KEY` convention and a narrow
   `gpt-image-2` adapter behind `LEARN_IMAGE_GENERATION_ENABLED=true`.

Every result passes existing byte/MIME/extension/dimension validation, existing
metadata stripping, validation again, deterministic
`content/learn/<sha256>.<extension>` upload and storage metadata verification.
The Article stores only the resulting URL in `heroImageUrl` or the canonical
image block. `MediaAsset` is not used because its ownership model is Casino-
oriented.

On pre-commit failure only objects for which this operation received
`created=true` are compensation candidates. Pre-existing deduplicated objects
are never deleted. Cleanup and publication share a PostgreSQL advisory lock for
each content-addressed key; reference checks cover current Articles and Article
revision snapshots. A post-commit byte-for-byte storage check restores a key
that a preceding failed concurrent operation removed before this transaction
obtained its lock. Ambiguous or failed compensation is logged and retained
rather than risking a live reference.

Image prompts, binary content, Article prose, provider response bodies and
credentials are prohibited from logs. Provider logs contain only fixed event,
model, latency, success/error category and usage counts when available.

## 6. Authentication and actor

`LEARN_MCP_ENABLED=true`, a minimum-32-byte `LEARN_MCP_SERVICE_TOKEN` and
`LEARN_MCP_ACTOR_ID` are all required. Comparison is constant-time over hashes;
responses are private/no-store; a bounded process-local abuse limit supplements
the credential without becoming an authorization authority.

The referenced `AdminUser` must be the unlinked `AUTHOR` named exactly
`B4GAMBLE Content Agent`. The idempotent provisioning script creates or verifies
that ordinary existing-model record. Its ID owns `createdBy`, `updatedBy`,
`ContentRevision.createdBy` and `AuditLog.actorId`. Autonomous work is never
attributed to the Founder or a browser user.

## 7. Public projection and truthful result

After commit, the operation invokes the existing Article tag/path invalidator
for the new path, `/learn` and `/sitemap.xml`. It then
checks, with bounded retries:

- public HTTP success plus exact `data-article-id` and `data-article-updated-at`
  version identity;
- title, description, canonical and OpenGraph hero;
- Article and BreadcrumbList JSON-LD;
- current locale indexing/noindex policy;
- Learn collection visibility;
- sitemap inclusion for indexable locales and policy-consistent exclusion for
  intentionally non-indexable locales; and
- reachability and raster content type for every resolved image.

Only a fully verified projection returns `result: LIVE`. A committed Article
whose cache invalidation or external verification fails returns
`PERSISTED_NOT_VERIFIED`, `persistence: COMMITTED` and never performs a
destructive publication rollback.

## 8. Operations and rollback

Production activation requires the normal RFC-013 PR, required checks,
merged-main Vercel deployment, dedicated actor provisioning, independently
stored token/actor/provider/storage configuration and a bounded real MCP
acceptance. An acceptance Article must be archived through the existing
Article lifecycle after verification; rows, revisions and audit history are
not deleted.

Immediate transport rollback is `LEARN_MCP_ENABLED=false` followed by normal
redeploy/config propagation. Image generation can be disabled independently.
Neither rollback changes Article content. A bad autonomous Article is handled
through the existing human Article lifecycle; storage cleanup must never delete
a referenced immutable object.

## 9. Required regression boundary

Acceptance covers create and same-request no-change, rejection of every update
shape and pre-existing slug, concurrent slug appearance, generated/supplied/
remote hero and inline images, continuous publication, retry after ambiguous
response, all fail-before-mutation paths, storage compensation, service actor
and audit ownership, exact SEO/JSON-LD/sitemap/collection projection, protected
Responsible Gambling behavior, responsive image layout, the unchanged human
Article/Admin lifecycle and a structural guard against prohibited persistence
authorities.
