# Known Technical Debt

Repository evidence was rescanned from root `/Users/alex/Documents/Codex/2026-07-09/ns/sevenbet-next` for COMM-01 at base `5fbb73b674a52327a01c31f59c3474a3b8a6b3fb` on 2026-08-08. All 782 tracked files and 760 active non-generated paths were inventoried before COMM-01 changes; dependencies, generated output, build artefacts, caches and `tsconfig.tsbuildinfo` were excluded from source claims. This inventory records remaining engineering debt; product roadmap and release approvals are tracked separately.

## Remaining

| Category | Evidence | Impact | Severity |
| --- | --- | --- | --- |
| Provider recovery capability | **Detected:** Starter, seven-day retention metadata, completed Production/Preview snapshots and a validated provider-native Preview restore with exact deterministic canary parity and exact target/canary cleanup. Production remained read-only. | Preserve the evidence and continue routine snapshot monitoring; Production restore remains separately authorised. | Closed for RECOVERY-01 |
| Production migration architecture | Fresh-database PR proof exists, but no approved short-lived Production credential/provider-native hook is detected. | Production migration automation cannot be safely enabled yet. | High |
| Historical migration preflight | Migration 0015 adds and uses a PostgreSQL enum value that must be committed between operations. The existing idempotent preflight is required before fresh replay. | Restore/bootstrap tooling must preserve this explicit step; migration history cannot safely be treated as standalone. | High |
| Legacy admin-preview path | `middleware.ts` and `lib/auth/admin.ts` retain the token path when `CMS_PHASE1_ALLOW_DEV_ADMIN=true`. | Dual access paths increase policy/configuration complexity. | Medium |
| Real licensed-domain and partner evidence | **Detected:** COMM-01 adds a typed repository domain-evidence authority, agreement contract and runtime gates without a schema change. The real evidence store is empty, no real agreement is detected and the GB policy remains commercially off. | Founder contracting, exact real evidence and LEGAL-02 are required before a separately approved activation. | High |
| Operational visibility | Vercel logs and hourly smoke are detected, and the manual ENV-ISO post-merge smoke passed; paging, central retention, independently observed scheduled-notification delivery and a named legal/compliance responder are not detected. | Incidents outside active observation may be delayed; broader monitoring remains less robust than a mature Production operations model. | High |
| Programme expiry and rate limiting | Anonymous expiry is defined and limiting is in-process; no automated purge or shared/distributed limiter is detected. | Multi-instance abuse control and expired-data cleanup remain incomplete. | High |
| Account privacy/recovery lifecycle | Artefact-level edit/content erasure exists; account-wide export, account-wide erasure automation and complete password recovery are not detected. | Full user account lifecycle is incomplete. | High |
| Programme autosave ordering | Draft APIs have no revision/client sequence; scalar/private fields remain last-write-wins. | A delayed request can overwrite a newer draft field. | Medium |
| Connected concurrency evidence | Memory-unit tests cover replay/rollback and schema uniqueness is detected; no multi-process connected-database contention test is detected. | Cross-process production guarantees are not load-tested. | Medium |
| CMS coverage ambiguity | Article/legacy CMS models exist, but no article admin/editor route is detected. | Ownership of legacy/unused content entities remains unclear. | Medium |
| Route-local CSS breadth | Design System v1 centralizes the recurring production palette and one proven Action family, but 25 route/domain CSS Modules remain by design and the breakpoint spread is unchanged. | Additional extraction without production evidence could erase approved page and domain differences. | Low |
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
- FE-DS-01 frontend consolidation: recurring production colour roles, focus/motion roles and eligible internal actions are governed by Design System v1; five unreachable presentation wrappers were removed.
- Cross-route visual baseline: ten bounded Playwright snapshots now cover public/protected shells, navigation, legal, forms/control outcomes and editorial surfaces.
- OPS-01 linting/governance foundation: ESLint, deterministic three-job CI, fresh-database proof, build-secret scan, scheduled smoke and operational runbooks are delivered by OPS-01 / PR #45.
- OPS-01 dependency baseline: Next.js is patched to 15.5.21 and bounded PostCSS 8.5.23/Sharp 0.35.0 overrides remove the detected transitive advisories; `npm audit` reports zero known vulnerabilities after build/browser regression proof.
- ENV-ISO-01 Preview/Production isolation: [PR #52](https://github.com/AlexG-7BE/sevenbet-next/pull/52) is merged; distinct provider resources, database credentials, Better Auth secrets and admin credentials are detected; Production and Preview provider connections are environment-scoped, exact-host Preview auth passes, no Production data was copied and the disposable auth canary was removed. Exact-merge Production deployment, smoke and real staff auth E2E passed; the ENV-ISO workstream is closed.
- GB-MARKET-01 jurisdiction authority: the existing resolver now uses a versioned, evidence-linked GB policy; trusted Vercel country adaptation, public commercial gates, operator evidence evaluation, redirect-time recheck and non-commercial `/go` behaviour are detected. Real partner/domain evidence and external legal approval remain open gates, not resolved implementation facts.
- COMM-01 authority gaps: typed partner agreement validation, exact repository domain evidence, programme/offer/link/bonus readiness, request-time composition and GB provider-import fail-closed behavior are implemented. Real agreement/domain/offer data and Legal approval remain external release gates rather than missing authority machinery.
- RECOVERY-01 logical recovery path: a Preview custom-format backup restored to an isolated disposable PostgreSQL 16 target with migration, schema, selected-count, integrity, canary and repository-read parity; the Preview canary and all temporary data were destroyed. Managed Production backup capability remains active debt.

Resolved Design System debt does not imply product, legal/compliance, data-partner, backend/operations or launch readiness. Remaining route-local extraction is P2/P3 and requires new production evidence.
