# Final Production Readiness Audit

Status: **NOT RC READY**

Audit date: 2026-08-18

Branch: `codex/final-design-handoff-v1`

Draft PR: #76 (`OPEN`, `DRAFT`)

Starting local/origin/PR HEAD: `b77523ceb56dd08be6670c1c3d3a1e4b3736d33b`

Final audited source: the commit containing this document; its exact SHA is recorded in the PR verification and final report

Production: **UNCHANGED**

## Evidence classification and authority

- **Detected:** directly observed in source, a local production build, an automated test, a current HTTP response, current GitHub state or a captured current-runtime screenshot.
- **Inferred:** a bounded conclusion from detected behaviour; it is identified as such.
- **Planned:** approved target work not yet proven in the deployed runtime.
- **Not detected:** the audit found no sufficient repository or deployment evidence.

Latest explicit Founder decisions and approved product/engineering documentation govern before the design handoff. Runtime services and governed evidence remain authoritative for dynamic values, availability, claims, authentication, Programme progression, privacy and commercial action. The handoff remains a presentation authority only where it does not conflict with those controls.

## Executive verdict

**NOT RC READY.** The audited branch is materially more coherent, truthful and operable, and all product/code P0/P1 defects found in this pass were remediated. Release-candidate status remains blocked by one external P0 and four open P1 release gates:

1. the existing Preview Google OAuth client does not authorise the stable branch callback;
2. exact deployed Programme migration/Cron/load/multi-instance/monitoring and durable-age evidence remains incomplete;
3. the approved pooled Prisma runtime endpoint is not proven for the release environment;
4. external legal/privacy launch evidence and real commercial partner authority remain incomplete.

No merge, Production deployment, Production configuration, database, DNS, OAuth-client or secret mutation occurred.

## Audit coverage

### Routes

Detected coverage includes `/`, `/10-steps`, `/program`, `/login`, `/best-offers`, `/casinos`, `/casino/demo-northstar`, `/bonuses`, `/learn`, a representative `/learn/[category]/[slug]`, `/bonus-guide`, `/responsible-gambling`, `/help`, `/help/self-exclusion`, `/methodology`, `/about`, `/faq`, `/affiliate-disclosure`, `/contact`, `/privacy`, `/terms`, branded 404, `/compare` redirect behaviour, compatibility redirects, governed outbound states, `robots.txt`, `sitemap.xml` and `llms.txt`.

### Viewports

Detected browser and geometry coverage: `360`, `375`, `390`, `412`, `430`, `768`, `1024`, `1280` and `1440` CSS pixels. The primary manual screenshot review used `390`, `1024` and `1440`.

### Critical states and interactions

Detected coverage includes public desktop/mobile navigation, final Home composition, demo/empty/fail-closed commercial inventory, casino filters/search, JavaScript-off native GET filters, comparison selection 1/2/3 and auto-open, sheet close with retained selection, casino sticky/fixed decision state, bonus calculator, Learn search/filter/no-result recovery, FAQ/details, Contact invalid submission, anonymous Mission 01 typed fallback to Starting Point Ready, Google-primary/email-secondary registration, Login Google/email presentation, OAuth return error/retry contract, Protected Help commercial isolation, 404/redirect and renderer integrity.

Google initiation reaches the real Google authorisation origin. Google consent, callback, exact-once claim, real Dashboard arrival and Mission 02 continuation are not end-to-end verified because Google rejects the current Preview callback registration.

## Findings ledger

