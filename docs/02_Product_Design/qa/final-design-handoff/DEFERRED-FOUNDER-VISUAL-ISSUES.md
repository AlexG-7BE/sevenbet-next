# Deferred Founder Visual Issues

Material visual issues outside the Casino Review, shared-header and verified-motion scope are recorded here for a later route-by-route Founder walkthrough.

| ROUTE | REGION | ISSUE | SEVERITY | WHY DEFERRED |
| --- | --- | --- | --- | --- |
| `/bonuses` | Curated Top 3 at 390 px and below | The handoff-derived shortlist retains a fixed 360 px card track inside a narrower content frame, so the card can clip instead of reflowing. | High | Local Bonuses width/layout work is explicitly outside this Casino Review/header/motion pass and does not block header-theme or interaction acceptance. |
| `/best-offers` | Featured offer at narrow mobile widths | The existing mobile rule fixes the featured card and terms tracks at 420 px, wider than the 390 px viewport. | High | Founder direction forbids another broad or unrelated page-specific geometry pass; this route is motion/header audit only here. |
