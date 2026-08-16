# Final Design Copy and Claims Audit

**Audit date:** 17 August 2026

**Release scope:** Draft PR and Vercel Preview only

**Editorial authority:** final design handoff v1.2
**Runtime authority:** current `sevenbet-next` services, privacy boundaries and jurisdiction rules

## Disposition rules

- `VERIFIED` means repository evidence or the linked primary source supports the implemented statement. It is not a Production legal approval.
- `UNVERIFIED` means the handoff supplies the statement but no underlying test record, service record or operational evidence was supplied.
- `DYNAMIC_PLACEHOLDER` means illustrative handoff data is replaced by the current public DTO/CMS value or a fail-closed unavailable state.
- `LEGAL_REVIEW_REQUIRED` and `PRIVACY_REVIEW_REQUIRED` are explicit Production gates. The wording remains visible only in the labelled Draft Preview when the handoff requires it.
- Static editorial copy is reproduced verbatim except where it would override verified Protected Help, Programme, authentication, jurisdiction, commercial-disclosure or data boundaries. Every exception is recorded below.

## Commercial and editorial claims

| Supplied/implemented claim | Status | Evidence and Preview disposition |
| --- | --- | --- |
| “Tested with real money — our own”, “real-money tested” and equivalent claims | `UNVERIFIED` | Preserved as handoff-authored Draft copy. No transaction/test ledger was supplied in the handoff or detected in public DTOs. Production needs dated records for every affected operator/page. |
| “50+ casinos researched”, “200+ hours of testing”, “hundreds of hours”, or similar counts | `UNVERIFIED` | Preserved on the Draft Best Offers composition where specified. They are static editorial claims, not derived from current inventory. Production needs a reproducible count and scope. |
| At least four weeks of observation, three withdrawals, ordinary-player account and own-money methodology | `UNVERIFIED` | Preserved on Methodology where specified. No complete test-cycle evidence set was supplied. |
| Raw records retained for at least 24 months | `LEGAL_REVIEW_REQUIRED` | Preserved Draft methodology claim; repository evidence does not establish a complete editorial test-record retention operation. Must align with the approved retention schedule before Production. |
| Corrections within 48 hours | `UNVERIFIED` | Preserved on Methodology, Affiliate Disclosure and Contact. No service-level evidence or monitored operational commitment was detected. |
| Human response within 24 hours, weekends included | `UNVERIFIED` | Preserved on Contact because the handoff explicitly supplies it. It is not repeated in Protected Help and is a Production operational gate. |
| “Updated weekly”, “updated continuously”, “everything dated/everything correctable” | `UNVERIFIED` | Draft editorial wording. Current DTO dates remain authoritative where present; the repository does not prove the stated publishing cadence. |
| “Not sponsored”, no paid placements/sponsored scores, and scores locked before commercial terms | `UNVERIFIED` | The affiliate/editorial code paths and disclosures are separated, but the absolute business-process claims require governance evidence outside source code. Preserved for Draft; Production approval required. |
| Affiliate-funded links and commission possibility | `VERIFIED` | Affiliate entities, public tracking boundaries, outbound confirmation and disclosure surfaces are detected. The disclosure is adjacent to commercial discovery and the Programme/Help surfaces contain no commercial links. |
| Programme and Help data never feed offers, rankings or commercial personalisation | `VERIFIED` | Programme architecture standards, closed analytics schemas, service imports and regression tests preserve this separation. |
| “Best”, “top three”, “safer”, “trusted”, score/verdict and #1 recommendation language | `DYNAMIC_PLACEHOLDER` | Names, scores, offer values, ranks, licences, eligibility, last-verified dates and destinations come from current eligible public DTOs. Empty or incomplete inventory fails closed; the UI does not invent a winner. Production still needs editorial/ASA review of the framing. |
| “Terms shown before every CTA” | `LEGAL_REVIEW_REQUIRED` | Significant offer terms are surfaced when supplied and outbound actions retain confirmation. This absolute statement needs a populated-data and content-governance audit before Production. |
| “100% independent & transparent” | `LEGAL_REVIEW_REQUIRED` | Handoff-authored absolute claim. Affiliate disclosure is visible, but the percentage/absolute framing cannot be established from source code alone. |

## Bonus Guide and promotion claims

