# Assumptions and Constraints

## Detected constraints

- Product Vision & Principles is the repository’s documented source of truth; `AGENTS.md` and `CONTRIBUTING.md` require documentation-first work and RFCs for substantial decisions.
- The implementation is a private npm package, Next App Router application, PostgreSQL/Prisma system with Better Auth, and local/Vercel-linked development evidence.
- Node.js 24.x is the repository/Vercel/CI runtime contract; pull requests use deterministic Quality, Build/Browser and fresh-PostgreSQL Migration checks.
- Admin access uses authenticated staff profiles and permission checks; a legacy preview-token path only operates when explicitly enabled by environment configuration.
- Public casino CMS usage and affiliate redirects are environment-gated (`PUBLIC_CASINO_CMS_ENABLED`, `AFFILIATE_REDIRECT_ENGINE_ENABLED`).
- The bounded GB market policy is repository-controlled, evidence-linked, expires after 30 days and currently permits editorial content while denying commercial/referral capability. Request country is trusted only from Vercel's country header in a positively identified Preview/Production runtime.
- Product Vision constrains commercial behavior: SevenBet is not an operator, must not take funds, must disclose affiliate status, and requires locally applicable regulation before operator direction. GB-MARKET-01 technically enforces the market/operator/referral gates it defines; external legal approval, age/account decisions and real partner authority remain separate.

## Explicitly unconfirmed assumptions

- Production database backup/restore capability, Production migration automation, Preview isolation completion, or a successful provider restore drill.
- Active Everflow or S3 credentials/connections, even though adapters/providers exist.
- Automated analytics/APM/paging, central log retention, backups, data-retention automation, account lifecycle, performance budgets, or service-level objectives. Vercel logs, incident runbooks and an hourly read-only smoke are detected but do not establish those broader capabilities.
- A generic multi-market/multi-jurisdiction persistence model, durable licensed-domain evidence representation, final GB legal approval, verified age/account authority or a real commercially eligible GB partner.
- Generic article CMS/editor functionality, user self-service account UI, payments, notifications, or reporting.

## Audit boundary

No environment values, tokens, database credentials, or local `.env` contents are documented. Planned functionality in product documentation is labeled planned unless code/configuration evidence establishes it.
