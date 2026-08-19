# GB Processor and Transfer Register

- **Controller:** 7BE Inc., trading as B4GAMBLE
- **Evidence date:** 19 August 2026
- **Status:** BLOCKED — EXTERNAL ACTION REQUIRED
- **Owner:** Chief Legal & Compliance Officer with Security and account owners

## Register decision

Repository data flows are mapped. Contract execution, account plan, subprocessors, exact processing locations and transfer-mechanism applicability cannot be proved from source code and must be captured from each live account before controller approval. A provider's public terms are not evidence that 7BE Inc. accepted the applicable version or configured the described control.

## Evidence classification

### Detected

- Vercel hosts the Next.js application and receives request, network, security, session and application traffic.
- Prisma ORM is a code library; the live application uses Prisma's managed Postgres service for durable application data.
- Google sign-in is identity-only. B4GAMBLE requests basic identity, strips OAuth token fields before account persistence and does not send Programme words to Google.
- Resend delivers Contact messages to a support mailbox; Google Workspace is the documented mailbox service. Contact message content is not stored in an application Contact table.
- OpenAI receives optional typed input or audio/transcript only after active Programme authority. B4GAMBLE uses Responses with `store: false` and in-memory audio transcription.
- Better Auth is a self-hosted application library, not a separate data recipient. `@vercel/analytics` is removed by RFC-036. Stripe, a live affiliate network and a live operator recipient are not detected.

### Inferred

- Vercel, managed Postgres, Resend, Google Workspace (if the business account is confirmed) and OpenAI act as processors for the bounded customer-data services, subject to their actual agreements. Some service/account telemetry may be processed by them as separate controllers.
- Google's role for Google Account authentication is likely a separate-controller relationship for the identity interaction; any Google Cloud processor terms applicable to the OAuth project require counsel/account confirmation.
- US and other non-UK processing is possible. A UK Extension adequacy route is usable only where the exact US recipient and data are covered by current DPF certification; otherwise an applicable UK Addendum/IDTA and data-protection test/TRA is required.

### Planned

- Capture executed/accepted terms, exact plan/entity, DPA/CDPA, subprocessor list, locations, retention/deletion settings, security evidence, incident terms, rights assistance and transfer mechanism for each active account.
- Complete one data-protection test/TRA per non-adequate transfer mechanism, using the current ICO/DSIT analysis where appropriate.
- Subscribe to subprocessor change notices and record an owner/review cadence.

### Not detected

- Executed agreements, account acceptance timestamps, exact contracting entities, DPF coverage, IDTA/Addendum execution, completed TRA, live database region, mailbox plan, provider deletion settings or subprocessor-notice subscriptions.

## Active service register

