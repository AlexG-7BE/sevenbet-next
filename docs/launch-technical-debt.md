# Launch Technical Debt

| Issue | Impact | Recommendation | Priority |
| --- | --- | --- | --- |
| RFC-014/RFC-015 implement bounded GB market and commercial-partner authorities, but policy remains off and no real licensed-domain/partner agreement is verified. | A GB commercial or referral launch is not authorised. | Founder completes a real partner agreement/evidence package and LEGAL-02 before any permissive policy change. | P0 |
| Privacy and Terms are substantive launch-candidate pages but external legal/process verification is outstanding. | Page implementation is complete; launch governance is not. | Obtain external counsel review and verify processor/subprocessor, retention and transfer statements. | P0 |
| Production deployment, smoke and incident runbooks are detected; provider backup/restore proof and broader paging/retention remain incomplete. | Stateful recovery and mature incident notification remain below launch target. | Complete RECOVERY-01 and separately approve broader monitoring ownership where required. | P0 |
| `NEXT_PUBLIC_SITE_URL` has a localhost fallback. | A missing production variable would publish incorrect canonical, sitemap, robots, and schema URLs. | Make the production origin a deployment-required environment variable and verify it in release checks. | P1 |
| CMS read failures fall back to legacy public casino data. | Availability is preserved, but publication-state reconciliation needs policy approval. | Define the approved fail-closed/fail-open behaviour per market in the relevant RFC and test it against suspension scenarios. | P1 |
| Server diagnostics rely on `console.warn`; external monitoring is intentionally absent. | Signals are available only through hosting logs and have no defined alert ownership. | Select monitoring, retention, alert thresholds, and on-call ownership through the required operational decision process. | P1 |
| The bonus directory presents static filter/sort affordances. | Users may expect interactive filtering and sorting that is not implemented. | Either implement with the existing discovery query/component pattern after product review, or label the controls as informational before beta. | P2 |
