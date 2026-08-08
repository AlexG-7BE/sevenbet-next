# Assumptions and Constraints

## Detected constraints

- Product Vision & Principles is the repository’s documented source of truth; `AGENTS.md` and `CONTRIBUTING.md` require documentation-first work and RFCs for substantial decisions.
- The implementation is a private npm package, Next App Router application, PostgreSQL/Prisma system with Better Auth, and local/Vercel-linked development evidence.
- Node.js 24.x is the repository/Vercel/CI runtime contract; pull requests use deterministic Quality, Build/Browser and fresh-PostgreSQL Migration checks.
- Admin access uses authenticated staff profiles and permission checks; a legacy preview-token path only operates when explicitly enabled by environment configuration.
- Public casino CMS usage and affiliate redirects are environment-gated (`PUBLIC_CASINO_CMS_ENABLED`, `AFFILIATE_REDIRECT_ENGINE_ENABLED`).
- Product Vision constrains commercial behavior: SevenBet is not an operator, must not take funds, must disclose affiliate status, and requires locally applicable regulation before operator direction. These are **planned/governing product constraints**; this baseline does not claim every one is fully enforced technically.

## Explicitly unconfirmed assumptions

- Production database backup/restore capability, Production migration automation, Preview isolation completion, or a successful provider restore drill.
- Active Everflow or S3 credentials/connections, even though adapters/providers exist.
- Automated analytics/APM/paging, central log retention, backups, data-retention automation, account lifecycle, performance budgets, or service-level objectives. Vercel logs, incident runbooks and an hourly read-only smoke are detected but do not establish those broader capabilities.
- A complete jurisdiction/eligibility/compliance enforcement model.
- Generic article CMS/editor functionality, user self-service account UI, payments, notifications, or reporting.

## Audit boundary

No environment values, tokens, database credentials, or local `.env` contents are documented. Planned functionality in product documentation is labeled planned unless code/configuration evidence establishes it.