| ID | Route/state | Severity | Evidence and root cause | Remediation/status |
| --- | --- | --- | --- | --- |
| PRD-001 | `/program`, `/login`; real Google initiation | P0 external | Detected: existing Better Auth request reaches Google, which returns `redirect_uri_mismatch`. The stable branch callback is absent from the existing Preview OAuth client's authorised redirects. | **OPEN.** External owner must add exactly `https://sevenbet-next-git-codex-final-design-9fca2f-alexg-7bes-projects.vercel.app/api/auth/callback/google`. No credential rotation/client replacement/Production change. |
| PRD-002 | Public claims across Home, Best Offers, Casinos, trust/legal pages and footer | P1 | Detected unsupported absolute real-money testing, volume, cadence, independence, retention, deletion and process/SLA wording inherited from the handoff. | **FIXED.** Runtime transforms and active components now qualify claims, disclose source/availability state and remove unsupported absolutes. |
| PRD-003 | `/learn` | P1 | Detected stale captured cards, hash/dead destinations, topic matching based on incidental copy and no meaningful no-result state. | **FIXED.** Current manifest drives unique routes/cards; semantic topic metadata, search/facet composition, counts, live status and recovery are real. |
| PRD-004 | `/bonus-guide` | P1 | Detected outdated 10–15× GB framing, real-offer/test implications, missing current primary sources and a mobile comparison row that pushed a material column off-screen. | **FIXED.** Examples are explicitly fictional, current GB 10× rule and ASA/CAP sources are linked, claims are bounded and the mobile table reflows without document overflow. |
| PRD-005 | Demo commercial surfaces | P1 | Detected demo records exposing a visual Compare affordance even though they are explicitly non-current/non-comparable; Best Offers hero implied real testing and current live inventory. | **FIXED.** Demo comparison/action affordances are suppressed; dynamic hero statistics and copy reflect actual inventory mode and zero live/claim actions. |
| PRD-006 | OAuth return/Programme claim | P1 security/integrity | Detected: the automatic redeem guard was reset after a failed automatic attempt, allowing the effect to issue a second automatic redeem and violate the intended retry/exact-once contract. | **FIXED.** The automatic guard remains consumed; explicit user retry remains available. Targeted browser regression passes. |
| PRD-007 | `/casinos` without JavaScript | P1 | Detected: final desktop controls intentionally hid legacy sort UI, while the existing `<noscript>` filter form was also hidden, leaving no native filter submit affordance. | **FIXED.** A scripting-aware native GET details/form is visible only when scripting is unavailable. Enhanced RSC and no-JavaScript tests pass. |
| PRD-008 | Bonuses/material terms/mobile | P1 | Detected functional labels and actions below the 14px contract and insufficiently explicit source/demo framing on curated cards. | **FIXED.** Material labels/actions meet the functional floor; demo/source state remains adjacent and visible. |
| PRD-009 | `/contact` and copied trust statements | P1 claims | Detected unsupported 24/48-hour response/correction promises and an absolute contact-data statement not supported by operational evidence. | **FIXED.** Response timing is no longer promised; use and privacy boundaries are stated precisely. No real message was sent. |
| PRD-010 | Casino profile at 1024 | P2 | Detected by screenshot: the absolutely positioned `FICTIONAL 18+ FIELD` badge intersected the demo disclosure in the hybrid tablet layout. | **FIXED.** Badge returns to normal flow only from 761–1050px; geometry regression prevents recurrence. |
| PRD-011 | Functional typography/touch targets | P2 | Detected several 12–13px customer actions/labels and mobile source/TOC links below the active contract. | **FIXED.** Bounded component-level floors and 44px targets applied; expressive display type is unchanged. |
| PRD-012 | Starting Point screen-reader sentence | P2 | Detected duplicated terminal punctuation when candidate strings already ended in punctuation. | **FIXED.** Terminal punctuation is normalised before composing the hidden continuation sentence. |
| PRD-013 | Dependency/runtime supply chain | P1 security | Detected after push: GitHub/npm reported the high-severity `deepmerge-ts` recursive-object stack-exhaustion advisory through the Prisma CLI/config-loader tree. Source and built-server scans found no application-route import/reachability, but the vulnerable package remained installed. | **FIXED in audited branch.** Prisma CLI is correctly classified as a development dependency and the lockfile explicitly resolves the patched `deepmerge-ts` 8.0.0. Prisma schema validation, generation/build compatibility and `npm audit` pass with zero findings. The default-branch alert cannot close until an authorised merge. |
| PRD-GATE-002 | Programme runtime operations | P1 release gate | Detected in approved project state: migration `0019`, shared rate limit, purge CLI/Cron source exist. Exact deployed migration, Cron schedule/execution, multi-instance/load/monitoring, durable age and approved legacy cleanup evidence is partial or not detected. | **OPEN.** Release/operations owner must complete the governed deployment evidence. |
| PRD-GATE-003 | Legal/privacy launch | P1 external release gate | Not detected: complete UK representative/ICO determination, processor/transfer assessment, DPIA approval and outside-counsel release approval. | **OPEN.** Legal/privacy owner action required. |
| PRD-GATE-004 | Commercial release | P1 external release gate | Detected: public demo inventory fails closed. Not detected: approved real partner, licence/domain/agreement/offer/link/redirect evidence or commercial activation decision. | **OPEN.** Keep referral actions off until a separately authorised bounded beta. |
| PRD-GATE-005 | Database runtime configuration | P1 operations | Detected build/runtime warning that the audited environment is not proven to use the approved pooled Prisma Postgres endpoint. | **OPEN.** Platform owner must configure and verify the pooled runtime `DATABASE_URL` while retaining a direct migration `DIRECT_URL`; no change was authorised in this pass. |

