# Processor and International-Transfer Register

- **Status:** Evidence register; contracting and transfer review open
- **Last reviewed:** 2026-08-12

This register records repository evidence only. It does not prove a contract, processing location, subprocessor list, adequacy status or transfer safeguard unless the corresponding evidence has been reviewed and recorded.

| Service | Role/use | Data categories visible in implementation | Evidence | Contract/location/transfer status |
|---|---|---|---|---|
| Vercel | Application hosting, deployment, request handling and platform country header | Request data, IP-derived country header, application responses, runtime diagnostics; account/Programme data may transit application functions | **Detected:** Vercel deployment metadata, `VERCEL_ENV`, `VERCEL_BRANCH_URL`, `x-vercel-ip-country`, release operations docs | DPA, controller entity, regions, subprocessors, log retention and UK transfer mechanism **not verified** |
| Prisma Postgres | Hosted PostgreSQL application database and connection pooling | Account, authentication metadata, neutral Programme continuity, legacy Programme rows, XP/achievement data | **Detected:** Prisma datasource/client, `DATABASE_URL`/`DIRECT_URL`, separated Preview/Production resource evidence | Provider terms, region, backup schedule, subprocessors and UK transfer mechanism **not verified** |
| Better Auth library | Application authentication software, not itself evidence of an external processor | Account identifiers, password hash, sessions and verification records in SevenBet database | **Detected:** local package and database models | No separate hosted Better Auth processor **detected**; email delivery provider **not detected** |
| Google Identity / OAuth | Optional authentication provider when separately configured | Google account subject identifier, name, email, email-verification status and profile image; identity tokens/scopes exist transiently during callback verification but are stripped from the durable application account row; no Programme narrative or mailbox/contacts scope | **Detected in code, external activation not verified:** Better Auth Google provider; only default `openid`, `email`, `profile` identity scopes; fixed callback; client ID-token sign-in and provider-token/account-management endpoints disabled; provider hidden without a complete credential pair | Exact contracting entity, controller/processor classification, applicable terms, locations, subprocessors, retention, deletion/revocation and UK transfer mechanism **not verified** |
| Resend Contact delivery | Narrow transactional delivery from the public Contact endpoint to the existing support mailbox; separate from account/Programme communications | Visitor name if supplied, email, subject, message, transactional sender/recipient and delivery metadata; no Programme, Self-Check, Protected Help, casino-personalisation or marketing data | **Detected in code; external activation not detected:** direct server-side HTTPS adapter, exact enable flag, approved From/To allow-list, plain text only, no automatic retry, tracking or application-database persistence | Provider role, exact contracting entity, DPA, locations, subprocessors, support access, retention, deletion, security evidence and UK transfer mechanism **not verified**. DNS/domain and real delivery remain deferred/blocked until RFC-027 gates pass. |
| Account and Programme email delivery | Provider-independent policy/transport foundation only; disabled in normal runtime | No provider-held account/Programme message or recipient data established from repository evidence | **No Production send path:** closed purposes, fixed templates, disabled and in-memory test adapters | Provider, role, location, DPA, transfer, retention, suppression and complaint handling remain **open before any separate activation** |
| Public media | Repository-owned static assets and configured public URLs | Public images only; no user-upload processor path detected | **Detected:** static public assets; no separate processor detected | External processor/transfer **not detected** |
| Gambling operators / affiliate networks | Future governed referral only | A future click may disclose normal request data to the selected destination | **Not currently used:** GB commercial/referral disabled; redirect engine off | Partner/controller terms, tracking, transfer and retention **open before any activation** |
| OpenAI API | Preview-only completed-file transcription and bounded Mission 01 Starting Point transformation under RFC-023 | Current in-memory audio file and transcript for transcription; current bounded situation, up to two clarification answers and generated candidate for Programme AI; technical token/latency counts | **Detected in activation-branch code; successful live call not detected:** direct server adapters use `gpt-4o-transcribe` and `gpt-5.6-terra`; Responses request uses `store=false`, no background/conversation/previous response/tools; no application database retention of raw audio/transcript/provider messages | Exact contracting entity, DPA, controller/processor roles, account data-sharing/training setting, locations, subprocessors, support access, deletion, default abuse-monitoring retention and UK transfer mechanism **not verified**. Founder/team/synthetic Preview only; unrestricted Production data blocked pending approved ZDR/MAM or another reviewed retention position |

## Not detected

- No behavioural analytics, advertising SDK, CRM, email/SMS marketing provider, affiliate pixel/postback processor, APM provider, external queue or automated paging provider is detected in the active application dependencies. Google identity code does not add a Google client SDK or mailbox API. The OpenAI integration uses platform fetch and adds no provider SDK dependency.
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
