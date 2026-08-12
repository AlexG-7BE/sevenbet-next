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
- [RFC-023 — OpenAI Preview Voice and Personalisation Activation](RFC-023-OpenAI-Preview-Voice-and-Personalisation-Activation.md) selects the two narrow OpenAI adapters, exact models, dual real-provider gate and Preview-only data/operations boundary for `PROGRAM-AI-ACTIVATE-01`. Production remains off.
- [RFC-025 — PROGRAM-AI Missions 02–10 MVP](RFC-025-PROGRAM-AI-Missions-02-10-MVP.md) authorises the bounded feature-on Missions 02–10 contracts, exact `15 + 20 + 15 + 25` reward policy, three completion-derived Personal Reviews, closed JSON persistence, Mission guidance operations, Programme Home/resume and private-data-separated public discovery navigation for `PROGRAM-AI-IMPL-01B`. Production remains off.

## Current database recovery decision

- [RFC-024 — Database Recovery and Isolated Restore](RFC-024-Database-Recovery-and-Isolated-Restore.md) approves the fail-closed Preview-to-isolated-target recovery architecture, Production read-only boundary, logical restore drill, internal RPO/RTO targets and managed-backup release ceiling for `RECOVERY-01`.

## Current analytics and runtime-hardening decision

- [RFC-026 — MVP Analytics and Programme Runtime Hardening](RFC-026-MVP-Analytics-and-Programme-Runtime-Hardening.md) authorises the closed privacy-safe Vercel event contract, aggregate-only report, one PostgreSQL fixed-window rate-limit model, bounded transient expiry purge, authenticated daily Cron and database-binding readiness evidence for `MVP-RUNTIME-01`. Preview migration and Production activation remain gated by the approved rollout sequence and Founder review.

## Current public Contact and transactional-mail decision

- [RFC-027 — Public Contact and Transactional Mail Boundary](RFC-027-Public-Contact-and-Transactional-Mail-Boundary.md) authorises the bounded public Contact route, strict no-database submission contract, isolated Resend HTTPS adapter, existing Google Workspace support mailbox authority, Vercel WAF abuse policy and fail-closed mail/DNS activation boundary for `LAUNCH-POLISH-01`. Account, Programme and commercial communications remain disabled.
