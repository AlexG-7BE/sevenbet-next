# Assumptions and Constraints

## Detected constraints

- Product Vision & Principles is the repository’s documented source of truth; `AGENTS.md` and `CONTRIBUTING.md` require documentation-first work and RFCs for substantial decisions.
- The implementation is a private npm package, Next App Router application, PostgreSQL/Prisma system with Better Auth, and local/Vercel-linked development evidence.
- Node.js 24.x is the repository/Vercel/CI runtime contract; pull requests use deterministic Quality, Build/Browser and fresh-PostgreSQL Migration checks.
- Admin access uses authenticated staff profiles and permission checks; a legacy preview-token path only operates when explicitly enabled by environment configuration.
- Public casino CMS usage and affiliate redirects are environment-gated (`PUBLIC_CASINO_CMS_ENABLED`, `AFFILIATE_REDIRECT_ENGINE_ENABLED`).
- The bounded GB market policy is repository-controlled, evidence-linked, expires after 30 days and currently permits editorial content while denying commercial/referral capability. Request country is trusted only from Vercel's country header in a positively identified Preview/Production runtime.
- Product Vision constrains commercial behavior: B4GAMBLE is not an operator, must not take funds, must disclose affiliate status, and requires locally applicable regulation before operator direction. RFC-019 changes only the consumer brand from SevenBet; GB-MARKET-01 continues to enforce the market/operator/referral gates it defines, while external legal approval, age/account decisions and real partner authority remain separate.

## Explicitly unconfirmed assumptions

- Production restore execution and Production migration automation. Managed snapshot metadata, Preview/Production isolation and a successful isolated Preview provider restore drill are detected; they do not establish an authorised Production restore.
- Active Everflow or S3 credentials/connections, even though adapters/providers exist.
- APM/paging, central log retention, complete account lifecycle, performance budgets or service-level objectives. Vercel Analytics source integration, managed snapshot metadata, bounded Programme transient purge, Vercel logs, incident runbooks and an hourly read-only smoke are detected but do not establish those broader capabilities or their current hosted activation.
- A generic multi-market/multi-jurisdiction persistence model, final GB legal approval, verified age/account authority or a real commercially eligible GB partner. COMM-01 adds a bounded repository-controlled GB licensed-domain evidence representation; its real record set is empty.
- Generic article CMS/editor functionality, user self-service account UI, payments or general notifications. A narrow Contact-to-support Resend adapter and aggregate Programme analytics report are detected; they do not establish account/Programme mail or a general reporting platform.

## Audit boundary

No environment values, tokens, database credentials, or local `.env` contents are documented. Planned functionality in product documentation is labeled planned unless code/configuration evidence establishes it.