## Finding counts

| Severity | Found | Fixed | Remaining | Deferred |
| --- | ---: | ---: | ---: | ---: |
| P0 | 1 | 0 | 1 external | 0 |
| P1 | 13 | 9 | 4 release/external | 0 |
| P2 | 3 | 3 | 0 | 0 |

## Product/system result

### Global shell and responsive system

Detected: one production `PublicHeader` and `PublicFooter` own normal public routes, including Programme. Protected Help remains deliberately isolated and commercial-free. Content axes, gutters, footer reachability and route-level document width passed the audited matrix. Mobile menu Escape/visibility and desktop navigation passed. The 1024 casino badge overlap was the only fresh screenshot-level systemic defect and is fixed.

### Typography, accessibility and motion

Detected: functional text/input/touch contracts pass structural and browser checks. Focus states, keyboard details/menu/dialog behaviour, comparison focus/Escape contract, live search status, form labels/errors and reduced-motion visibility are covered. Motion content is visible by default, enrols only after a capable observer exists and becomes immediately visible under reduced motion. No JavaScript-dependent reveal hides essential content.

### Home and 10 Steps

Detected: accepted desktop integrated closing composition and separate mobile final CTA/footer remain intact. All nine Home chapters, final CTA, footer and mobile navigation pass. Ten Steps retains value-first Mission 01 entry and now uses bounded privacy/deletion wording.

### Best Offers, Casinos, comparison and casino review

Detected: these use real runtime components, not `HandoffPage`. Inventory-mode copy is dynamic; fictional records remain non-claimable and expose no Visit/Compare action. Material terms are visible. Casino selection automatically opens contextual comparison on the second real selectable casino, retains selection after close and accepts at most three. `/compare` remains redirect-only. Casino profile final demo state meets the footer with zero gap; mobile score/KEEP IN VIEW and fixed decision bar geometry pass; the tablet badge collision is fixed.

### Bonuses, Learn and Bonus Guide

Detected: bonus calculator reacts to multiplier, wagering base and game weighting; filters and native forms remain server-authoritative. Learn is backed by the current manifest, all cards are real links and combined query/topic filtering has a live no-result recovery. `/bonus-guide` remains standalone/indexable, uses explicit fictional examples, links current primary rules and has no document-wide overflow.

### Programme, Login and auth

Detected: public `/program` uses `ProgramAiExperience`/`ProgramAiFinalPresentation`; no `HandoffPage` or alternate public Programme renderer is reachable. Fresh anonymous Mission 01 preserves value-first ordering and Google-primary/email-secondary continuation. Login presents returning-user Google intent first and usable email/password fallback. Account linking remains explicit; matching email alone does not link accounts. Secrets/tokens are not client-rendered or logged by the audit. The automatic redeem double-attempt defect is fixed.