| Supplied/implemented claim | Status | Evidence and Preview disposition |
| --- | --- | --- |
| Worked 35× examples, expected-cost examples, percentage rules of thumb | `LEGAL_REVIEW_REQUIRED` | Preserved verbatim for Draft as educational arithmetic, not a guarantee. Calculations and assumptions need independent editorial/legal sign-off. |
| “The best offers … almost always … 10–15× on bonus only” | `LEGAL_REVIEW_REQUIRED` | Preserved because the manifest locks Draft article copy, but it is not suitable for Production as written. From 19 January 2026, Great Britain licensees may not impose wagering requirements over 10× the incentive amount. See the [UK Gambling Commission rule and final wording](https://www.gamblingcommission.gov.uk/standards/bingo-and-casino-technical-requirements/proposal-1-ban-or-limit-the-use-of-wagering-requirements). |
| Significant eligibility, deposit, wagering, withdrawal and time-limit terms | `DYNAMIC_PLACEHOLDER` | Runtime offer terms come from current eligible DTOs. The audit records that CAP says significant conditions must be clear and prominent and full terms readily accessible; see [ASA/CAP free-bet and bonus guidance](https://www.asa.org.uk/advice-online/gambling-betting-and-gaming-free-bets-and-bonuses.html). The locked Draft article itself is unchanged. |
| Illustrative operator names, bonus amounts, wagering multipliers and comparison examples | `DYNAMIC_PLACEHOLDER` | Never used as live inventory. Directory/profile/comparison values use services or display `Unavailable`/published-data empty states. |

## Programme, Help and responsible-gambling claims

| Supplied/implemented claim | Status | Evidence and Preview disposition |
| --- | --- | --- |
| Programme has ten Missions and is free/no upsell | `VERIFIED` | Ten-Mission server-owned Programme and no Programme commercial links/paywall are detected. Reward, completion, next-Mission, streak, active-day and achievement values remain server projections. |
| Starting Point can be drafted before account claim | `VERIFIED` | After the legal/access gate, anonymous Mission 01 accepts one voice-or-text situation submission and produces a best-effort Starting Point. The next screen is the ready/account-claim screen; no anonymous clarification, candidate editor or reward screen remains. Programme tests cover the complete claim continuation. |
| “Programme does not diagnose or treat” and completion is not a statement that gambling is safe/suitable | `VERIFIED` | Explicit limitations are present in the Ten Steps/Programme presentation and existing safety architecture. |
| Help pause length “24 hours to 6 weeks” or a B4GAMBLE human response within 24 hours | `UNVERIFIED` | Preserved verbatim on the Draft Preview because the Founder lock requires the supplied static copy. No pause service or monitored 24-hour response evidence was detected. These claims block Production until independently substantiated or approved for revision. |
| GamCare support link and National Gambling Helpline number | `VERIFIED` | The protected page links to GamCare and shows `0808 8020 133`; GamCare currently publishes that number as its free 24/7 helpline. No regional emergency number is inferred. |
| Help choices/activity are not saved or used commercially | `VERIFIED` | Protected Help remains account-free, commercial-free and outside Programme completion/affiliate targeting. |

## Privacy, authentication and account claims

| Supplied/implemented claim | Status | Evidence and Preview disposition |
| --- | --- | --- |
| Raw Programme narrative stays in the browser session; server records use privacy-safe markers and neutral progress/output fields | `VERIFIED` | Session-storage flow, privacy markers and API contracts are detected and regression-tested. Saved outputs explicitly chosen by the user remain server-owned. |
| Google provides bounded account identity, not contacts/mailbox/date of birth/gambling profile; OAuth credential material is stripped before account persistence | `VERIFIED` | Better Auth configuration restricts scopes and linking; its token fields are encrypted when present, and the application account sanitizer strips credential fields before persistence. The additive Privacy paragraph is required by the current authentication contract. |
| Google sign-in, age confirmation, Terms acceptance and Programme participation do not create marketing/reminder permission | `VERIFIED` | Access proof and consent contracts are separate from communications consent. |
| “We do not sell personal data” | `PRIVACY_REVIEW_REQUIRED` | Preserved handoff statement and consistent with detected product paths, but the absolute organisation-wide claim requires controller/process review beyond source code. |
| Basic analytics only; optional analytics cookies remain off until acceptance; Help has only anonymous page-view counting | `PRIVACY_REVIEW_REQUIRED` | Product analytics is repository-default-off with a closed event contract. Current hosted activation, cookie-consent operation and provider behaviour are not established by source alone. |
| Commercial and support analytics have no shared identifier | `PRIVACY_REVIEW_REQUIRED` | No Programme/Help fields are permitted in commercial event contracts, but the absolute deployed analytics topology needs environment/provider verification. |
| Export/delete in one dashboard action; deletion is immediate and irreversible | `PRIVACY_REVIEW_REQUIRED` | A data-subject export/deletion service is detected, but the current public dashboard does not establish the complete one-action UX. Provider backups may retain encrypted copies until expiry; therefore the unqualified handoff wording needs revision/approval before Production. |
| Analytics aggregated after 14 months | `PRIVACY_REVIEW_REQUIRED` | Handoff wording preserved for Draft. No complete deployed aggregation/retention job evidence was detected. |
| Data encrypted in transit and at rest; direct breach notice without delay | `PRIVACY_REVIEW_REQUIRED` | TLS/provider and security controls exist, but the absolute at-rest and notification claims require processor, infrastructure and incident-response evidence. |
| Privacy updated date | `VERIFIED` | Runtime shows 13 August 2026, rather than the handoff’s 12 August date, because the signed Programme access/privacy acknowledgement contract changed on 13 August. This is a deliberate additive deviation. |

## Dynamic and demo-value audit

- `VERIFIED`: casino/offer names, slugs, media, ratings, summaries, badges, terms, rankings, eligibility, countries, licence display, dates and affiliate destinations come from current public services/CMS records.
- `VERIFIED`: comparison accepts validated public slugs only, supports up to three selections and displays `Unavailable` rather than fabricating missing differences.
- `VERIFIED`: dashboard XP, progress, Mission state, active days, streaks, achievements and rewards are server-derived.
- `DYNAMIC_PLACEHOLDER`: ordinary local and Vercel Preview rendering continues to use current public services, jurisdiction authority and DTO values, including legitimate empty/fail-closed states.
- `DYNAMIC_PLACEHOLDER`: true-parity screenshots use the handoff's illustrative operator values only behind `B4GAMBLE_HANDOFF_VISUAL_FIXTURE=true` plus `visualFixture=true`. The guard rejects all Vercel environments, exposes no commercial action, and does not alter runtime records.

## Exact Draft copy deviations for Founder decision

These are the complete deliberate static/editorial deviations from the supplied handoff in this Draft Preview:

1. **Protected Help:** no static copy is removed. The Draft Preview preserves the supplied pause and human-response promises verbatim while keeping Help free of offers, ad tracking and commercial targeting. The GamCare row is made into a real, accessible external link; the unsupported B4GAMBLE operational promises remain Production blockers.
2. **Privacy:** the Preview shows “Updated 13 August 2026” rather than the handoff's 12 August date. It adds the current controller identity and address — 7BE Inc., trading as B4GAMBLE, 447 Broadway, 2nd Floor, 1663, New York, NY 10013, United States — and the paragraph defining the limited Google identity data, transient credential handling, and separation from age verification, Programme participation, reminders and marketing permission.
3. **Terms:** the Preview shows “Effective 7 August 2026” and “Updated 9 August 2026” rather than the handoff's “Updated 12 Aug 2026”. It adds the same current operator identity and address. Those values replace the handoff's legal-date/controller presentation.
4. **Bonus Guide:** the handoff article copy is unchanged. The current UK Gambling Commission wagering-requirement rule and ASA/CAP significant-conditions guidance are recorded in this audit only; nothing is appended to the locked Draft page.
5. **Dynamic commercial examples:** illustrative casino and offer names, amounts, terms, ranks, licences, dates and destinations from the handoff are replaced by eligible current DTO/CMS values. Missing authoritative data renders an empty or `Unavailable` state. Crypto, mobile and curated-ranking selectors fail closed when their required evidence is absent.
6. **Responsive navigation:** the small-screen public header adds the control label “Menu” so the retained destinations remain accessible.
7. **Programme:** the approved legal/adult access gate and just-in-time sensitive-input authority precede the handoff flow. Founder correction RFC-034 fixes the anonymous sequence to one voice-or-text situation submission, a best-effort ready Starting Point, then Google-primary/email-secondary account claim. It therefore omits the older anonymous clarification, candidate-editor and reward-screen presentation while preserving 20 XP for the situation action and 20 XP for Mission 01 completion after claim.

## Release disposition

The copy is acceptable only for the labelled Draft PR and Vercel Preview. Every `UNVERIFIED`, `LEGAL_REVIEW_REQUIRED` and `PRIVACY_REVIEW_REQUIRED` row is a Production release gate; the Preview must not be promoted or deployed with Production configuration until those gates are resolved.
