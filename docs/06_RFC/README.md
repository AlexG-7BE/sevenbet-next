# B4GAMBLE RFC Registry

This registry is the current lifecycle index for repository RFC artifacts.
Read [Decision & Documentation Governance](../GOVERNANCE.md) and
[Current State](../CURRENT_STATE.md) first, then read only the `ACTIVE` RFCs
relevant to the work.

RFCs preserve durable architecture, policy and major-decision reasoning. They
are not routine PR, merge, Preview, deployment or activation permissions. A
newer explicit Founder decision overrides conflicting older internal language
for the scope it covers. Historical `no merge`, `Preview only`, `no Production`
and similar statements remain accurate descriptions of their original scope,
not permanent vetoes.

## Lifecycle model

- `ACTIVE` — current durable authority or architecture.
- `HISTORICAL` — past decision or delivery history; not a current execution
  constraint.
- `SUPERSEDED` — explicitly replaced by a newer decision or RFC.
- `PROPOSED` — not approved and not current authority.

Partial replacements are stated in the notes. An RFC remains `ACTIVE` when a
material part of its durable contract is still current.

## Registry

| RFC artifact | Lifecycle | Current relevance or replacement |
| --- | --- | --- |
| [RFC-001 Architecture Review](RFC-001-Architecture-Review.md) | `HISTORICAL` | Completed review of the RFC-001 proposal; retained as supporting analysis. |
| [RFC-001 — Jurisdiction and Market Resolution](RFC-001-Jurisdiction-and-Market-Resolution.md) | `PROPOSED` | Never approved as the full persistent model. RFC-014 implements only the bounded GB policy slice. |
| [RFC-002 — Active Control Program and Dashboard](RFC-002-Active-Control-Program-and-Dashboard.md) | `ACTIVE` | Programme purpose, agency, progression and commercial-separation invariants remain current. RFC-017 replaces raw-narrative persistence; RFC-025 replaces feature-on Mission 02–04 contracts. |
| [RFC-003 — Program-Led Commercial Growth](RFC-003-Program-Led-Commercial-Growth.md) | `ACTIVE` | Durable Programme-first positioning and Programme/commercial separation remain current. |
| [RFC-004 — Flagship Product Delivery Plan](RFC-004-Commercial-Launch-Delivery-Plan.md) | `HISTORICAL` | One-time flagship delivery plan is complete; current readiness is in `docs/CURRENT_STATE.md`. |
| [RFC-005 — Prismatic Product Theatre](RFC-005-Prismatic-Product-Theatre-Design-Direction.md) | `SUPERSEDED` | Explicitly replaced by RFC-006. |
| [RFC-006 — Human Guidance](RFC-006-Human-Guidance-Trust-Led-Design-Direction.md) | `SUPERSEDED` | Explicitly replaced by RFC-007. |
| [RFC-007 — Tilt-Locked Human Product Theatre](RFC-007-Tilt-Locked-Human-Product-Theatre.md) | `HISTORICAL` | Earlier visual-direction record; the merged final presentation and Product Freeze are now recorded by RFC-034 and Current State. |
| [RFC-008 — Programme Persistence, Rewards and Privacy](RFC-008-Programme-Persistence-Rewards-and-Privacy.md) | `ACTIVE` | Identity, transaction, progress, reward, active-day and idempotency boundaries remain current. RFC-017 replaces raw persistence; RFC-025 replaces feature-on Mission 02–04 contracts. |
| [RFC-009 — Mission 03](RFC-009-Mission-03-Urge-Literacy-and-Early-Signal.md) | `HISTORICAL` | Records the legacy Mission 03 delivery. RFC-025 owns the feature-on Mission 03 contract. |
| [RFC-010 — Mission 04](RFC-010-Mission-04-Build-One-Boundary.md) | `HISTORICAL` | Records the legacy Mission 04 delivery. RFC-025 owns the feature-on Mission 04 contract. |
| [RFC-012 — Temporary Synthetic Casino Dataset](RFC-012-Temporary-Production-Synthetic-Casino-Dataset.md) | `ACTIVE` | Exact fictional-data and non-commercial public-projection boundary remains in use until replacement or removal. |
| [RFC-013 — Production Engineering and Release Governance](RFC-013-Production-Engineering-and-Release-Governance.md) | `ACTIVE` | Durable CI, release, migration and rollback architecture remains current, subject to current Founder authority under `docs/GOVERNANCE.md`. |
| [RFC-014 — Great Britain Market Eligibility](RFC-014-Great-Britain-Market-Eligibility-and-Evidence-Authority.md) | `ACTIVE` | Current GB jurisdiction and fail-closed market authority. |
| [RFC-015 — GB Commercial Partner Authority](RFC-015-GB-Commercial-Partner-Authority.md) | `ACTIVE` | Current commercial activation and partner-evidence architecture; activation remains off. |
| [RFC-016 — Production Performance and Instant Discovery](RFC-016-Production-Performance-and-Instant-Discovery.md) | `HISTORICAL` | Completed UX-PERF-01 delivery record; current public experience is covered by later presentation/current-state records. |
| [RFC-017 — GB Legal, Privacy and Launch Remediation](RFC-017-GB-Legal-Privacy-and-Launch-Remediation.md) | `ACTIVE` | Programme data minimisation, demo truthfulness, privacy operations and commercial firewall remain current. RFC-036 replaces only its final P0 assessment documents. |
| [RFC-018 — Google Authentication and Email Foundation](RFC-018-Google-Authentication-and-Email-Communications-Foundation.md) | `ACTIVE` | Google identity and disabled account/Programme communications foundation remain current. RFC-020, RFC-021 and RFC-028 replace only named sub-scopes. |
| [RFC-019 — B4GAMBLE Brand and Canonical Cutover](RFC-019-B4GAMBLE-Brand-and-Canonical-Cutover.md) | `ACTIVE` | Current consumer brand and canonical Production origin. RFC-030 replaces only generated-host enforcement. |
| [RFC-020 — Google Identity-Only Hardening](RFC-020-Google-Identity-Only-Authentication-Hardening.md) | `ACTIVE` | Current credential-minimisation and auth-capability boundary. RFC-029 adds only the explicit authenticated link flow. |
| [RFC-021 — Programme Access Continuation and Authenticated Home](RFC-021-Programme-Access-Continuation-and-Authenticated-Home.md) | `ACTIVE` | Current access-proof, same-tab continuation and authenticated-home architecture. |
| [RFC-022 — PROGRAM-AI M1 Foundation](RFC-022-PROGRAM-AI-M1-Foundation-and-Preview-Vertical-Slice.md) | `ACTIVE` | Current M1 authority, claim, deterministic reward and provider-port foundation. RFC-035 changes only consent-control placement. |
| [RFC-023 — OpenAI Voice and Personalisation](RFC-023-OpenAI-Preview-Voice-and-Personalisation-Activation.md) | `ACTIVE` | Current bounded provider, privacy and fail-closed architecture. The 2026-08-14 Founder decision separately approved the observed Production activation; RFC-031 replaces only upload limits. |
| [RFC-024 — Database Recovery and Isolated Restore](RFC-024-Database-Recovery-and-Isolated-Restore.md) | `ACTIVE` | Current restore-to-new-target, identity-guard and Production read-only drill architecture. |
| [RFC-025 — PROGRAM-AI Missions 02–10](RFC-025-PROGRAM-AI-Missions-02-10-MVP.md) | `ACTIVE` | Current feature-on Mission, reward, Review and Programme Home contracts. RFC-034 replaces only conflicting public presentation. |
| [RFC-026 — Analytics and Programme Runtime Hardening](RFC-026-MVP-Analytics-and-Programme-Runtime-Hardening.md) | `ACTIVE` | Shared limiter, purge, Cron and database-readiness architecture remains current. RFC-036 supersedes public analytics collection and activation. |
| [RFC-027 — Operational Agent Foundation](RFC-027-B4GAMBLE-Operational-Agent-Foundation.md) | `ACTIVE` | Current isolated internal-agent architecture and authority boundary. |
| [RFC-028 — Public Contact and Transactional Mail](RFC-028-Public-Contact-and-Transactional-Mail-Boundary.md) | `ACTIVE` | Current public Contact purpose, no-database data boundary and isolated delivery architecture. |
| [RFC-029 — Runtime Product Polish](RFC-029-Runtime-Product-Polish.md) | `ACTIVE` | Current microphone recovery, explicit same-email Google linking, login and demo fallback contracts. RFC-032 replaces only exact demo-detail continuity. |
| [RFC-030 — Production Canonical Host Enforcement](RFC-030-Production-Canonical-Host-Enforcement.md) | `ACTIVE` | Current constant-origin Production and stable-origin Preview canonicalisation architecture. |
| [RFC-031 — Programme Voice Upload Limit](RFC-031-Vercel-Compatible-Programme-Voice-Upload-Limit.md) | `ACTIVE` | Current 4 MiB audio and bounded multipart request contract detected on main. |
| [RFC-032 — Exact Demo Detail Continuity](RFC-032-Exact-Demo-Detail-Continuity.md) | `ACTIVE` | Current exact-manifest, noindex, non-commercial demo-detail boundary. |
| [RFC-033 — Responsible Gambling IA and Trust Hardening](RFC-033-Public-Responsible-Gambling-IA-and-Trust-Hardening.md) | `ACTIVE` | Current Responsible Gambling/Help separation, public content authority, CSP and first-party media boundary. |
| [RFC-034 — Final Design Handoff Public Site](RFC-034-Final-Design-Handoff-Public-Site.md) | `ACTIVE` | Current merged public presentation, route and unified-shell authority, subject to the Product Freeze in Current State. |
| [RFC-035 — Home Performance and Motion Polish](RFC-035-Home-Performance-and-Motion-Polish.md) | `HISTORICAL` | Completed PR #77 delivery and Product Freeze candidate record; verified present posture is now owned by Current State. |
| [RFC-036 — GB Public Legal P0 Closure](RFC-036-GB-Public-Legal-P0-Closure.md) | `ACTIVE` | Current GB public legal, necessary-technology and explicit licence-evidence boundary, with named Founder-accepted administrative deferrals. |

## Counts

| Lifecycle | Count |
| --- | ---: |
| `ACTIVE` | 26 |
| `HISTORICAL` | 7 |
| `SUPERSEDED` | 2 |
| `PROPOSED` | 1 |
| **Total RFC artifacts** | **36** |

There is no RFC-011 file in this repository. RFC-012 mentions a deferred
RFC-011 fixture-adapter proposal, but no absent document is classified or
invented here.
