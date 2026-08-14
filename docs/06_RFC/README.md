# RFC

## Purpose

Provides the formal record for significant proposed changes and their decisions.

## What documents belong here

- Requests for Comments.
- RFC proposals, reviews, and final outcomes.
- Supporting analysis for major product, architecture, compliance, or engineering decisions.

## When this folder should be updated

Create or update an RFC before and during any substantial decision that changes the approved direction, architecture, domain model, compliance posture, or engineering standards.

## Current Programme access decision

- [RFC-021 — Programme Access Continuation and Authenticated Home](RFC-021-Programme-Access-Continuation-and-Authenticated-Home.md) approves the bounded same-tab access authority, account-creation acknowledgement enforcement, and session-derived Programme home correction for GOOGLE-OAUTH-ACTIVATE-01.

## Current PROGRAM-AI implementation decision

- [RFC-022 — PROGRAM-AI M1 Foundation and Preview Vertical Slice](RFC-022-PROGRAM-AI-M1-Foundation-and-Preview-Vertical-Slice.md) authorises the bounded feature-off-by-default M1 foundation, exactly two narrow persistence concepts, provider-neutral ports, legacy compatibility and Preview vertical slice for `PROGRAM-AI-IMPL-01A`.
- [RFC-023 — OpenAI Preview Voice and Personalisation Activation](RFC-023-OpenAI-Preview-Voice-and-Personalisation-Activation.md) selects the two narrow OpenAI adapters, exact models, dual real-provider gate and Preview-only data/operations boundary for `PROGRAM-AI-ACTIVATE-01`. It provides no Production activation authority; the live Production contradiction is tracked in Project State.
- [RFC-025 — PROGRAM-AI Missions 02–10 MVP](RFC-025-PROGRAM-AI-Missions-02-10-MVP.md) authorises the bounded feature-on Missions 02–10 contracts, exact `15 + 20 + 15 + 25` reward policy, three completion-derived Personal Reviews, closed JSON persistence, Mission guidance operations, Programme Home/resume and private-data-separated public discovery navigation for `PROGRAM-AI-IMPL-01B`. It provides no Production activation authority; the live Production contradiction is tracked in Project State.
- [RFC-031 — Vercel-Compatible Programme Voice Upload Limit](RFC-031-Vercel-Compatible-Programme-Voice-Upload-Limit.md) is **proposed only**. It would reduce RFC-023's raw audio limit from 8 MiB to 4 MiB while retaining the 90-second ceiling, add complete-request streaming enforcement and client preflight, and preserve the no-storage/type-instead boundary. It provides no implementation or deployment authority until approved.

## Current database recovery decision

- [RFC-024 — Database Recovery and Isolated Restore](RFC-024-Database-Recovery-and-Isolated-Restore.md) approves the fail-closed Preview-to-isolated-target recovery architecture, Production read-only boundary, logical restore drill, internal RPO/RTO targets and managed-backup release ceiling for `RECOVERY-01`.

## Current analytics and runtime-hardening decision

- [RFC-026 — MVP Analytics and Programme Runtime Hardening](RFC-026-MVP-Analytics-and-Programme-Runtime-Hardening.md) authorises the closed privacy-safe Vercel event contract, aggregate-only report, one PostgreSQL fixed-window rate-limit model, bounded transient expiry purge, authenticated daily Cron and database-binding readiness evidence for `MVP-RUNTIME-01`. Preview migration and Production activation remain gated by the approved rollout sequence and Founder review.

## Current internal operational-agent decision

- [RFC-027 — B4GAMBLE Operational Agent Foundation](RFC-027-B4GAMBLE-Operational-Agent-Foundation.md) authorises the isolated internal `agents/` package, shared policy/result contracts, eight Wave 1 read-analyse-draft specialists, explicit cost-aware routing and no-key structural evaluation for `AGENT-CORE-01`. It authorises no consumer runtime, database, Production, commercial, external-write or scheduled capability.

## Current public Contact and transactional-mail decision

- [RFC-028 — Public Contact and Transactional Mail Boundary](RFC-028-Public-Contact-and-Transactional-Mail-Boundary.md) authorises the bounded public Contact route, strict no-database submission contract, isolated Resend HTTPS adapter, existing Google Workspace support mailbox authority, Vercel WAF abuse policy and fail-closed mail/DNS activation boundary for `LAUNCH-POLISH-01`. Account, Programme and commercial communications remain disabled.

## Current runtime and canonical-host decisions

- [RFC-029 — Runtime Product Polish](RFC-029-Runtime-Product-Polish.md) governs the bounded microphone recovery, explicit same-email Google linking, standalone login and no-action Best Offers demonstration fallback merged by PR #71.
- [RFC-030 — Production Canonical Host Enforcement](RFC-030-Production-Canonical-Host-Enforcement.md) governs the current audit branch's bounded canonical-origin source change. Its RFC explicitly does not authorise merge or Production deployment.
- [RFC-032 — Exact Demo Detail Continuity](RFC-032-Exact-Demo-Detail-Continuity.md) governs the current audit branch's exact-manifest, noindex, review-only detail fallback for otherwise broken Best Offers demonstration links. It does not broaden directory, API, sitemap, CMS or commercial authority and does not authorise merge or Production deployment.

## Current public information-architecture and trust-hardening decision

- [RFC-033 — Public Responsible Gambling IA and Trust Hardening](RFC-033-Public-Responsible-Gambling-IA-and-Trust-Hardening.md) authorises the bounded public Responsible Gambling hub, canonical `/help` separation, related navigation/SEO discovery, one durable public Learn manifest, nonce-based CSP and first-party replacement of four Pexels hotlinks for `PUBLIC-IA-AND-HARDENING-01`. It authorises only one Draft-PR Preview and no merge, Production deployment or platform/data/provider mutation.
