# SevenBet Headless CMS Phase 1

This phase introduces the CMS foundation without changing the public SevenBet product architecture.

## What Exists Now

- Shared TypeScript domain models for programs, program steps, lessons, articles, casinos, bonuses, affiliate links, users, audit logs and revisions.
- Role and permission matrix for super admin, admin, editor, author, reviewer, affiliate manager, analyst and support.
- Editorial workflow helpers for draft, review, approval, scheduled, published and archived states.
- Validation helpers for slugs, URLs, required fields and publishable content.
- In-memory CMS repository seeded from the current SevenBet static content.
- Admin preview area under `/admin`.
- Admin CRUD API foundation under `/api/admin/:entity`.
- Public read-only API under `/api/public/:resource`.
- Safe affiliate redirect route under `/go/:slug`.
- Prisma schema and first SQL migration for the production database contract.

## Current Admin Access

Phase 1 uses a temporary preview token because no production identity provider is installed yet.

Set this value in local or deployment environment:

```bash
SEVENBET_ADMIN_PREVIEW_TOKEN="replace-with-a-long-random-token"
```

Then open:

```bash
/admin?token=replace-with-a-long-random-token
```

This sets the `sevenbet_admin_preview` HTTP-only cookie and redirects to `/admin`.

## Environment Variables

Use `.env.example` as the starting point:

- `DATABASE_URL`
- `NEXT_PUBLIC_SITE_URL`
- `SEVENBET_ADMIN_PREVIEW_TOKEN`
- `CMS_PHASE1_ALLOW_DEV_ADMIN`
- `CMS_AUTH_PROVIDER`
- `CMS_WEBHOOK_SECRET`

## Data Model

The first Prisma schema includes:

- `AdminUser`
- `Program`
- `ProgramStep`
- `Lesson`
- `LessonBlock`
- `Article`
- `Casino`
- `Bonus`
- `AffiliateLink`
- `ContentRevision`
- `AuditLog`
- `MediaAsset`
- `SiteSetting`

The schema is intentionally broad enough for the SevenBet 10-Step Program, Learning Center, casino reviews, bonus comparisons, affiliate redirects, media and global settings.

## Workflow

Editorial content follows this lifecycle:

```text
DRAFT -> IN_REVIEW -> APPROVED -> SCHEDULED -> PUBLISHED -> ARCHIVED
```

Supported rollback:

- each update creates a revision snapshot;
- revisions can be listed per entity;
- the repository contains restore helpers ready for UI/API wiring.

## Public Publishing Rules

Public CMS API responses only include:

- records with `status = PUBLISHED`;
- bonuses with `status = PUBLISHED` and `offerStatus = ACTIVE`.

Draft, review, archived and expired offer records are excluded from public APIs.

## API Examples

Admin list:

```bash
curl -H "x-sevenbet-admin-token: $SEVENBET_ADMIN_PREVIEW_TOKEN" \
  http://localhost:4173/api/admin/article
```

Public list:

```bash
curl http://localhost:4173/api/public/articles
```

Affiliate redirect:

```bash
curl -I http://localhost:4173/go/sample-casino
```

## Database Migration

The Prisma schema and SQL migration are included, but Prisma packages and a live PostgreSQL database are not installed in this workspace.

When database access is ready:

```bash
npm install prisma @prisma/client
npx prisma generate
npx prisma migrate deploy
```

For local development:

```bash
npx prisma migrate dev --name cms_foundation
```

## Seed Strategy

Phase 1 seed data is generated from the current SevenBet static files:

- current 10-Step Program content from `lib/program.ts`;
- current casino data from `data/casinos.json`;
- sample article, bonus and affiliate link objects.

The next step is to replace the in-memory repository with a Prisma-backed repository and add a formal database seed command.

## Security Notes

- Preview token auth is temporary and must be replaced before real editorial access.
- Admin APIs require the preview cookie or `x-sevenbet-admin-token`.
- Affiliate redirects only allow HTTPS destinations from stored CMS records.
- Public APIs do not expose unpublished content.
- Audit and revision structures are present for change tracking.

## Remaining Phase 2 Work

- Install Prisma and connect to a managed PostgreSQL database.
- Replace the in-memory repository with Prisma queries.
- Add production auth provider and invitation flow.
- Build real create/edit forms for admin workspaces.
- Add media upload and image validation.
- Add deeper automated tests after the repository is database-backed.
