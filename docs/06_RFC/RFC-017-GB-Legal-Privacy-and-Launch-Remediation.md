# RFC-017: GB Legal, Privacy and Launch Remediation

- **Status:** Approved
- **Decision authority:** Founder Office LEGAL-IMPL-01 authorization
- **Approved:** 2026-08-09
- **Scope:** Great Britain launch truthfulness, privacy operations, age controls and Active Control Programme data minimisation
- **Depends on:** RFC-002, RFC-008, RFC-009, RFC-010, RFC-012, RFC-014, RFC-015

## 1. Decision

SevenBet will remediate the Great Britain launch so that public claims, demonstration inventory and personal-data processing match the service that is actually implemented. The service is positioned as education, private reflection, decision support, boundary planning and comparison. It is not positioned as treatment, therapy, clinical care, recovery or a guarantee that gambling is safe.

GB editorial access remains available. GB commercial and referral activity remains disabled and the affiliate engine remains off. Demonstration casino and offer records must be disclosed as fictional demonstration data, must not expose a commercial action, and must not emit offer-list structured data or indexable search metadata.

Sensitive Active Control Programme narrative is local-first. The server may persist account, enrolment, task and mission completion, XP, streak, neutral structured continuity and the minimum non-narrative goal or boundary facts necessary to provide the Programme. Raw reflections, descriptions of gambling situations, trigger text, coping text, personal success descriptions, urge-signal text and other free-text control content remain in memory or `sessionStorage`. They are not written to application storage, cookies, URLs, analytics or logs.

Persistent accounts, Programme saving and commercial gambling surfaces require an explicit 18-or-over self-attestation. Help and harm-prevention information remains available without that gate. This release does not collect date of birth or perform KYC. Durable age-evidence persistence remains a P1 open item because no approved schema change is authorised.

## 2. Evidence classification

### Detected

- The repository contains server-side account, session, Programme enrolment, progress, reward, streak and Programme artefact models.
- Mission 1 through Mission 4 currently send raw narrative fields to route handlers and persist them in JSON or text columns.
- A legacy Programme reflection endpoint accepts and stores arbitrary user reflection content.
- Self-Check and the Personal Limit Tracker are implemented as browser-local tools.
- The temporary production dataset has exact repository-controlled identifiers under RFC-012.
- Public bonus records sourced from that dataset are currently described as published or current offers and can emit `ItemList` structured data.
- GB commercial and referral policy is disabled, the affiliate kill switch is off, and no real GB partner authority is present.
- The repository contains no dedicated behavioural advertising, user-level analytics or consent-management SDK.
- Account creation currently has terms acceptance but no explicit age attestation.

### Inferred

- Existing Programme relations can preserve progression and reward integrity without a migration by storing privacy-safe continuity markers in required legacy text fields while raw user content remains browser-local.
- Exact RFC-012 fixture identifiers are a sufficient authoritative marker for demonstration records; names, slugs, presentation copy and browser-side detection are not authoritative.
- Existing cascading relations permit a controlled internal erasure workflow, but explicit relation ordering and a dry-run plan are safer and more auditable than relying on implicit behaviour.

### Planned

- A separately approved schema change may add durable age-attestation evidence and purpose-specific structured Programme columns.
- Legacy raw Programme content will be handled through a separately approved retention and cleanup decision after users retain access, export and erasure rights.
- A UK representative appointment and ICO registration/fee assessment remain operational launch actions; this RFC does not fabricate either conclusion.

### Not detected

- No approved real GB casino promotion, commercial partner, referral authority or Production affiliate activation exists.
- No lawful basis has been approved for server persistence of free-text Programme vulnerability or health-related narrative.
- No Production database mutation, destructive migration or dependency upgrade is required or authorised by this decision.

## 3. Programme data contract

### 3.1 Server allow-list

The active Programme server may accept and persist only:

