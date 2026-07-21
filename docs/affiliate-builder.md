# Affiliate Builder

## Scope

Phase 3.6 adds the authenticated admin experience above the Phase 3.5 affiliate foundation. It does not add migrations, public offer pages, redirect execution, click tracking, imports, or credential storage.

## Pages

- `/admin/affiliate`: operational overview and routing candidate preview.
- `/admin/affiliate/networks`: bounded network list plus create/edit pages.
- `/admin/affiliate/programs`: bounded program list plus create/edit pages.
- `/admin/affiliate/offers`: bounded, filtered offer list plus aggregate create/edit pages.

All data mutations require `affiliate.manage` and follow `UI → Admin API → Affiliate Service → Affiliate Repository → Prisma`.

## Save model

Editors send `expectedUpdatedAt` from the last server response. Repositories compare it inside the mutation transaction and return a 409 conflict when another editor saved first. Clients must reload instead of overwriting the newer record. Actor IDs come only from Better Auth staff context.

Network and program changes use generic `AuditLog`, matching the Phase 3.5 architecture. Offer changes record an immutable offer snapshot before mutation. Existing tracking links record their previous destination and tracking URL before updates or archival.

## Editors

The Network editor covers identity, website, type, capability flags, lifecycle, and non-secret notes. API/export capability requires a valid HTTPS network website.

The Program editor covers network, scoped external ID, operator, status, account reference, ISO country/currency lists, archive, and restore. An inactive network cannot own an active program.

The Offer editor covers program, immutable casino ownership, optional casino-owned bonus, payout model, dates, GEO, currencies, terms, priority, lifecycle, revisions, and nested tracking links. Tracking links support add, edit, duplicate, archive, restore, deterministic reordering, verification dates, targeting, and previous URL history.

Phase 3.7 adds a Redirect URLs panel for saved offers. Staff can create a stable `/r/[slug]`, copy its public URL, archive or restore it, and test production candidate selection with country, currency, and language inputs. Slug creation and mutation require `affiliate.manage`; updates use `expectedUpdatedAt`, immutable revisions, and AuditLog.

## Casino integration

The Casino Builder Affiliate Links tab queries new-platform offers by the current casino ID, displays network/program/status/bonus/link counts, and links to the full Offer editor. Quick create opens a draft prefilled with that casino. Existing offers cannot be moved across casinos.

## Routing preview

The preview calls a protected read-only endpoint. It filters inactive, archived, and expired records; applies offer and link GEO/currency constraints; ranks specificity; then resolves ties by link priority, offer priority, verification date, update date, and stable ID. It never calls or changes `/go/[slug]`.

## Legacy coexistence

`AffiliateLink`, `CasinoAffiliateLink`, and `/go/[slug]` are unchanged. The new `/r/[slug]` route is independent and opt-in. Public casino/bonus links are not switched automatically, and no implicit fallback to legacy destinations is allowed.
