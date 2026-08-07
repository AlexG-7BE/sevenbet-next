# Launch Readiness

**Status:** Engineering readiness is partial. This document is a launch checklist, not approval to launch a market or activate referrals.

## Completed engineering items

- **Detected:** public catalog, casino detail, learning, responsible-gambling, public sitemap, and robots routes exist.
- **Detected:** `/casinos` supplies canonical handling for clean pagination and `noindex,follow` for filtered/search views; it emits BreadcrumbList and ItemList structured data.
- **Detected:** casino detail pages emit their own canonical, Open Graph, Twitter, BreadcrumbList, Review, and FAQ structured data from public DTOs.
- **Implemented:** the root layout now supplies a metadata base, social defaults, an Organization schema, and a keyboard skip link.
- **Implemented:** public error, global-error, and not-found boundaries avoid white screens and avoid revealing technical details.
- **Implemented:** `/responsible-gaming` permanently redirects to the canonical `/responsible-gambling`; the alias is no longer in the sitemap source.
- **Implemented:** standard response headers now prevent MIME sniffing and framing, restrict referrer forwarding, and disable unused browser capabilities.
- **Detected:** affiliate redirect availability is environment-gated; this work did not change that gate.

## Remaining governance gates

- **Blocking — RFC-001:** `docs/06_RFC/RFC-001-Jurisdiction-and-Market-Resolution.md` remains Proposed. It does not authorise market launch, commercial activation, or referral launch.
- **Blocking:** market-specific legal, licence, age, disclosure, support, and ownership evidence must be approved before any market is exposed commercially.
- **Blocking:** production deployment, secret-management, backup/restore, incident, telemetry, and on-call decisions require their applicable RFC/operational approvals.
- **Blocking:** Privacy and Terms are substantive launch-candidate pages, but final external counsel review, processor/subprocessor verification and retention/transfer confirmation remain required before launch approval.

## Known limitations

- **Detected:** `NEXT_PUBLIC_SITE_URL` defaults to localhost when unset. Production must provide the final HTTPS origin before sitemap, canonical, robots host, and JSON-LD are verified.
- **Detected:** public casino runtime can fall back to legacy data after a CMS repository failure. This preserves public availability but must be assessed against the approved market-publication policy before launch.
- **Detected:** current server diagnostics use `console.warn`; no external monitoring provider was added, in line with the Epic.
- **Not detected:** CI/CD configuration, managed production monitoring, backup/restore evidence, deployment runbook, and a production incident/on-call process.

## Manual launch checklist

- [ ] Confirm `NEXT_PUBLIC_SITE_URL` is the final HTTPS canonical origin.
- [ ] Confirm production database migrations are additive, applied, and rollback-tested.
- [ ] Confirm Better Auth secrets, admin bootstrap, and preview-token settings are production-safe.
- [ ] Confirm every published casino has current licence evidence, owner, review date, and jurisdiction approval.
- [ ] Confirm `/r/[slug]` stays disabled unless the relevant governance gates are approved; verify unavailable routing fails safely.
- [ ] Obtain final external counsel approval for Privacy and Terms and verify processor/subprocessor, retention and transfer statements.
- [ ] Verify external media delivery, alt text, social images, and image cache headers on the deployment.
- [ ] Verify redirects, `/robots.txt`, `/sitemap.xml`, canonical links, structured data, and 404/error pages on the deployed origin.

## Production verification checklist

- [ ] Run `npm run typecheck`, `npm run build`, and the full Node test suite from a clean checkout.
- [ ] Load the home page, catalog, a casino detail, learning article, responsible-gambling article, program, and legal pages without console/runtime errors.
- [ ] Test keyboard skip link, visible focus state, form labels, filters, pagination, empty catalog search, and a missing route.
- [ ] Confirm filtered catalog URLs remain `noindex,follow` and do not enter the sitemap.
- [ ] Confirm `/catalog` and `/responsible-gaming` redirect permanently to their canonical pages.
- [ ] Confirm error pages reveal neither database details nor redirect destinations.
- [ ] Confirm response headers include `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and `Permissions-Policy`.

## Post-launch monitoring checklist

- [ ] Review 404, 5xx, catalog-load, and redirect-unavailable diagnostics daily during the launch window.
- [ ] Review CMS publication/archival events and confirm sitemap/detail invalidation.
- [ ] Review stale licence, offer, and editorial-review evidence according to the approved cadence.
- [ ] Escalate any incorrect availability, jurisdiction, or referral outcome immediately; disable the affected route before remediation.
- [ ] Record incidents, corrective actions, and their owner without collecting safety-sensitive data for promotion.