- opaque authenticated or short-lived anonymous identifiers;
- enrolment, mission, task and completion identifiers and timestamps;
- XP, achievement, streak and active-day records;
- bounded task-state and evidence-selection enums;
- neutral continuity markers required by existing relations;
- goal direction, review date, confidence and status;
- a neutral local-signal completion choice, not signal narrative or vulnerability category;
- boundary category, numeric limit, unit, period, bounded execution method, review date and status; and
- bounded operational reason codes without user-entered content.

Route validators use exact key allow-lists and reject unexpected fields without logging request bodies or rejected values. Generic progress-event metadata may contain only bounded implementation-owned keys and values; it may not contain free text.

### 3.2 Server deny-list

The server must not newly accept, persist or log:

- Moment Map free text, personal situation, choice, outcome or reflection;
- goal action, trigger, alternative, success-description or confidence-adjustment narrative;
- early-signal, urge, bodily sensation or vulnerability narrative or category;
- boundary trigger, rule, execution-detail or coping-action narrative;
- diagnosis, treatment, therapy or medical-history content;
- Self-Check answers or result state;
- Personal Limit Tracker amounts;
- Help visits or support-path activity as commercial or Programme profiling data; or
- arbitrary client-supplied metadata.

The legacy reflection create operation is retired and must fail before parsing a request body. Existing legacy records remain available to authenticated export and deletion operations until a separate cleanup decision is approved.

### 3.3 Local lifecycle

Raw Programme content lives in React state and may be mirrored to versioned, subject-isolated `sessionStorage` solely for same-tab continuity. Anonymous work uses a random opaque journey namespace; authenticated work uses the actual Better Auth user ID, never email or a health/vulnerability value. Only the exact current Mission 01 journey may migrate after successful claim redemption, after which its source is removed. Ordinary sign-in does not migrate anonymous content. On subject change, prior narrative is hidden and cleared from memory before only the exact next namespace or an empty record is loaded. It must never use `localStorage`. It is cleared when the user explicitly clears the active local Programme, completes the relevant local lifecycle where the interface promises clearance, signs out/session-expires into a fresh anonymous journey, or the tab session ends. The interface states plainly which facts are saved to the account and which remain only in the browser session.

Existing required database strings use implementation-owned sentinel values which unambiguously mean that the narrative is local. These values are never presented as user-authored content, never exposed to commercial consumers and never interpreted as evidence of vulnerability. Existing historic raw rows are not returned as active browser narrative by default.

## 4. Structural commercial firewall

Programme, Self-Check, limit, Help, vulnerability and local-session modules must not be imported by casino ranking, bonus ranking, affiliate candidate, affiliate redirect, GB commercial-readiness or marketing-personalisation modules. Commercial DTOs may not contain Programme or protected-control fields. Automated structural tests enforce both import and data-contract boundaries.

No protected activity may change casino or bonus eligibility, rank, presentation, sponsored placement or affiliate destination. The commercial boundary is enforced server-side and is independent of client state.

## 5. Demonstration inventory authority

RFC-012 identifiers are moved to or shared through a small server-owned authority module. The public discovery service classifies records by exact immutable ID from that authority. Classification by name, slug, visual label, browser state or heuristics is prohibited.

Each offer DTO carries an explicit server-derived classification. A result set is classified as demonstration-only, mixed or published-only. A demonstration record:

- is labelled `DEMONSTRATION DATA` near the record;
- is described as fictional, not a current GB promotion and not a partner offer;
- never exposes a visit, claim or affiliate action;
- cannot produce `/r` or another commercial destination; and
- causes the affected page to be `noindex, follow` and suppresses offer/product/list structured data.

Mixed result sets apply the same page-level metadata and schema restrictions, while any future non-demonstration record still must pass all existing GB and commercial server authorities before it can expose an action.

## 6. Claims and disclosures

Public copy must distinguish editorial assessment from commercial relationships. “Independent” may be used only with an adjacent, narrow explanation: affiliate compensation does not determine Editor Score or natural editorial ranking. Any future sponsored placement must be separately labelled and must not be presented as an editorial conclusion.

