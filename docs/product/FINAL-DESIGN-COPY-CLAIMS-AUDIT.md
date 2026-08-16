# Final Design Copy and Claims Audit

## Scope

This audit separates verbatim Draft Preview copy from live runtime values and verified product facts. The handoff is editorial authority for Preview presentation; it is not evidence for market, safety or commercial claims.

## Rules

- Static headings, labels and editorial prose are preserved verbatim unless they would misstate live state or break an existing legal/safety boundary.
- Casino names, ratings, licences, eligibility, bonus amounts, wagering terms, rankings, counts, dates and affiliate destinations come from current public DTOs or CMS data.
- Programme progress, Mission state, XP and rewards remain server-authoritative.
- Handoff copy that needs evidence remains visible only in the Draft Preview and is listed below for Founder/editorial review before Production.
- Legal, privacy, responsible-gambling and Help content keeps the approved repository wording where the handoff is illustrative or less complete.

## Claims requiring evidence or editorial approval

| Claim family in the handoff | Preview treatment | Production requirement |
| --- | --- | --- |
| “Built from 10 years of player evidence” and equivalent duration/sample claims | Preserve as Draft Preview copy | Verify source, time period, methodology and permitted wording |
| “Most players…” or prevalence statements | Preserve only where verbatim | Cite a reliable source or replace with non-quantified wording |
| Assertions that a tool, rule or Programme step changes outcomes | Present as product framing, not a guarantee | Substantiate and add limits/qualification where required |
| “Best”, “top”, “safer”, “trusted” or recommendation language | Use only with visible methodology/eligibility context | Confirm ASA/CAP, affiliate and jurisdiction review |
| Illustrative casino scores, review counts, bonus values and wagering terms | Never hard-code | Replace with current eligible DTO values or an explicit unavailable state |
| Availability, licence or country statements | Never infer from the design | Use jurisdiction and public profile data; fail closed |
| Responsible-gambling/help effectiveness statements | Prefer approved repository safety copy | Compliance review before any wording expansion |

## Dynamic-value audit

- **Detected:** casino and offer DTOs already provide public names, slugs, ratings, summaries, badges, terms and eligibility-related display values.
- **Detected:** comparison is already computed by a public comparison service with validation boundaries.
- **Detected:** Programme reward/progress values are server-derived and must not be recalculated in visual components.
- **Detected:** public Learn and legal content have durable repository sources.
- **Detected:** route and source audits confirmed that illustrative casino scores, ratings, offer amounts, wagering terms, counts, licence states and eligibility claims were not hard-coded into the final runtime surfaces.
- **Detected:** empty current inventory renders explicit published-data empty states; the contextual comparison renders `Unavailable` and does not invent replacement values.
- **Detected:** guarded functional QA uses explicitly labelled fictional demo records only in the disposable local `_ci` database, with exact cleanup after execution.
- **Not detected:** evidence in the handoff archive that independently substantiates the claim families above.

## Copy disposition

- **Detected:** handoff-authored headings, labels and static editorial framing are retained on their mapped Draft Preview surfaces where they do not conflict with an approved legal, safety or privacy source.
- **Detected:** approved repository wording remains authoritative for Programme access, protected Help, legal/privacy detail, responsible-gambling limitations and commercial eligibility.
- **Detected:** comparative language is neutral: the product exposes evidence and differences but does not fabricate a winner or recommendation.
- **Detected:** affiliate disclosures remain adjacent to commercial discovery and outbound actions retain the existing confirmation and fail-closed boundaries.
- **Detected:** `/bonus-guide` remains standalone, while category, retired tool and legacy comparison URLs consolidate to canonical destinations.

## Release disposition

The implementation is suitable for a labelled Draft PR and Vercel Preview. The unsubstantiated claim families above remain a Production release gate and must not be activated as live factual claims without evidence and compliance/editorial approval.
