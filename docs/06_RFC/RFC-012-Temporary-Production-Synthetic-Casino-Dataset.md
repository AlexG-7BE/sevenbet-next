# RFC-012 — Temporary Production Synthetic Casino Dataset

## Status

Approved by Founder Office on 2026-08-06.

## Decision

SevenBet may temporarily publish a small, explicitly fictional casino dataset in the current production database and on the current production site for product validation and partner presentations.

This is a bounded exception to the normal requirement for real, reviewed operator data. It does not approve a separate Demo environment, a Demo PostgreSQL database, fingerprint-based environment separation, or the fixture adapter proposed for future RFC-011 work. That proposal remains deferred and is not part of this implementation.

## Scope

- Three to five deterministic casino aggregates created through the existing Casino Builder publication workflow.
- Slugs prefixed with `demo-`, fictional brand names and reserved `.example` domains.
- Existing casino, editorial, media-image, bonus and affiliate-routing entities only.
- One controlled available commercial state whose redirect returns to the casino's own SevenBet profile; all remaining commercial actions are unavailable.
- Production presentation on `/casinos` and `/casino/[slug]`.

## Safety and truthfulness controls

- Every profile identifies itself as a synthetic product demonstration and not a real operator or offer.
- No real operator claim, licence number, affiliate destination, partner identifier or credential is stored.
- The required licence block uses a plainly fictional `Demo Regulatory Sandbox — not a real regulator` authority, no verification URL and no licence number.
- Bonus content is labelled as a demonstration and is not represented as a live partner promotion.
- The controlled redirect may point only to an internal SevenBet profile URL over HTTPS. It must never resolve to a gambling destination.
- Programme, pause, Help and vulnerability data remain outside commercial personalisation and this dataset.

## Data lifecycle

The implementation must contain a source-controlled manifest with deterministic casino and owned-record identifiers. Cleanup must first verify every fixed casino ID against its expected `demo-*` slug, then delete only the exact affiliate and casino IDs in the manifest. Casino-owned versions, revisions, editorial records and relation records may be removed only through their existing foreign-key cascade from an exact casino ID.

Unknown records, real records and prefix-wide deletion are prohibited. Synthetic records must be removed or replaced with approved real operator records when real operators become available.

## Schema and architecture

No Prisma schema change or migration is approved or required. Casino publication continues through draft, validation, review, approval and immutable published-version creation. The seed is an operational data command, not a second repository, generic fixture adapter, workflow DSL or alternate public read path.

## Rollback

Run the dedicated cleanup command, confirm that all manifest casino IDs and redirect IDs are absent, then verify that the public catalogue contains no `demo-*` slugs. The cleanup command is intentionally incapable of deleting records outside the manifest.
