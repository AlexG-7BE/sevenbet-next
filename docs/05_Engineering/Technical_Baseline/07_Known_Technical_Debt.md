# Known Technical Debt

Repository evidence was rescanned at main baseline `30fc96e198f2a509ac3cae707f66bf9b6b9a5201` on 2026-08-07. This inventory records remaining engineering debt; product roadmap and release approvals are tracked separately.

## Remaining

| Category | Evidence | Impact | Severity |
| --- | --- | --- | --- |
| Linting/tooling | `package.json` invokes `next lint`; no ESLint configuration/dependency is detected and Next 15 does not provide the legacy command. | Lint is not a usable automated gate. | Medium |
| CI/CD and deployment governance | No repository CI workflow, production migration workflow, backup/restore runbook or rollback evidence is detected. | Pre-release enforcement and recovery are unproven. | High |
| Legacy admin-preview path | `middleware.ts` and `lib/auth/admin.ts` retain the token path when `CMS_PHASE1_ALLOW_DEV_ADMIN=true`. | Dual access paths increase policy/configuration complexity. | Medium |
| Jurisdiction/compliance authority | The resolver is shadow/deny-safe; `unavailableJurisdictionPolicyStore` has no approved live policy dataset and public enforcement is not detected. | Regulated-first commercial eligibility is not demonstrated end-to-end. | Critical |
| Operational visibility | Hosting diagnostics use `console.warn`; managed monitoring, alert ownership, scheduler/queue and incident/on-call controls are not detected. | Data freshness and production failures may not be acted on reliably. | High |
| Programme expiry and rate limiting | Anonymous expiry is defined and limiting is in-process; no automated purge or shared/distributed limiter is detected. | Multi-instance abuse control and expired-data cleanup remain incomplete. | High |
| Account privacy/recovery lifecycle | Artefact-level edit/content erasure exists; account-wide export, account-wide erasure automation and complete password recovery are not detected. | Full user account lifecycle is incomplete. | High |
| Programme autosave ordering | Draft APIs have no revision/client sequence; scalar/private fields remain last-write-wins. | A delayed request can overwrite a newer draft field. | Medium |
| Connected concurrency evidence | Memory-unit tests cover replay/rollback and schema uniqueness is detected; no multi-process connected-database contention test is detected. | Cross-process production guarantees are not load-tested. | Medium |
| CMS coverage ambiguity | Article/legacy CMS models exist, but no article admin/editor route is detected. | Ownership of legacy/unused content entities remains unclear. | Medium |
| Frontend consolidation | Page migration is complete, but token/component duplication, CSS ownership, state variants, cross-route accessibility and visual baseline governance remain unnormalized. | Drift can recur without FE-DS-01 consolidation. | Medium |
| Visual regression tooling | Focused Playwright and `visual:qa` checks exist; no maintained cross-route approved screenshot baseline is detected. | Figma/code drift can escape package-level checks. | Medium |
| Local casino environment/data drift | FE-GAP-02 evidence observed locally linked demo profiles returning 404 while corresponding production profiles resolved; source failure was not demonstrated. | Local validation can disagree with production data state. | Low |

## Newly confirmed

| Category | Current evidence | Impact | Severity |
| --- | --- | --- | --- |
| Programme date fixtures | `npm run programme:test` on 2026-08-07 passed 36/43; seven Mission 04 tests fail because fixed `reviewAt` values are outside the rolling next-30-days validator. | Programme regression baseline is time-unstable. | High |

## Resolved and removed from active debt

- Broad page-level Frontend/Figma migration blocker: FE-MIG-01–16 and FE-GAP-01/02 are merged.
- Competing public/protected shell defect: dedicated Public and Protected Help layouts are detected.
- Unsafe Self-Check and budget-tool mechanics: replaced by the local non-score Self-Check and user-defined Personal Gambling Limit Tracker.
- Legal placeholders: Privacy and Terms are substantive launch-candidate pages; external approval remains a release gate, not a page placeholder defect.
- Known page-level missing-H1/nested-main defects addressed by FE-GAP-02.
- FE-HANDOFF-01: confirmation-first managed handoff and neutral fail-closed recovery are implemented.

Resolved page migration does not mean FE-DS-01 is complete; consolidation debt remains until that work is delivered.
