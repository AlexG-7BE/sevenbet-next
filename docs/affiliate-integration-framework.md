# Affiliate Program Integration Framework

## Domain boundaries

SevenBet owns the canonical domain records:

- `Casino` is the reviewed brand.
- `AffiliateProgram` is a specific commercial relationship with an operator or network.
- `AffiliateOffer` stores locally approved commercial and targeting data.
- `AffiliateTrackingLink` stores locally validated redirect candidates.
- `AffiliateNetwork` remains a commercial network directory. It is not an integration adapter.

`providerType` on `AffiliateProgram` selects an external adapter. Provider records never become an alternative source of public casino content. The public Redirect Engine reads only local PostgreSQL records and never calls a provider.

One Casino may have many programs and offers. A program may remain unmatched until an administrator links it to a canonical Casino.

## Additive data model

Migration `0010_affiliate_integration_foundation` adds:

- integration, connection, sync, account, and source-of-truth settings to `AffiliateProgram`;
- external metadata and sync timestamps to offers and tracking links;
- `CasinoAlias` for exact brand and domain aliases;
- `AffiliateExternalMapping` for provider-scoped idempotency;
- `AffiliateImportJob` and `AffiliateImportItem` for dry-run, apply, audit, and partial failure reporting.

External IDs are unique only within `(providerType, affiliateProgramId, entityType)`. Existing Phase 3 offers, links, redirect slugs, revisions, and legacy records remain unchanged.

## Adapter architecture

Every adapter implements `AffiliateProviderAdapter` and declares capabilities. Optional capabilities are not assumed.

Phase 4.1 provides:

- `ManualAffiliateProviderAdapter`: working CSV/JSON imports using the same normalization pipeline as provider data.
- `MockAffiliateProviderAdapter`: deterministic pages and failures for tests only.
- `EverflowAffiliateProviderAdapter`: a safe boundary with no guessed API schema and no network client by default.

To add a provider:

1. Obtain official affiliate API documentation and representative redacted responses.
2. Implement a server-only client with fixed or allowlisted HTTPS hosts, timeouts, bounded retries, response-size limits, and cursor loop protection.
3. Map official DTOs into `ExternalAffiliateOffer`.
4. Add fixture tests for pagination, malformed records, disabled records, and partial failures.
5. Register the adapter explicitly in `AffiliateAdapterRegistry`.
6. Configure a logical credential reference and run connection test, dry-run, reviewed apply, then incremental sync.

The client must never scrape a closed dashboard, bypass a login, or infer undocumented DTO fields.

## Credentials

Credentials are not stored in Prisma, metadata, browser state, API responses, or logs.

The current `EnvironmentAffiliateCredentialStore` is read-only:

1. Add a logical reference such as `everflow_primary` to `AFFILIATE_CREDENTIAL_REFERENCES`.
2. Store the JSON credential object in the managed production secret named `AFFILIATE_CREDENTIALS_EVERFLOW_PRIMARY`.
3. Set `AffiliateProgram.credentialReference` to `everflow_primary`.

Only allowlisted references resolve. The admin UI shows connection/configuration state; connection tests run server-side. Use Vercel encrypted environment variables or a managed secret store. Do not add credential values to `.env.example`, source control, screenshots, or support logs.

## Import and sync lifecycle

1. Adapter fetches bounded pages.
2. Payload sanitizer removes secret-like and prototype-pollution keys.
3. Normalizer validates IDs, dates, ISO targeting values, and HTTPS URLs.
4. Matcher checks existing mapping, exact canonical domain, exact normalized brand, and exact alias.
5. Unknown brands enter `REVIEW_REQUIRED`; no Casino is auto-created or published.
6. Source-of-truth rules produce a changeset and field conflicts.
7. Dry-run persists only job/mapping audit data, not offers or tracking links.
8. Apply re-normalizes the sanitized payload and applies each safe item in its own transaction.
9. Mapping upsert makes retries idempotent.
10. Item failures are recorded without rolling back successful independent items.

New imported offers are draft and links inactive unless `trustedAutoActivation` is explicitly enabled. Provider-missing records are archived only during an explicit full sync when `deactivateMissing` is enabled.

## Matching rules

Automatic matching order:

1. Existing external mapping.
2. Exact normalized canonical domain.
3. Exact normalized Casino title or internal name.
4. Exact brand/domain alias.
5. Explicit program Casino relation or administrator match.
6. `REVIEW_REQUIRED`.

No fuzzy result is written automatically. Manual matching records the staff actor and becomes the stable mapping for later imports.

## Conflict and source-of-truth rules

Supported policies:

- `MANUAL_WINS`
- `PROVIDER_WINS`
- `PROVIDER_IF_EMPTY`
- `REVIEW_ON_CONFLICT`

Defaults keep editorial names, notes, terms, SEO, descriptions, licenses, payments, and reviews manual. Provider external IDs, state, targeting, and tracking URLs are provider-owned. Payout fields require review when both the administrator and provider changed the prior provider snapshot.

## Security controls

- Import request: 512 KB maximum and 5,000 records.
- Provider page: 2 MB maximum, 100 pages, 5,000 total records.
- Connection and sync endpoints have per-process staff/program rate limits.
- Credential-like keys and error values are redacted.
- `__proto__`, `prototype`, and `constructor` are discarded or rejected.
- Tracking, destination, landing, dashboard, and verification URLs require safe HTTPS where applicable.
- Adapter registration and credential references are allowlisted.
- All integration routes require `affiliate.manage`.
- Public redirect inputs cannot supply a destination or adapter.

Future network clients must add provider-specific host allowlists, bounded retry/backoff, and official response-schema validation before registration.

## Production rollout

1. Deploy code containing the additive migration while sync remains disabled.
2. Run `npx prisma migrate deploy`.
3. Run `npx prisma migrate status` and database preflight checks.
4. Verify old offers and `/r/<slug>` before creating integration jobs.
5. Create or update a program in manual mode.
6. Run a small dry-run, review unmatched/conflicts, then apply.
7. Enable provider sync only after credentials, official fixtures, and connection test pass.

### Rollback

Do not run `migrate reset`, `db push`, or edit migrations `0001`-`0010`.

Because `0010` is additive, application rollback is performed by redeploying the prior application version and leaving the new tables/columns in place. Disable `syncEnabled` before rollback. Imported draft offers may be archived through the existing CMS. A database down migration is not part of the routine rollback and would require a separately reviewed maintenance plan after confirming no retained integration data is needed.

## Everflow activation checklist

Before real Everflow access is enabled, obtain:

- official API base URL and authentication method;
- affiliate/account scope identifiers;
- offer and tracking-link endpoint documentation;
- exact pagination and incremental cursor semantics;
- status, payout, GEO, device, language, and creative field definitions;
- rate limits, retry guidance, and webhook signature rules;
- redacted real responses for fixtures;
- confirmation that the API permits the intended synchronization.

Until then the Everflow adapter intentionally returns a configuration error instead of making speculative production requests.
