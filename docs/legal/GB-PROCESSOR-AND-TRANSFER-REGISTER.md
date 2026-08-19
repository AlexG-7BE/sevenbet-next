# GB Processor and Transfer Register

- **Controller:** 7BE Inc., trading as B4GAMBLE
- **Evidence date:** 19 August 2026
- **Status:** PROVIDER PUBLIC LEGAL FRAMEWORK REVIEW: COMPLETE
- **Owner:** Internal Legal/Compliance with Security and account owners

## Register decision

Repository data flows and the active managed services are mapped. Current official public frameworks were reviewed where available. A public DPA/CDPA proves only the provider's published framework; it does not prove B4GAMBLE's plan, contracting entity, acceptance, live configuration, location or transfer route. Founder Office has deferred that account-specific evidence without marking it complete.

## Evidence levels

- **Level A — PROVIDER PUBLIC FRAMEWORK VERIFIED:** a current official public DPA/CDPA and its processor, subprocessor and transfer provisions were reviewed. Level A is not account evidence.
- **Level B — ACCOUNT APPLICABILITY / ACCEPTANCE NOT YET CAPTURED:** the B4GAMBLE plan/entity/accepted version/applicability is absent. Every Level B item below is `DEFERRED BY FOUNDER`.
- **Level C — ACCOUNT EVIDENCE VERIFIED:** durable account, contract and configuration evidence has been reviewed. No provider in this register is classified Level C as at the evidence date.

## Repository evidence

### Detected

- Vercel hosts the Next.js application and receives request, network, security, session and application traffic.
- Prisma ORM is a code library, not a recipient. The active managed database is **Prisma Postgres through the existing Vercel integration**, evidenced by the approved pooled/direct hosts, the Vercel-billed Prisma workspace and isolated Preview/Production database resources recorded in the technical baseline.
- Google sign-in is identity-only. B4GAMBLE requests basic identity, strips OAuth token fields before account persistence and does not send Programme words to Google.
- Resend delivers Contact messages to the documented Google Workspace support mailbox. Contact content is not stored in an application Contact table.
- OpenAI receives optional typed input or audio/transcript only after active Programme authority. Requests are server-side; Responses use `store: false`; audio is handled in memory; application logs intentionally exclude narrative content.
- Better Auth is self-hosted application code, not a hosted processor. Vercel Analytics is removed. Stripe, a live affiliate network and a live operator recipient are not detected.

### Inferred

- Vercel, Prisma Postgres, Resend, Google Workspace and OpenAI perform processor functions for bounded customer-data services only to the extent their applicable agreements establish that role. Defined service/account data may have separate-controller treatment.
- Google Account authentication remains a working separate-controller assessment for the identity interaction; Google Cloud/CDPA applicability to the actual OAuth project is not inferred from the Workspace mailbox framework.
- International processing is possible. The applicable UK adequacy, UK Extension to an eligible DPF certification, UK Addendum/IDTA and any data-protection test must be determined against the exact recipient, agreement and transfer.

### Not detected

- Accepted agreements, acceptance timestamps, exact contracting entities/plans, live regions, applicable DPF coverage, signed IDTA/Addendum, completed data-protection test, provider retention/deletion settings or subprocessor-notice subscriptions.

## Active service register

