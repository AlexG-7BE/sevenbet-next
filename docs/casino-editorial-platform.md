# Casino Editorial Platform

**Detected implementation:** Casino editorial reviews are stored separately from the legacy casino aggregate in append-only `EditorialReviewRevision` records. A promoted revision is the only new editorial content read by the public review runtime; draft revisions are reachable only through authenticated administrative APIs and short-lived hashed preview tokens.

The platform extends the existing Casino Builder, media manager, staff authorization, affiliate redirect boundary, public casino route, and cache invalidation. It deliberately does not change jurisdiction enforcement or affiliate routing.

## Editorial contract

`lib/editorial-review/types.ts` defines a framework-independent, structured document with ordered sections and allow-listed blocks. Raw HTML and arbitrary iframe URLs are not accepted. Image blocks refer to canonical media assets; video blocks only accept YouTube and Vimeo provider IDs.

## Workflow

Draft → In Review → Approved → Published is enforced in `EditorialReviewService`. Publishing validates the revision and promotes it without rewriting the historical record. Archive and suspension remove the editorial review from the new public path. The legacy public snapshot remains a compatibility fallback until its casino has an editorial review.

## Technical debt report

| Problem | Impact | Recommendation | Priority | Complexity |
| --- | --- | --- | --- | --- |
| No repository-evidenced production migration runner or database environment | Migration application cannot be verified locally | Add CI migration validation and deployment migration ownership | High | Medium |
| Existing casino builder permits `casino.edit` users to initiate legacy publication workflow | Editorial separation of duties is incomplete for pre-existing workflow | Add explicit casino review/publish permissions in a governed follow-up | High | Small |
| Existing legacy public casino rendering remains field-layout based | Not every legacy record is immediately represented by structured blocks | Backfill approved legacy casino data into editorial revisions in a controlled migration job | Medium | Medium |
