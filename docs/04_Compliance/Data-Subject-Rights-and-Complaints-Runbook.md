# Data-Subject Rights and Privacy Complaints Runbook

- **Status:** Operational launch control
- **Owner:** Privacy lead; Founder Office remains accountable until a named owner is recorded
- **Applies to:** Great Britain service
- **Last reviewed:** 2026-08-09

## Evidence status

### Detected

- The public Privacy Policy directs requests and complaints to `privacy@7be.io` and identifies 7BE Inc. as controller.
- `scripts/privacy-data-subject.ts` supports exact account lookup, restricted JSON export and dry-run-first deletion over the active Prisma relations.
- The export includes bounded provider/account identifiers and granted scope but excludes passwords, session tokens, OAuth access/refresh/ID tokens and verification secrets.
- Account deletion cascades or explicitly removes password and Google-linked `Account` rows, sessions, Programme, XP and achievement data. Exact consumed Programme claims and their linked anonymous sessions are captured and deleted before the user row, including any legacy draft they contain.

### Inferred

- A single case register is necessary to prove receipt, identity checks, pauses, decisions, disclosures and completion.
- Staff-linked accounts require manual review because audit and employment/business records can involve obligations distinct from an ordinary customer account.

### Planned

- Name the permanent Privacy owner and backup.
- Add counsel-approved request templates and a secure requester-delivery channel.
- Exercise the process quarterly with synthetic users.

### Not detected

- No appointed UK representative is recorded.
- No completed ICO registration/fee assessment is recorded.
- No verified ticketing system, secure file-transfer provider or formal legal-hold register is detected.

## Intake and one-month workflow

1. Record the request or complaint on the day received. Assign a non-guessable case reference.
2. Record channel, request type, receipt time, identity used, requested scope, jurisdiction and the one-month response deadline. Do not copy unnecessary narrative into general logs.
3. Acknowledge receipt promptly. Explain any proportionate identity evidence needed. Do not request date of birth merely because the product uses an 18+ self-attestation.
4. Pause substantive disclosure until identity is sufficiently established. Record the verification decision, not copies of identity material unless strictly necessary.
5. Search by exact user ID or normalized exact email. Check authentication (including linked provider account metadata), Programme, XP/achievement and verification relations. Check separately managed support correspondence and provider records where applicable. Provider tokens remain excluded from the ordinary export and are removed from the active database with the account row.
6. Apply exemptions, legal holds, third-party rights and manifestly unfounded/excessive analysis only with Privacy or legal approval. Record the ground and affected records.
7. Complete the response without undue delay and ordinarily within one month of receipt. If a lawful extension is considered necessary for complexity or volume, notify the requester within the first month, explain why and record the revised deadline.
8. Deliver exports through an approved secure channel. Never attach an unrestricted export to a public ticket or ordinary shared channel.
9. For erasure, review the dry-run plan before execution. Communicate the backup caveat and any retained legal/audit records.
10. Record completion time, responder, decision, records disclosed/changed/deleted, delivery method and any follow-up. Retain the case record under the approved complaints schedule once established.

## Tool controls

Export:

```text
npm run privacy:data-subject -- export --environment <local|preview|production> --identifier <exact-email-or-user-id> --output <new-path.json>
```

Deletion plan (default; no mutation):

```text
npm run privacy:data-subject -- delete --environment <local|preview|production> --identifier <exact-email-or-user-id> --output <new-plan-path.json>
```

The deletion plan reports consumed claims, linked anonymous sessions and determinable legacy draft-bearing sessions. Before any execution, verify the intended database and declared environment out of band; `VERCEL_ENV` and database-URL parsing are not environment authority. Every environment requires `--execute` and `SEVENBET_PRIVACY_DELETE_CONFIRM=DELETE:<exact-user-id>`. A declared Production target additionally requires `SEVENBET_PRIVACY_PRODUCTION_DELETE_CONFIRM=DELETE:<exact-user-id>`. Production erasure must not be exercised as a routine smoke test.

Every output path must be new. The CLI uses exclusive creation and mode `0600`. Console output contains only operation status and output path, never exported content.

## Complaints

Privacy complaints follow the same register and deadline control. The response must:

- address the specific processing concern;
- state the investigation performed and outcome;
- identify any correction, containment or follow-up owner;
- explain the right to complain to the Information Commissioner's Office; and
- avoid implying that SevenBet's internal response limits that right.

Escalate immediately when a complaint alleges a personal-data breach, unlawful special-category processing, disclosure to a gambling operator, use of protected data for commercial targeting, processing of a child account, or failure to honour a previous rights request.

## Case-register minimum fields

| Field | Rule |
|---|---|
| Case reference | Non-guessable internal identifier |
| Received/deadline/completed | UTC timestamps plus working timezone |
| Requester/account | Minimum exact identifiers; no passwords or tokens |
| Request/complaint type | Access, rectification, erasure, restriction, objection, portability, consent, complaint or other |
| Identity decision | Method, reviewer, date and sufficiency; minimise evidence copies |
| Systems searched | Application database, support correspondence and applicable providers |
| Decision and basis | Full, partial, refused, no data or withdrawn; record approved ground |
| Actions | Export, correction, deletion, restriction, processor request, incident escalation |
| Delivery | Approved channel and confirmation only; no exported content in the register |
| Backup/legal-hold caveat | What remains, why, expiry/next review and restoration control |
| Owner/approver | Named operational owner and legal approver where required |

## UK representation and ICO status

The GB service is offered by a United States controller and the approved LEGAL-02 decision records a UK representative as required. **No UK representative is currently appointed or published.** The appointment and real contact details remain an external launch gate. Do not invent a representative name or address.

An ICO data-protection-fee/registration assessment remains open. Record the assessment, outcome, reference and review date before changing public claims.
