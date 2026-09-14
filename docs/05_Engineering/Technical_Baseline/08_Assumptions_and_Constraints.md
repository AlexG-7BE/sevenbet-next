# Assumptions and Constraints

**Current-state reconciliation:** 14 September 2026.

## Detected constraints

- Product Vision & Principles is the repository’s documented source of truth; `AGENTS.md` and `CONTRIBUTING.md` require documentation-first work and RFCs for substantial decisions.
- The implementation is a private npm package, Next App Router application, PostgreSQL/Prisma system with Better Auth, and local/Vercel-linked development evidence.
- Node.js 24.x is the repository/Vercel/CI runtime contract; pull requests use deterministic Quality, Build/Browser and fresh-PostgreSQL Migration checks.
- Admin access uses authenticated staff profiles and permission checks; a legacy preview-token path only operates when explicitly enabled by environment configuration.
- Public casino CMS usage and affiliate redirects are environment-gated (`PUBLIC_CASINO_CMS_ENABLED`, `AFFILIATE_REDIRECT_ENGINE_ENABLED`).
- Request GEO is trusted only from the positively identified hosting boundary and normalizes once to an exact country. Public commercial action requires one exact `MarketActivation` plus factual binding, destination, legal and health checks; missing or blocked authority returns null. Parent-country and active `ZZ` runtime permission fallback are absent.
- Product Vision constrains commercial behavior: B4GAMBLE is not an operator, must not take funds, must disclose affiliate status, and requires locally applicable regulation before operator direction. RFC-019 changes only the consumer brand from SevenBet; GB-MARKET-01 continues to enforce the market/operator/referral gates it defines, while external legal approval, age/account decisions and real partner authority remain separate.

## Explicitly unconfirmed assumptions

- Production restore execution and Production migration automation. Managed snapshot metadata, Preview/Production isolation and a successful isolated Preview provider restore drill are detected; they do not establish an authorised Production restore.
- Active Everflow or S3 credentials/connections, even though adapters/providers exist.
- APM/paging, central log retention, performance budgets or service-level objectives. The active RFC-046 customer/analytics/email ledger, managed snapshot metadata, bounded Programme transient purge, Vercel logs, incident runbooks and an hourly read-only smoke are detected but do not establish those broader capabilities.
- Final general legal approval or verified age/account authority beyond the exact implemented jurisdiction and market evidence. Existing canonical exact-market routes do not prove an unrestricted operator or market claim.
- Generic article CMS/editor functionality, complete user self-service account
  UI, payments or general notifications. A narrow Contact-to-support Resend
  adapter and the bounded RFC-046 lifecycle provider are purpose-specific.
  Founder authority, protected-cron worker, registered webhook and six-case
  Production acceptance establish only the approved lifecycle-email purposes,
  not a generic notification platform.

## Audit boundary

No environment values, tokens, database credentials, or local `.env` contents are documented. Planned functionality in product documentation is labeled planned unless code/configuration evidence establishes it.