| Service | Data and purpose | Role assessment | Location / transfer position | Contract and retention evidence | Status |
|---|---|---|---|---|---|
| Vercel | Hosting; HTTP requests; IP/user agent; cookies/headers; rendered and API payloads; security/operational logs | Processor for customer data; separate controller for defined account/service-generated data under its terms | Public DPA says primary processing is US and may use global subprocessors; exact account and DPF/UK mechanism coverage not evidenced | Public DPA has Article 28, subprocessors and UK transfer clauses for stated plans; account plan/acceptance and actual settings must be captured | BLOCKED — EXTERNAL ACTION REQUIRED |
| Prisma managed Postgres | Account/profile, sessions, Programme authority/progress/confirmed structured output, casino/editorial/affiliate administration and security state | Managed database processor; Prisma ORM itself is only a library | Region is configurable, but the live region and onward locations are not in source | Obtain applicable Prisma Data Platform terms/DPA, region proof, subprocessors, backup/deletion periods and transfer mechanism from the account | BLOCKED — EXTERNAL ACTION REQUIRED |
| Google identity | Google subject identifier, name, email, profile image and transient OAuth tokens for sign-in; tokens stripped before B4GAMBLE account persistence | Separate controller for Google Account authentication is the working assessment; confirm any processor/CDPA scope for the Cloud project | Google infrastructure may be global; exact project/entity and applicable transfer terms not evidenced | Capture production project, scopes, consent-screen links, owners, applicable terms/CDPA and token configuration | BLOCKED — EXTERNAL ACTION REQUIRED |
| Resend | Contact name, reply email, subject, message and support destination for delivery | Processor for message delivery; separate-controller account data may exist | US/global subprocessors possible; verify exact route and UK transfer mechanism | Public DPA and subprocessors exist; capture account acceptance, retention/log settings and transfer applicability | BLOCKED — EXTERNAL ACTION REQUIRED |
| Google Workspace support mailbox | Delivered Contact message and correspondence, sender/recipient metadata and mailbox records | Processor only if a qualifying Workspace business service and CDPA apply; consumer Gmail would be a separate controller and is not an acceptable unverified assumption | Account region/routing and subprocessors not evidenced | Confirm Workspace edition/entity; retain CDPA acceptance, admin retention/deletion, access review and transfer evidence | BLOCKED — EXTERNAL ACTION REQUIRED |
| OpenAI API | Optional typed situation, bounded prompts, audio/transcript and generated Starting Point/guidance; operational token/size/timing metadata | Processor for API customer content under the applicable business terms; defined account data may be separate-controller data | US/selected project region and subprocessors depend on contracted account controls | Capture DPA, subprocessors, transfer route, project region, training opt-in, retention/ZDR/MAM and deletion evidence | BLOCKED — EXTERNAL ACTION REQUIRED |

## Non-recipient and inactive register

| Component | Finding | Status |
|---|---|---|
| Better Auth | Detected as self-hosted code using the application's Prisma database; not a hosted processor | COMPLETE |
| Vercel Analytics | Runtime package, root mount, SDK calls and enable flag removed by RFC-036 | COMPLETE |
| Stripe/payment processor | No package, adapter, route or payment-data flow detected | COMPLETE |
| Affiliate network/operator | Models and fail-closed routing exist, but no real partner authority or active GB outbound flow is present | CONTROL FRAMEWORK COMPLETE — ACTIVATION OFF |
| Optional S3 media | Provider capability exists for staff-managed public media; a live provider/account is not evidenced and no consumer Programme upload uses it | BLOCKED — EXTERNAL ACTION REQUIRED |
| YouTube/Vimeo embeds | Renderer capability and CSP allow privacy-enhanced YouTube/Vimeo frames for editorial blocks; current published-record use is not established by repository evidence | BLOCKED — EXTERNAL ACTION REQUIRED |

## Required provider evidence packet

For each active processor retain: account/project ID without secrets; contracting entity/plan; applicable terms and acceptance date; Article 28 terms; approved subprocessors and notice route; data categories/subjects/purpose; exact regions; retention/deletion/backups; security and breach notice; rights/DPIA/audit assistance; transfer mechanism; DPF verification if relied upon; IDTA/Addendum and TRA/data-protection test if required; owner; review date; and offboarding/deletion procedure.

## Primary sources

- [ICO — controller/processor contracts](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/accountability-and-governance/contracts-and-liabilities-between-controllers-and-processors-multi/when-is-a-contract-needed-and-why-is-it-important/)
- [ICO — international transfers](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/international-transfers/)
- [ICO — completing a transfer risk assessment / data-protection test](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/international-transfers/completing-a-transfer-risk-assessment/)
- [Vercel Data Processing Addendum](https://vercel.com/legal/dpa)
- [Prisma Postgres regions](https://www.prisma.io/docs/postgres/database/regions)
- [Google OAuth 2.0 policies](https://developers.google.com/identity/protocols/oauth2/policies)
- [Google Cloud privacy compliance and CDPA](https://support.google.com/cloud/answer/6329727)
- [Google Workspace privacy compliance and CDPA](https://knowledge.workspace.google.com/admin/compliance/privacy-compliance-and-records-for-google-workspace-and-cloud-identity)
- [Resend Data Processing Addendum](https://resend.com/legal/dpa)
- [Resend subprocessors](https://resend.com/legal/subprocessors)
- [OpenAI API data controls](https://developers.openai.com/api/docs/guides/your-data)