Inferred from the blocked external boundary: successful Google callback, exact-once claim, real Dashboard and Mission 02 continuation cannot be declared end-to-end complete on this Preview until the authorised redirect is added and the journey is rerun.

### Help, privacy, commercial governance and contact

Detected: Protected Help contains no commercial route/action and its activity is excluded from commercial personalisation contracts. Closed analytics schemas and regression tests preserve the Programme/Help/commercial wall. Demo inventory and commercial actions fail closed. Contact invalid submission focuses and announces the error without sending; operational response-time promises were removed.

## SEO, links, performance and renderer integrity

- Detected link crawl: 47 public routes, 46 internal links, 0 broken links.
- Detected: `/bonus-guide` canonical/indexable; `/compare` redirect-only; private/admin/error surfaces retain their governed index boundaries.
- Detected: current dynamic surfaces contain runtime renderer markers and no nested `HandoffPage`.
- Detected: no infinite render/request loop was observed in the audited journeys.
- Detected local normal runtime warning: direct/unapproved pooled database endpoint state. This remains PRD-GATE-005.
- Not detected: complete final Vercel function-log/monitoring evidence; the local Vercel CLI had no authenticated read context. Exact-commit GitHub checks and HTTP runtime state must be recorded after push.

## Configuration readiness matrix

Values were never read or printed. `PRESENT` may be inferred only where current runtime behaviour requires both configured names.

| Contract | Preview | Production read-only observation | Release interpretation |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` / canonical authority | PRESENT / SCOPED | PRESENT | Source and current HTTP canonicals resolve; no mutation. |
| `BETTER_AUTH_URL` | PRESENT / SCOPED | PRESENT | Google initiation/current login availability require auth base authority. |
| `BETTER_AUTH_SECRET` | PRESENT (inferred from working auth runtime) | PRESENT (inferred) | Value not read. |
| `BETTER_AUTH_TRUSTED_ORIGINS` | PRESENT / SCOPED | PRESENT / SCOPED (inferred) | Preview initiation works; no open redirect relaxation added. |
| `GOOGLE_CLIENT_ID` | PRESENT | PRESENT (combined availability inferred from current Login) | Value not read. |
| `GOOGLE_CLIENT_SECRET` | PRESENT | PRESENT (combined availability inferred from current Login) | Value not read. Preview redirect registration still mismatches. |
| `DATABASE_URL` | PRESENT / MISMATCH pooling evidence | PRESENT / UNKNOWN pooling evidence | P1 platform gate. |
| `DIRECT_URL` | PRESENT in governed CI/migration contract | UNKNOWN current hosted value | Exact migration CI must remain green. |
| `PROGRAM_AI_PROVIDER` / `OPENAI_API_KEY` | PRESENT (inferred from previously verified normal Preview Starting Point) | PRESENT per approved current Programme state; fresh value not read | No unrestricted provider/privacy expansion authorised. |
| `CRON_SECRET` / purge schedule | UNKNOWN exact deployed state | UNKNOWN | Programme operations P1 gate. |
| `CONTACT_EMAIL_DELIVERY_ENABLED`, `RESEND_API_KEY`, `CONTACT_EMAIL_FROM`, `CONTACT_EMAIL_TO` | UNKNOWN current hosted state | UNKNOWN | No real send was attempted; contact launch evidence remains separate. |
| `NEXT_PUBLIC_PRODUCT_ANALYTICS_ENABLED` | UNKNOWN hosted value; source defaults off | UNKNOWN hosted value | Consent/provider operation requires separate deployed evidence. |
| Affiliate partner credentials/activation | ABSENT/disabled for governed Preview product action | ABSENT/not authorised for public release | Correct fail-closed state, not a launch approval. |

## Test evidence

Detected during the pass:

- `npm run ci:quality`: PASS, including lint, typecheck, Prisma validation, structural, typography structural, editorial/public IA/auth/recovery/contact and release-focused tests.
- `npm run build`: PASS; pooled runtime warning remains explicit.
- `npm audit`: PASS with 0 vulnerabilities after the bounded Prisma config-loader override; `npx prisma validate` also passes.
- `npm run typography:browser`: 3/3 PASS.
- `npm run ci:build-secrets`: PASS across 721 browser files.
- `npm run launch-polish:links`: PASS; 47 routes, 46 links, 0 broken.
- visual/accessibility regression suite: 5/5 PASS.
- final release-focused browser suite: 10/10 PASS on the real runtime renderers with a read-only local database-backed server; Google availability evidence used non-secret local placeholders only for presentation, not OAuth completion.
- UX/performance structural suite: 54/54 PASS; enhanced browser scenarios and focused no-JavaScript native GET fallback pass.
- responsive geometry matrix: 20 routes × 7 widths (`360`, `375`, `390`, `412`, `430`, `768`, `1024`) PASS with no document overflow, clipping or undersized critical target; desktop evidence adds `1280`/`1440`.
- local `ci:migrations`: not executed because the disposable CI PostgreSQL service at `127.0.0.1:54329` was not available. This is not reported as PASS; the exact remote migration job is the release evidence.
- `git diff --check`: required again immediately before commit.

## Evidence directory

Fresh screenshots are stored at `docs/02_Product_Design/qa/production-readiness/final-rc/` under `desktop-1440/`, `tablet-1024/`, `mobile-390/` and `critical-states/`. They cover the shared shell, Home close, directories, casino profile, Learn, Bonus Guide, 10 Steps, Programme entry/registration, Google-primary/Login, comparison, calculator, Contact validation, Protected Help and the mobile fixed decision state.

## External blockers

### Google Preview callback

- Owner: Founder/Google OAuth administrator.
- Exact action: add `https://sevenbet-next-git-codex-final-design-9fca2f-alexg-7bes-projects.vercel.app/api/auth/callback/google` to the authorised redirect URIs of the existing Preview Google OAuth client.
- Why: Google currently rejects the real request with `redirect_uri_mismatch`.
- Production impact: none if the URI is added without removing/changing Production redirects or credentials.

