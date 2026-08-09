# Processor and International-Transfer Register

- **Status:** Evidence register; contracting and transfer review open
- **Last reviewed:** 2026-08-09

This register records repository evidence only. It does not prove a contract, processing location, subprocessor list, adequacy status or transfer safeguard unless the corresponding evidence has been reviewed and recorded.

| Service | Role/use | Data categories visible in implementation | Evidence | Contract/location/transfer status |
|---|---|---|---|---|
| Vercel | Application hosting, deployment, request handling and platform country header | Request data, IP-derived country header, application responses, runtime diagnostics; account/Programme data may transit application functions | **Detected:** Vercel deployment metadata, `VERCEL_ENV`, `VERCEL_BRANCH_URL`, `x-vercel-ip-country`, release operations docs | DPA, controller entity, regions, subprocessors, log retention and UK transfer mechanism **not verified** |
| Prisma Postgres | Hosted PostgreSQL application database and connection pooling | Account, authentication metadata, neutral Programme continuity, legacy Programme rows, XP/achievement data | **Detected:** Prisma datasource/client, `DATABASE_URL`/`DIRECT_URL`, separated Preview/Production resource evidence | Provider terms, region, backup schedule, subprocessors and UK transfer mechanism **not verified** |
| Better Auth library | Application authentication software, not itself evidence of an external processor | Account identifiers, password hash, sessions and verification records in SevenBet database | **Detected:** local package and database models | No separate hosted Better Auth processor **detected**; email delivery provider **not detected** |
| Email delivery | No provider integration detected | None established from repository evidence | **Not detected** | Provider, role, location, DPA, transfer and retention all **not applicable until selected and verified** |
| Public media | Repository-owned static assets and configured public URLs | Public images only; no user-upload processor path detected | **Detected:** static public assets; no separate processor detected | External processor/transfer **not detected** |
| Gambling operators / affiliate networks | Future governed referral only | A future click may disclose normal request data to the selected destination | **Not currently used:** GB commercial/referral disabled; redirect engine off | Partner/controller terms, tracking, transfer and retention **open before any activation** |
| AI provider | Future Programme architecture only | None | **Not currently used** | Separate architecture, DPIA, processor and transfer approval required before use |

## Not detected

- No behavioural analytics, advertising SDK, CRM, email/SMS marketing provider, affiliate pixel/postback processor, APM provider, external queue or automated paging provider is detected in the active application dependencies.
- No current real GB gambling operator or affiliate network receives a SevenBet referral because GB commercial/referral policy remains disabled and the affiliate engine remains off.
- No evidence proves that Protected Help, Self-Check, Personal Limit Tracker or raw Programme narrative is supplied to a gambling operator.

## Required evidence before approval

For each processor, record the contracting legal entity, controller/processor role, processing purposes, categories, data subjects, instructions, security terms, breach notice term, deletion/return term, audit support, subprocessor list/change mechanism, processing and backup locations, retention, support access, international-transfer pathway, transfer risk assessment and evidence owner/review date.

Do not select “IDTA”, “UK Addendum”, “adequacy” or another safeguard merely because it is common. Record the executed/verified mechanism and assessment.

## UK representative and ICO actions

- UK Article 27 representative requirement: **required under the approved LEGAL-02 decision**.
- UK representative appointment: **not appointed / not detected**.
- ICO fee/registration assessment: **open**.
- Public representative contact: **must remain absent until a real appointment is complete**.