Casino, bonus, About, methodology, Programme and control-tool copy must remain factual and non-clinical. No content may claim that SevenBet makes gambling safe, establishes affordability, diagnoses a condition, provides treatment or guarantees recovery.

## 7. Age control

The normal account-creation path requires an unchecked “I confirm I am 18 or over” control. The server independently requires the corresponding bounded confirmation on signup and on authenticated Programme mutation routes where appropriate; client state alone cannot grant access. The local confirmation is scoped to the current journey or exact authenticated user, and an authenticated-user switch does not inherit the former user's confirmation. No marketing checkbox is bundled into Programme registration.

Commercial casino and bonus surfaces display the existing adult-use boundary. Protected Help remains open. The release documentation must state: `AGE ATTESTATION PERSISTENCE — P1 OPEN`.

## 8. Privacy rights and operations

The Privacy Policy will describe the actual local-first Programme boundary, the one-month rights-response workflow, complaint escalation and the current UK-representative gap without implying an appointment.

Internal data-subject tools must provide:

- deterministic account lookup;
- a structured JSON export of actual related records;
- an explicit deletion plan with relation counts, including consumed claims, linked anonymous sessions and determinable legacy draft-bearing sessions;
- dry-run as the default;
- output files created with mode `0600`;
- no user content in console or application logs;
- exact user-specific execution confirmation in every environment in addition to the execute flag; and
- an explicit environment target, with a second exact user-specific confirmation for Production.

Deletion captures consumed claim IDs and linked anonymous-session IDs before deleting the User, removes those exact claims/sessions and any legacy draft they contain, and leaves unconsumed journeys, other users and global Programme definitions untouched. It removes other active application rows in a documented order and reports completion without printing their contents. Operators verify the intended database out of band; neither `VERCEL_ENV` nor database-URL parsing is treated as database identity authority. Backup expiry and restore caveats are communicated rather than overstated.

## 9. Retention, processors and incident readiness

The retention schedule distinguishes implemented retention, target retention and unknown/unverified retention. Unknown periods remain open actions. Processor and international-transfer records contain evidence references only; missing contracts, locations or transfer assessments are marked open. The documentation does not invent a UK representative, ICO registration result, processor term or transfer mechanism.

A personal-data-breach runbook defines detection, containment, evidence preservation, risk assessment, the UK GDPR 72-hour supervisory-authority decision window where applicable, user notification assessment, ownership and the incident register. A DPIA draft records actual high-risk factors and open mitigations; it is not represented as final legal sign-off.

## 10. Rollout, rollback and compatibility

No database schema change, destructive migration, Production data mutation or dependency upgrade is part of this implementation. Server write paths change first to reject raw input; the client then adopts the bounded contract. Existing progression, completion and reward relations remain intact through neutral continuity markers. Historic raw records remain under export and erasure controls but are not used to repopulate active narrative inputs.

Rollback is a normal code rollback, except that restoring raw narrative writes is prohibited: if a rollback would re-enable them, the affected write route must remain disabled. GB commercial and referral policy and the affiliate kill switch remain independent containment controls.

## 11. Verification obligations

Completion requires automated coverage for:

- demonstration disclosure, metadata, schema suppression and absence of action;
- future published-only and mixed inventory behaviour;
- rejection of unexpected or sensitive Programme fields;
- successful neutral progress, completion, reward and streak persistence;
- browser network and storage inspection showing no raw Programme, Self-Check or limit content leaves the allowed local boundary;
- commercial import and DTO firewall invariants;
- age gate default, client flow and server enforcement;
- privacy complaint and UK-representative disclosure;
- export and deletion dry-run and exact-confirmation execute eligibility for isolated test users, including consumed anonymous-session erasure;
- same-tab User A/User B local-content and age-attestation isolation, plus exact current-claim migration and source removal;
- absence of tracking and behavioural analytics SDKs; and
- GB market, affiliate, Programme, build, no-JavaScript, accessibility and responsive regressions.

Preview and Production smoke checks must confirm the deployed SHA and protect Help availability. Production verification is read-only; this implementation does not execute a Production erasure, migration or affiliate action.