### Programme operations and pooled database runtime

- Owner: Platform/operations.
- Exact action: prove the exact deployed migration, pooled runtime URL shape, direct migration URL separation, Cron/purge execution, multi-instance rate limit, load/monitoring and durable age evidence under the approved runbooks.
- Why: source implementation and local/CI tests do not substitute for deployed operational evidence.
- Production impact: configuration/deployment work requires separate authority; none was performed here.

### Legal/privacy launch evidence

- Owner: Founder Office, privacy/legal owners and outside counsel.
- Exact action: close UK representative/ICO determination, processor/transfer assessment, DPIA and counsel release gates.
- Why: organisation/process facts cannot be established from source code.
- Production impact: blocks public launch approval; no configuration change in this pass.

### Commercial activation

- Owner: Founder/commercial governance.
- Exact action: separately approve a bounded beta only after complete real operator/partner/licence/domain/agreement/offer/link/redirect evidence.
- Why: no real partner authority is detected; the product correctly fails closed.
- Production impact: commercial actions remain off.

## Required closure sequence

1. Push the final scoped commit to Draft PR #76; keep it Draft.
2. Require all exact-commit GitHub jobs, including migration verification and Vercel Preview, to pass.
3. Record local SHA = origin branch SHA = PR head SHA and immutable Preview URL.
4. Register only the Preview Google callback externally, then rerun fresh Mission 01 → Google → callback → exactly-once claim → Dashboard → Mission 02 and returning-user Login.
5. Close the Programme/platform, legal/privacy and commercial P1 gates.
6. Founder separately decides whether to merge and whether/when to deploy Production.
