# Known Technical Debt

| Category | Evidence | Affected area / impact | Severity | Blocks architecture work? |
| --- | --- | --- | --- | --- |
| Documentation drift | The prior baseline claimed no runtime app; the audited repository contains a full Next/Prisma implementation. `README.md` also retains “Next Build Steps” that conflict with later repository evidence. | Technical orientation and change decisions could use stale assumptions. | High | Yes—this corrected baseline removes the immediate error, but authoritative documentation alignment remains needed. |
| Linting gap | `package.json` has `next lint`; no ESLint config/dependency is detected, and Next 15 does not provide that legacy command. | Quality gate is unreliable. | Medium | No. |
| CI/CD gap | No `.github/workflows`, other CI configuration, deployment descriptor, or production migration workflow detected. | Tests/build are not repository-evidenced as automated before release. | High | Yes—target operational architecture must decide this. |
| Legacy admin-preview path | `middleware.ts` and `lib/auth/admin.ts` retain token-based legacy access when `CMS_PHASE1_ALLOW_DEV_ADMIN=true`. | Dual authentication paths increase policy/configuration complexity. | Medium | No, but must be explicitly governed. |
| Compliance/jurisdiction gap | Casino country/license fields and public discovery exist, but no comprehensive jurisdiction-policy engine or compliance control system is evidenced. | Product Vision’s Regulated First rule is not technically demonstrated across all commercial routing/discovery. | Critical | Yes. |
| Operational visibility gap | No analytics, monitoring, error-tracking, queue, scheduler, or webhook receiver evidence. | Production incidents, data freshness and integration reliability lack demonstrated controls. | High | Yes. |
| Persistence/deployment state unknown | Migrations exist, but deployed database application state is not in repository evidence. | Cannot establish database readiness/consistency for an environment. | Medium | Yes for deployment architecture. |
| CMS coverage ambiguity | Article/legacy CMS models are schema-present but no article admin route was detected. | Scope boundaries and unused/transitioning entities require architecture decisions. | Medium | No. |

This inventory records observed compromises and gaps; it does not prescribe fixes.
