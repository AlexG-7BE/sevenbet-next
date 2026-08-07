# Launch Technical Debt

| Issue | Impact | Recommendation | Priority |
| --- | --- | --- | --- |
| RFC-001 is Proposed and market/referral gates are unresolved. | A commercial or market launch is not authorised. | Complete the required RFC decisions and phase gates before enabling any governed exposure. | P0 |
| Privacy and Terms are substantive launch-candidate pages but external legal/process verification is outstanding. | Page implementation is complete; launch governance is not. | Obtain external counsel review and verify processor/subprocessor, retention and transfer statements. | P0 |
| Production deployment, monitoring, backup/restore, and incident evidence are not detected. | Operational failure recovery and accountability are unproven. | Approve and implement the applicable operational architecture and runbooks. | P0 |
| `NEXT_PUBLIC_SITE_URL` has a localhost fallback. | A missing production variable would publish incorrect canonical, sitemap, robots, and schema URLs. | Make the production origin a deployment-required environment variable and verify it in release checks. | P1 |
| CMS read failures fall back to legacy public casino data. | Availability is preserved, but publication-state reconciliation needs policy approval. | Define the approved fail-closed/fail-open behaviour per market in the relevant RFC and test it against suspension scenarios. | P1 |
| Server diagnostics rely on `console.warn`; external monitoring is intentionally absent. | Signals are available only through hosting logs and have no defined alert ownership. | Select monitoring, retention, alert thresholds, and on-call ownership through the required operational decision process. | P1 |
| The bonus directory presents static filter/sort affordances. | Users may expect interactive filtering and sorting that is not implemented. | Either implement with the existing discovery query/component pattern after product review, or label the controls as informational before beta. | P2 |
