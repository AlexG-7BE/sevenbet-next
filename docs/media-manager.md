# Casino Media Manager

## Scope

Phase 3.8 extends the `MediaAsset` table created in CMS migration `0001`. It does not delete or rewrite `CasinoImage`, seed JSON, public casino pages, `/go`, or `/r`. The new manager covers casino logos, favicons, hero images, screenshots, galleries, bonus creatives, social images, affiliate creatives, and other owned image references.

## Architecture

`Admin UI` → authenticated media route → `MediaService` → validation/processing → `StorageProvider` → `MediaRepository` → PostgreSQL and `AuditLog`.

Client components never import Prisma or storage credentials. A media asset has optional Casino, CasinoBonus, and AffiliateOffer ownership. Phase 3.8 requires a Casino owner for new uploads; creative ownership is checked against that casino.

The existing `MediaAsset.url` and `MediaAsset.alt` database columns are exposed as `publicUrl` and `altText` through Prisma `@map`. This preserves existing rows without a column rename. Legacy rows receive deterministic `legacy/{uuid}` storage keys during migration.

## Supported asset types

- `LOGO`, `FAVICON`, `HERO`
- `SCREENSHOT`, `GALLERY`
- `BONUS_CREATIVE`, `SOCIAL_IMAGE`, `AFFILIATE_CREATIVE`
- `OTHER` for controlled payment/provider references and future catalog uses

Only one featured asset is kept for a given owner/type tuple. Bonus and affiliate selectors link assets through ownership fields. Selecting a featured social image also synchronizes the existing `CasinoSeo.socialImage` URL; canonical metadata is untouched.

## Upload and compensation flow

1. Verify `media.manage` and parse bounded multipart data.
2. Validate owner relationships, filename, actual byte signature, declared MIME, extension, dimensions, and payload size.
3. Decode structural image metadata, remove supported EXIF/text metadata, and calculate SHA-256.
4. Detect an existing checksum for the same owner/type.
5. Upload to a server-generated, checksum-based storage key using create-if-absent semantics.
6. Create the database record and audit entry in one PostgreSQL transaction.
7. If database creation fails, delete the uploaded object only when this request created it. A failed compensation attempt creates a safe diagnostic audit event.

Storage credentials, signed URLs, raw upload errors, IP addresses, and user agents are not logged.

## Validation and processing

Accepted formats are JPEG, PNG, WebP, and AVIF. SVG, HTML, executable/archive payloads, arbitrary remote URL imports, path traversal, control characters, spoofed extensions, and MIME mismatches are rejected.

PNG validation inflates image data and checks chunk CRCs. JPEG/WebP/AVIF validation checks format structure and decodes dimensions. JPEG APP1/APP13, PNG textual/EXIF chunks, and WebP EXIF/XMP chunks are removed. AVIF containing embedded EXIF is rejected unless a future metadata-safe processor is installed.

`ImageVariantProcessor` is the extension point for thumbnail and WebP/AVIF variants. Phase 3.8 preserves a sanitized original and stores variant metadata, but does not bundle a native image package because dependency installation was unavailable in the implementation environment. A pinned `sharp` adapter can be added without changing the service or database contract.

## Ordering, lifecycle, and usage protection

Ordering uses normalized increments of 1000 and falls back to `createdAt` and UUID. Drag reorder and Move up/down use the same service operation.

Archive is the default removal action. Physical delete requires an archived asset with no featured, bonus, affiliate, or SEO usage. Storage deletion failure retains the record as `STORAGE_DELETE_FAILED`. Upload, update, reorder, archive, restore, delete, link, and unlink actions use the real AdminUser UUID in `AuditLog`.

## Migration rollout

Migration `0009_media_manager` is additive and is intentionally not applied by this phase.

1. Review the SQL and back up production.
2. Configure production storage and test it outside the application.
3. Run `npx prisma migrate deploy` from an authorized environment.
4. Run `npx prisma migrate status` and `npx prisma generate`.
5. Deploy the application only after the migration is confirmed.
6. Test one logo upload, preview, archive, and restore before wider editorial use.

Do not use `db push` or `migrate reset`.

## Retention and future work

Archived database records remain until an authorized editor performs safe deletion. Object-store lifecycle policies must not delete active keys. Future phases should add a reconciliation job for orphan detection, native thumbnail/format generation, CDN purge hooks, malware scanning, and public casino rendering from published media snapshots.
