# Ingestion Promotion Handoff — PR #112

Status: **PROPOSED**. No Production write path or data-import authority is created here.

Promote #112 only after Production 0025 and the #111 runtime are independently verified. Rebase/update it onto the exact corrected #111 head while preserving checksum-bound exact source paths, the explicit Betsson PE/SE bundle, default dry-run, realpath containment, loopback `_ci` write guard, idempotent deterministic IDs, nullable unknowns, contradictions, and zero commercial writes.

Before any real Production Betsson import, require a separate Founder decision and reviewed controls for: current backup/recovery evidence; read-only inventory and collision report; exact global Betsson/brand/operator identity match; immutable source hashes; planned and maximum row counts; actor/audit evidence; one logical transaction/recovery plan per unit; post-import factual and public smoke; and targeted rollback of only newly inserted/changed factual rows. Route setup IDs 9721 and 38112 remain report-only. No import may create or activate AffiliateProgram, AffiliateOffer, tracking, redirect, CommercialOpportunity, or `productionEligible` authority.