| Service | Data and role assessment | Level A — public framework | Level B — account applicability / acceptance | Level C — account evidence |
|---|---|---|---|---|
| Vercel | Hosting/customer data processor; defined service-generated/account data may be separate-controller data | **VERIFIED.** Current DPA (updated 17 March 2026; effective 31 March 2026) contains processor instructions, Article 28-type subprocessor duties and UK transfer mechanisms. It states applicability to Pro and Enterprise plans. | **NOT YET CAPTURED — DEFERRED BY FOUNDER.** Exact B4GAMBLE plan, agreement, contracting entity and DPA applicability/acceptance are not evidenced. | **NOT VERIFIED.** Region, retention, subprocessor notice and transfer-route packet absent. |
| Prisma Postgres through the Vercel integration | Managed database for accounts, sessions, Programme authority/progress/confirmed structured output, editorial/affiliate administration and security state. Prisma ORM itself is only a library. | **NOT VERIFIED.** Current official Prisma Terms and Privacy pages were reviewed, but no current public Prisma Article 28 DPA for Prisma Postgres was located. Public privacy/compliance statements are not substituted for a DPA. | **NOT YET CAPTURED — DEFERRED BY FOUNDER.** Applicable Prisma/Vercel order, plan, terms and processor contract are absent. | **NOT VERIFIED.** Live region, DPA, subprocessors, backup/deletion periods and transfer mechanism absent. |
| Google identity | Google subject identifier, name, email and image for optional identity-only sign-in; transient OAuth tokens are stripped before account persistence | **PUBLIC TERMS REVIEWED.** OAuth and current Google Cloud terms are public, but the identity interaction's separate-controller/processor boundary is account- and use-specific. | **NOT YET CAPTURED — DEFERRED BY FOUNDER.** Exact project, entity, agreement and any CDPA applicability are absent. | **NOT VERIFIED.** Project/scopes/consent-screen/owner and transfer evidence packet absent. |
| Resend | Processor for Contact email delivery; account data may be separate-controller data | **VERIFIED.** Current public DPA covers processor instructions, subprocessors and international transfers, and states it becomes binding through acceptance of the agreement or execution. | **NOT YET CAPTURED — DEFERRED BY FOUNDER.** B4GAMBLE agreement acceptance/execution and exact account entity are absent. | **NOT VERIFIED.** Account retention/tracking settings, subprocessor notice and applicable UK transfer evidence absent. |
| Google Workspace support mailbox / Cloud Identity | Processor framework for message content and mailbox records if the qualifying business service and CDPA apply | **VERIFIED.** Google publishes a Cloud Data Processing Addendum with processor, subprocessor and EU/UK/Swiss transfer terms; Admin documentation explains incorporation or review/acceptance. | **NOT YET CAPTURED — DEFERRED BY FOUNDER.** Workspace edition, contracting entity and CDPA incorporation/acceptance are absent. | **NOT VERIFIED.** Admin retention/deletion, access review, routing and transfer packet absent. |
| OpenAI API | Processor framework for optional Programme customer content; defined account/service data may be separate-controller data | **VERIFIED.** Current DPA supplements/is incorporated into the Services Agreement and includes processor, subprocessor and UK transfer terms. Official API policy says API inputs/outputs are not used for training by default unless the organisation opts in. | **NOT YET CAPTURED — DEFERRED BY FOUNDER.** Applicable Services Agreement/DPA acceptance and exact organisation/project are absent. | **NOT VERIFIED — DEFERRED BY FOUNDER.** ZDR/MAM, region, sharing/training controls, retention and transfer evidence absent. `store: false` is not ZDR. |

## Application data-minimisation controls

| Control | Finding | Classification |
|---|---|---|
| OpenAI server boundary | Server-only credentials and provider calls; no browser-to-OpenAI route | VERIFIED |
| OpenAI Responses | `store: false`, `background: false`, bounded schemas/time/size, no tools or conversation state | VERIFIED; does not prove zero provider retention |
| OpenAI audio | One bounded in-memory transcription file; B4GAMBLE does not persist audio | VERIFIED |
| Application logs | Technical counts/durations/results only; no intentional typed words, transcript, audio or generated narrative logging | VERIFIED |
| Google identity | Identity only; Programme words not sent to Google; token fields stripped before account persistence | VERIFIED |
| Contact | Delivered through Resend to Workspace; no application Contact table or marketing permission | VERIFIED |

## Non-recipient and inactive register

| Component | Finding | Status |
|---|---|---|
| Better Auth | Self-hosted code using the application's Prisma database; not a hosted processor | COMPLETE |
| Vercel Analytics | Runtime package, root mount, SDK calls and enable flag removed | COMPLETE |
| Stripe/payment processor | No package, adapter, route or payment-data flow detected | NOT DETECTED |
| Affiliate network/operator | Fail-closed models/routing exist; no real partner authority or active GB outbound flow | COMMERCIAL PARTNER: NOT YET ACTIVE |
| Optional S3 media | Capability exists for staff-managed public media; no live provider/account evidenced | INACTIVE / ACCOUNT NOT EVIDENCED |
| YouTube/Vimeo embeds | Privacy-enhanced renderer capability exists; current published use is not established | INACTIVE / USE NOT DETECTED |

## Account follow-up evidence

For each active provider, retain the non-secret account/project identifier; contracting entity and plan; applicable terms/version/acceptance date; Article 28 terms; subprocessors and notice route; exact regions; retention/deletion/backups; security/breach and rights assistance; exact transfer mechanism; any required data-protection test; owner; review date; and offboarding/deletion procedure. This is internal post-launch follow-up, not a completion claim.

## Official sources reviewed

- [Vercel Data Processing Addendum](https://vercel.com/legal/dpa)
- [Prisma Terms of Service](https://www.prisma.io/terms)
- [Prisma Privacy Policy](https://www.prisma.io/privacy)
- [Prisma Postgres regions](https://www.prisma.io/docs/postgres/database/regions)
- [Google OAuth 2.0 policies](https://developers.google.com/identity/protocols/oauth2/policies)
- [Google Cloud Data Processing Addendum](https://cloud.google.com/terms/data-processing-addendum)
- [Google Workspace and Cloud Identity CDPA acceptance guidance](https://knowledge.workspace.google.com/admin/compliance/privacy-compliance-and-records-for-google-workspace-and-cloud-identity)
- [Resend Data Processing Addendum](https://resend.com/legal/dpa)
- [Resend subprocessors](https://resend.com/legal/subprocessors)
- [OpenAI Data Processing Addendum](https://openai.com/en-GB/policies/data-processing-addendum/)
- [OpenAI API data controls](https://developers.openai.com/api/docs/guides/your-data)
