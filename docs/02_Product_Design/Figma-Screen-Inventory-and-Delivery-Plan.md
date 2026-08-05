# SevenBet Figma Screen Inventory and Delivery Plan

## Document control

- Audit date: 2026-08-05
- Repository: `AlexG-7BE/sevenbet-next`, `main`
- Figma file: [SevenBet](https://www.figma.com/design/UvuJZEzeMAd8cK9TNAueb8)
- Active visual direction: **Tilt-Locked Human Product Theatre** (RFC-007)
- Launch reference: RFC-004, first commercial vertical slice for Great Britain
- Status: factual audit and launch delivery plan; no production-content approval is implied

## Evidence and method

The audit reviewed the required project documents, current public and Programme routes, shared layouts and `SiteChrome`, the Better Auth configuration, and the active Figma file through the Figma Plugin API. Implementation claims below use these evidence labels:

- **Detected** — directly present in the current repository or Figma file.
- **Inferred** — a conclusion from detected structure, without claiming completed behaviour.
- **Planned** — required by an approved product/RFC direction but not detected as completed.
- **Not detected** — no supporting artefact was found in the active sources reviewed.

The active repository root was confirmed as `/Users/alex/Documents/Codex/2026-07-09/ns/sevenbet-next`. Dependencies, generated output, caches and build artefacts were excluded from route/source analysis.

## Executive summary

The audit identifies **73 unique user-facing screen families or representative state families** across the launch journey.

| Figma status | Count | Meaning in this audit |
|---|---:|---|
| `APPROVED` | 5 | Public Header, revised Public Footer, `/10-steps`, Casinos catalogue and its empty/no-eligible state family are visually approved across their completed responsive states. |
| `DESIGNED_NEEDS_QA` | 16 | Current Tilt-Locked design exists but user approval, responsive QA or wider journey handoff remains outstanding. |
| `PARTIAL` | 12 | A component, fragment, or subset of the family exists, but the family is not complete. |
| `LEGACY` | 0 | No active Figma screen is labelled or detected as a retained superseded direction. Legacy/stale frontend surfaces are tracked separately. |
| `MISSING` | 28 | No adequate active Figma family was detected. |
| `BLOCKED` | 8 | Design requires a capability or decision not currently approved/configured, or must remain generic pending compliance/data authority. |
| `NOT_REQUIRED_FOR_INITIAL_LAUNCH` | 4 | Deliberately deferred from the first vertical slice. |
| **Total** | **73** | Unique families; cross-module references are not double-counted. |

**Frontend coverage:** 49 of 73 families have a detected frontend analogue, including partial, placeholder, or legacy implementations. This is route coverage, not design parity. The strongest current Tilt-Locked parity is Home and the Active Control Programme through Mission 04; many other public routes use earlier styling, incomplete states, placeholder content, or the global commercial shell.

**Figma structure detected:** 9 pages; 4 variable collections with 41 variables; 10 text styles; 26 component sets across Core and SevenBet component pages; the Desktop page includes the original Casinos anchor, approved Casinos family `520:2496` and Casino Profile family `529:2850`; the Mobile page includes Public Shell, `/10-steps`, Casinos and Casino Profile family `530:809`; 7 prototype-reaction nodes remain in the responsive Header set; Motion & Prototype and Ready for Dev remain empty. Variable modes remain generically named `Mode 1`, which is a handoff QA issue.

## Current Figma evidence

| Area | Detected evidence | Audit conclusion |
|---|---|---|
| Pages | Strategy; Foundations; Core; SevenBet components; Patterns & Flows; Desktop; Mobile; Motion & Prototype; Ready for Dev | Organisation exists; Desktop and Mobile contain the approved revised `/10-steps` family, Mobile also contains the approved Public Header and Footer family, while Strategy, Motion and Ready for Dev are empty. |
| Foundations | Node `285:55`; 4 collections / 41 variables; 10 text styles | Tilt-Locked foundation exists. Mode naming and handoff notes need QA. |
| Core components | Node `287:2`; 4 sets / 28 components | Core primitives exist. |
| SevenBet components | Page `6:4`; 22 sets / 106 components | Good domain base; the Public Header remains approved, the responsive Footer adds linked Help rows `514:38` and `514:41`, and `/10-steps` retains Evidence Card set `506:640`. Legacy Protected Help definitions `289:131` and `503:2832` are no longer placed on active public screens. Live commercial availability authority and the protected-control shell remain incomplete. |
| Desktop screens | Page `6:6`; Home, Bonuses, Best Offers, original Casinos anchor `325:323`, approved Casinos family `520:2496`, original Casino Profile anchor `343:601`, responsive Casino Profile family `529:2850`, Protected article, Programme M01–M04 and `/10-steps` family `502:2238` | `/10-steps` and Casinos are approved. Casino Profile is review ready with 1,440, 1,280 and fail-closed state coverage while retaining its original anchor. |
| Mobile | Page `6:7`; Public Shell family `492:2268`, revised `/10-steps` family `502:2412`, Casinos family `521:312` and Casino Profile family `530:809` | Public Shell, `/10-steps` and Casinos are approved. Casino Profile now has a full 390 composition, representative 390 states and a 375 first-fold contract pending visual approval. |
| Prototype | 7 interaction nodes in Header set `289:43`; page `6:8` remains empty | Public mobile Menu/Close uses 240ms Smart Animate and Escape recovery; other journeys still need interaction QA. |
| Ready for Dev | Page `6:9`, empty | Public Shell and `/10-steps` approval are recorded here in the inventory; a consolidated implementation-handoff page is still absent. |
| Legacy | No Prismatic Product Theatre, Human Guidance, archived or superseded active frames detected | Do not restore removed directions. |

## Screen inventory

Desktop and mobile statuses describe Figma, not frontend CSS. `—` means no node was detected. Data and compliance entries describe dependencies, not permission to invent production truth.

| ID | Surface / module | Screen | Route | Product purpose | Figma status | Figma node ID | Desktop | Mobile | Frontend status | Backend/data dependency | Compliance dependency | Priority | Required action |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| A01 | Public acquisition | Home | `/` | Primary acquisition, trust and route choice | `DESIGNED_NEEDS_QA` | `289:946` | Designed | Missing | **Detected — active** | Editorial modules and availability data | Affiliate, 18+, market-safe claims | P0 | Add 390 mobile, 375 contract, state and accessibility QA; preserve desktop direction. |
| A02 | Public acquisition | 10-Steps campaign landing | `/10-steps` | Explain value and start Mission 01 | `APPROVED` | Desktop family `502:2238`; 1440 `502:2240`; 1280 `502:2241`; mobile family `502:2412`; full 390 `502:2414`; returning `502:2415`; small `502:2416` | Approved: full signed-out 1440 and 1280 | Approved: full 390 signed-out; 390×844 returning signed-in; 375×667 signed-out first fold | **Detected — legacy/stale** | Programme contract; server-owned XP, progress and next Mission | +60 only after post-M01 account claim; no commercial reward linkage or Programme-data targeting | P0 | Preserve as the approved visual/state contract. Later frontend work must replace the stale shell/body, standalone Help block and `+20 XP` copy. |
| A03 | Public acquisition | General Programme explainer | `/program` or Home modules | Explain Programme without forcing a mission start | `PARTIAL` | `291:23`, `292:64`, `292:141` | Home fragments | Missing | **Detected — partial** | Programme mission summaries | Protected Programme-data separation | P0 | Define IA relationship between campaign landing and direct Programme entry; reuse existing theatre/tool components. |
| A04 | Public acquisition | Age / market entry state | Global entry or contextual gate | Prevent false availability and explain 18+/market limits | `BLOCKED` | Generic notice set `489:70`; family `492:2268` | Generic unknown/unavailable designed | Generic 390/375 designed | **Not detected** | Trusted market/age signals not launch-complete | RFC-001 remains proposed; RFC-004 GB intent is not live eligibility authority | P0 | Generic non-live treatment is designed and marked illustrative; live detection/eligibility remains blocked. |
| A05 | Public acquisition | Public header and responsive navigation | Global | Navigation, Programme, discovery, Help and account entry | `APPROVED` | Set `289:43`; family `492:2268` | Approved: 1440 and 1280 signed-out/in | Approved: 390 closed/open/signed-in; 375 contract | **Detected — legacy/partial** | Auth state; optional market state | Help must stay protected; account/commercial separation | P0 | Preserve as the visual and navigation source of truth for subsequent public P0 families and later frontend parity work. |
| A06 | Public acquisition | Public footer | Global | Trust, disclosure, Help and legal escape routes | `APPROVED` | Set `488:100`; desktop `289:137`; mobile `488:69`; `Open Help` rows `514:38`, `514:41`; family `492:2268` | Approved: desktop and 1280 contract | Approved: full 390 footer and 375 contract | **Detected — legacy/partial** | Navigation/legal registry | 18+, affiliate disclosure, Help neutrality | P0 | Preserve the compact `Open Help` link as part of the approved shared shell; production legal wording remains a content dependency. |
| A07 | Public acquisition | Global search entry | Planned | Cross-site discovery | `NOT_REQUIRED_FOR_INITIAL_LAUNCH` | — | Deferred | Deferred | **Not detected** | Search index | Result eligibility and protected-content separation | OUT OF SCOPE | Do not design until search is accepted into launch IA. |
| B01 | Commercial discovery | Casinos catalogue and filter states | `/casinos` | Discover and shortlist eligible operators | `APPROVED` | Original anchor `325:323`; desktop family `520:2496`; canonical 1440 `520:2498`; 1280 first fold `520:2741`; desktop states `520:2742`; mobile family `521:312`; full 390 `521:314`; filters `521:315`; applied `521:316`; loading `521:317`; no matches `521:318`; state matrix `521:319`; 375 first fold `521:320` | Approved: 1440 full, 1280 first fold and state contract | Approved: full 390, filter open/applied, loading, empty, availability/error matrix and 375 first fold | **Detected — legacy/partial** | Casino discovery service, filters, freshness | Eligibility, affiliate disclosure, material facts, uncertainty | P0 | Preserve as the approved responsive/state contract with the original anchor and approved Public Shell. Frontend parity remains separate. |
| B02 | Commercial discovery | Catalogue empty / no eligible offers | `/casinos` | Honest recovery when nothing can be shown | `APPROVED` | Desktop `520:2742`; no matches `521:318`; mobile state matrix `521:319` | Approved no-matches/no-eligible states | Approved no-matches/no-eligible states | **Detected — partial** | Empty discovery result and reason codes | No substitution with ineligible offers | P0 | Preserve the approved visual treatment; production reason mapping remains a backend/compliance dependency. |
| B03 | Commercial discovery | Restricted / unknown market catalogue | `/casinos` | Block commercial action while retaining neutral routes | `BLOCKED` | Desktop `520:2742`; mobile state matrix `521:319` | Generic illustrative treatment designed | Generic illustrative treatment designed | **Not detected** (shadow evaluation only) | Trusted jurisdiction resolution | RFC-001 enforcement not approved; no live market claim | P0 | Visual treatment is review ready; live authority remains blocked and must not be inferred from the mock states. |
| B04 | Commercial discovery | Casino profile / review, available | `/casino/[slug]` | Evidence-led operator evaluation | `DESIGNED_NEEDS_QA` | Original anchor `343:601`; desktop family `529:2850`; canonical 1440 `529:2852`; 1280 first fold `529:3075`; desktop states `529:3299`; mobile family `530:809`; full 390 `530:811`; 375 first fold `531:3987` | Review ready: full 1440, 1280 first fold and state contract | Review ready: full 390 and 375 first fold | **Detected — legacy/partial** | Published review, key facts, terms, freshness | Licensing uncertainty, affiliate disclosure, 18+, methodology | P0 | Await visual approval; preserve the original anchor and approved Public Shell. Frontend parity remains separate. |
| B05 | Commercial discovery | Casino profile unavailable / restricted | `/casino/[slug]` | Explain unavailable, unpublished or ineligible content | `DESIGNED_NEEDS_QA` | Desktop contract `529:3299`; visit unavailable `531:3984`; profile unavailable `531:3985`; redirect failure `531:3986` | Review-ready fail-closed contract | Review-ready 390 states | **Detected — partial** (`notFound`) | Publication/eligibility reason | Must not leak or redirect to an ineligible operator | P0 | Await visual approval; keep editorial availability separate from commercial-route eligibility. |
| B06 | Commercial discovery | Bonuses catalogue | `/bonuses` | Compare bonus structures and material terms | `DESIGNED_NEEDS_QA` | `299:786` | Designed | Missing | **Detected — legacy/partial** | Offer feed, terms, expiry, eligibility | Affiliate, terms, uncertainty, update date | P0 | Add mobile, filter/state contract, long terms and availability QA. |
| B07 | Commercial discovery | Bonus guide / explainer | `/bonus-guide` | Teach terms before commercial selection | `MISSING` | — | Missing | Missing | **Detected — legacy** | Editorial content | Neutral education and disclosures | P1 | Design neutral article template after launch blockers. |
| B08 | Commercial discovery | Bonus unavailable / expired | `/bonuses` or offer context | Prevent stale referral and explain recovery | `MISSING` | — | Missing | Missing | **Not detected** | Offer lifecycle and expiry reason | No expired CTA; material terms retained for explanation | P0 | Add representative expired/unavailable variants to the Bonuses family. |
| B09 | Commercial discovery | Best Offers shortlist | `/best-offers` | Curated, explainable shortlist | `DESIGNED_NEEDS_QA` | `310:224` | Designed | Missing | **Detected — partial/preview** | Ranked eligible offers and freshness | Methodology, affiliate, eligibility, illustrative labelling | P0 | Add mobile, no-eligible state, ranking explanation and production-data annotations. |
| B10 | Commercial discovery | Comparison selection and result | Planned `/compare` | Compare selected eligible operators/offers | `MISSING` | — | Missing | Missing | **Not detected** | Comparable schema and selection state | Like-for-like terms, market eligibility, affiliate disclosure | P0 | Design selection, 2–3 column desktop and mobile stacked/table contract. |
| B11 | Commercial discovery | No comparable results | Planned `/compare` | Honest recovery when selections cannot be compared | `MISSING` | — | Missing | Missing | **Not detected** | Compatibility and eligibility reasons | No misleading fallback | P0 | Add to Comparison family as a reusable result state. |
| B12 | Commercial discovery | Country / market landing | Planned | Market-specific commercial entry | `BLOCKED` | — | Missing | Missing | **Not detected** | Approved market catalogue and trusted resolver | RFC-001/current launch enforcement unresolved | P1 | Do not create market claims now; revisit after jurisdiction decision and approved content. |
| B13 | Commercial discovery | Affiliate disclosure and outbound action | Commercial cards/profiles | Make commercial relationship and destination explicit | `PARTIAL` | Disclosure fragments within `299:786`, `310:224`, `325:323`, `343:601`; Casino Profile desktop contract `529:3299`; mobile confirmation `531:3983`; failure `531:3986` | Casino Profile contract complete; other families partial | Casino Profile confirmation/failure complete; other families missing | **Detected — partial** | Approved tracking destination and offer | Disclosure, eligibility, external-destination clarity | P0 | Reuse the Casino Profile fail-closed pattern across Bonuses, Best Offers and Comparison without inventing operator facts. |
| C01 | Programme | Mission 01 | `/program` | Build the Moment Map before registration | `DESIGNED_NEEDS_QA` | `409:699`–`412:1004` (board `407:699`) | 8 screens | Missing | **Detected — active** | Mission 01 APIs/session | +60 XP; no commercial targeting/linkage | P0 | Preserve approved flow; add representative mobile flow and state QA. |
| C02 | Programme / Identity | Registration after earned result | `/program` state | Persist earned result and claim reward | `DESIGNED_NEEDS_QA` | `413:963`, `413:1002` | Designed | Missing | **Detected — active** | Better Auth sign-up and claim redemption | Separate required terms from optional marketing; privacy notice | P0 | Add 390/375 layouts, validation, duplicate-account and claim recovery. |
| C03 | Programme / Identity | Returning-user sign-in | `/program?auth=sign-in` | Resume private Programme | `PARTIAL` | `413:1002`, fields `404:38`–`404:73` | Shared form only | Missing | **Detected — active** | Better Auth email/password | Avoid implying unsupported recovery | P0 | Create explicit returning state and mobile; keep within configured auth contract. |
| C04 | Programme / Identity | Account claim error / recovery | `/program` state | Recover without losing earned Mission 01 work | `PARTIAL` | Field errors `404:53`, `404:73` | Component errors only | Missing | **Detected — active/partial** | Session and claim error codes | Preserve private artefact; no reward duplication | P0 | Design full-screen/session recovery paths and retry rules. |
| C05 | Programme | Personal Control Dashboard after M01 | `/program` state | Show saved artefact, progress and next mission | `DESIGNED_NEEDS_QA` | `413:1044` | Designed | Missing | **Detected — active** | Dashboard service | Private/commercial data separation | P0 | Add mobile dashboard and long-content/state QA. |
| C06 | Programme | Programme map / My Plan | `/program` state | Orient user across the approved mission path | `PARTIAL` | Path `403:62`; dashboard fragments | Compact path only | Missing | **Detected — active/partial** | Mission registry/status | Do not design Missions 05–10 content | P0 | Complete map navigation using titles/status only; Mission 05 remains placeholder. |
| C07 | Programme | Mission 02 | `/program` state | Build the 7-day goal | `DESIGNED_NEEDS_QA` | `419:1058`–`422:1439` | 8 screens | Missing | **Detected — active** | Mission 02 service and artefact | +80 XP and First Plan achievement | P0 | Add representative mobile screens and validation/error QA. |
| C08 | Programme | Dashboard after M02 | `/program` state | Reflect 140 XP, artefacts and Mission 03 | `DESIGNED_NEEDS_QA` | `428:1532` | Designed | Missing | **Detected — active** | Dashboard/rewards | Truthful progress and reward totals | P0 | Add mobile and state QA. |
| C09 | Programme | Mission 03 | `/program` state | Urge literacy and early signal | `DESIGNED_NEEDS_QA` | `449:1413` | 8 screens | Missing | **Detected — active** | Mission 03 service/artefact | +90 XP; “Not now” remains valid | P0 | Add required mobile acceptance coverage and error QA. |
| C10 | Programme | Dashboard after M03 | `/program` state | Reflect 230 XP and Mission 04 | `DESIGNED_NEEDS_QA` | `456:1699` | Designed | Missing | **Detected — active** | Dashboard/rewards | Private artefact handling | P0 | Add mobile and state QA. |
| C11 | Programme | Mission 04 — Build one boundary | `/program` state | Create one executable boundary | `DESIGNED_NEEDS_QA` | `468:1753` | 9 screens | Missing | **Detected — active** | Mission 04 service/boundary artefact | +100 XP, Boundary Built; Help path protected | P0 | Add required mobile acceptance coverage, validation and protected-edit QA. |
| C12 | Programme | Dashboard after M04 / M05 placeholder | `/program` state | Reflect 330 XP, 4/10 and next placeholder | `DESIGNED_NEEDS_QA` | `470:358` | Designed | Missing | **Detected — active** | Dashboard registry | Do not design Mission 05 itself | P0 | Add mobile; verify placeholder is disabled and contains no speculative mission content. |
| C13 | Programme | Paused Programme state | `/program` state | Respect a user pause without pressure | `MISSING` | — | Missing | Missing | **Not detected** | Pause state contract | No commercial targeting from pause; protected Help available | P1 | Define only after confirming current pause capability; no affiliate personalisation. |
| C14 | Programme | Completed Programme state | `/program` state | Completion summary after Mission 10 | `NOT_REQUIRED_FOR_INITIAL_LAUNCH` | — | Deferred | Deferred | **Not detected** | Missions 05–10 | Requires later Mission RFCs | OUT OF SCOPE | Do not design now. |
| C15 | Programme | Reward / achievement feedback | `/program` state | Recognise educational/control progress | `DESIGNED_NEEDS_QA` | `402:63`, `411:38`, `417:51`, `465:10`, `465:15` plus result screens | Designed | Missing | **Detected — active** | Reward ledger and idempotency | Never reward gambling/commercial action | P0 | Add mobile/announcement/accessibility and failure-state contract. |
| C16 | Programme | Artefact edit / delete states | `/program` overlay/state | User control over private work | `PARTIAL` | Edit-protection fragments `469:223`, `470:237` | Flow fragment only | Missing | **Detected — edit only** | Artefact update/delete contract | Confirmation, privacy and audit behaviour | P0 | Design edit, destructive confirmation, success and failure; do not imply account deletion. |
| C17 | Programme | Session expired / error / recovery | `/program` state | Continue safely after auth/network/session failure | `MISSING` | — | Missing | Missing | **Detected — generic errors only** | Session/claim/mission error codes | No data loss or duplicate reward promise | P0 | Create reusable recovery state and representative Programme placement. |
| D01 | Protected Help | Protected Help landing, header/footer and layout | Planned protected route group | Neutral support environment without commercial stimuli | `PARTIAL` | Legacy/urgent-context panel definitions `289:131`, `503:2832`; Footer links `514:38`, `514:41` | Component definitions only; no standalone panel on active public screens | Missing | **Detected — route content under global commercial shell** | Help content registry | No casino, bonus, affiliate or commercial targeting | P0 | Create dedicated protected shell first within this family; mobile required. Retain prominent panels only for approved urgent/protected contexts. |
| D02 | Help | Responsible Gambling Hub | `/responsible-gambling` | Route users to relevant support/control information | `MISSING` | — | Missing | Missing | **Detected — legacy** | Editorial help content | Must render in protected shell | P0 | Redesign desktop/mobile using protected layout and neutral exit. |
| D03 | Help | Pause / support route | `/responsible-gambling/[slug]` | Practical pause and support guidance | `MISSING` | — | Missing | Missing | **Detected — partial/legacy** | Article content and links | Protected, no commercial CTA | P0 | Define representative template/state; verify external links. |
| D04 | Help | Self-exclusion information | `/responsible-gambling/[slug]` | Explain scope and next actions neutrally | `MISSING` | — | Missing | Missing | **Detected — partial/legacy** | Approved jurisdiction-neutral content | No operator promise; clear limitations | P0 | Design protected article variant and resource actions. |
| D05 | Help | External support/resource detail | `/responsible-gambling/[slug]` | Explain external service before leaving SevenBet | `MISSING` | — | Missing | Missing | **Detected — legacy** | Approved resource directory | Destination, region and urgency accuracy | P0 | Add external resource card/detail and failure/unavailable state. |
| D06 | Help | Urgent support state | Protected Help context | Prioritise immediate neutral assistance | `MISSING` | — | Missing | Missing | **Not detected** | Approved urgent-resource content | Avoid clinical/emergency claims beyond approved copy | P1 | Design only with approved content; use prominent neutral exit. |
| D07 | Help | Confirmation / exit without commercial CTA | Protected Help context | Confirm transition or completion safely | `MISSING` | — | Missing | Missing | **Not detected** | External destination/status | No commercial recommender or referral | P0 | Add to protected family as representative success/failure state. |
| E01 | Learning Center | Catalogue | `/learn` | Discover neutral learning content | `MISSING` | — | Missing | Missing | **Detected — legacy** | Learning taxonomy/content | Separate education from promotion | P1 | Design desktop/mobile catalogue and topic navigation. |
| E02 | Learning Center | Protected-control article detail | `/responsible-gambling/[slug]` | Long-form control/help education | `DESIGNED_NEEDS_QA` | `372:648` | Designed | Missing | **Detected — legacy/partial** | Article body, evidence, review metadata | Protected shell and no commercial CTA | P0 | Add mobile, source states, long-content and protected-shell QA. |
| E03 | Learning Center | Neutral commercial education article | `/learn/[category]/[slug]` | Teach evaluation without acting as an offer page | `MISSING` | — | Missing | Missing | **Detected — legacy** | Learning article content | Disclosures where commercial examples appear | P1 | Adapt article template without protected-only constraints. |
| E04 | Learning Center | Category / topic page | `/learn/[category]` | Browse a coherent topic | `MISSING` | — | Missing | Missing | **Detected — legacy** | Taxonomy | Accurate labels and content status | P1 | Design with catalogue family. |
| E05 | Learning Center | Article search/filter/no-results | `/learn` state | Find content and recover from no results | `MISSING` | — | Missing | Missing | **Not detected** | Search/filter contract | Protected/commercial result labelling | P2 | Defer until search is accepted; category filtering may ship first. |
| E06 | Learning Center | Evidence / source states | Article detail | Show source, review date and uncertainty | `PARTIAL` | Editorial meta `372:663`; Programme evidence `399:52` is not interchangeable | Partial | Missing | **Detected — partial** | Source metadata | Citation accuracy; do not reuse Programme evidence semantics blindly | P0 | Create article-specific evidence/source component with missing/stale states. |
| E07 | Learning Center | Related reading and FAQ pattern | Article/detail routes | Continue learning without coercion | `PARTIAL` | Related row `369:38` | Component only | Missing | **Detected — legacy/partial** | Related-content and FAQ data | Protected pages must keep related content neutral | P1 | Add responsive pattern and protected/commercial variants. |
| F01 | Identity / account | Account entry, profile and settings | `/program` header; planned settings | Return to private Programme and manage account | `PARTIAL` | Programme header `388:63` | Account state only | Missing | **Detected — Programme entry only** | Better Auth session; no settings route detected | Privacy and data-separation explanation | P0 | Complete account entry in shell; do not invent settings capability. Track settings as later contract work. |
| F02 | Identity / account | Forgot / reset password | Not configured | Recover account access | `BLOCKED` | — | Blocked | Blocked | **Not detected** | Better Auth reset capability is not configured | Security and email-delivery policy | P1 | Do not design as supported until the auth contract is approved/configured. |
| F03 | Identity / account | Privacy controls | Planned | Explain and control Programme/private data | `MISSING` | — | Missing | Missing | **Not detected** | Account/privacy preference contract | RFC-008 data separation and user rights | P0 | Design only controls backed by current contract; start with explanation and request paths. |
| F04 | Identity / account | Data export request | Not configured | Request a portable copy | `BLOCKED` | — | Blocked | Blocked | **Not detected** | Export capability not detected | Identity verification, delivery and retention | P1 | Require an approved capability contract before design. |
| F05 | Identity / account | Account deletion request | Not configured | Request account/private-data deletion | `BLOCKED` | — | Blocked | Blocked | **Not detected** | Account deletion capability not detected | Identity verification, legal retention and irreversible confirmation | P1 | Do not imply immediate deletion; require product/engineering/compliance contract. |
| F06 | Identity / account | Account request confirmation/error | Not configured | Close export/deletion/settings actions safely | `BLOCKED` | — | Blocked | Blocked | **Not detected** | Depends on F04/F05 capabilities | Truthful status and support escalation | P1 | Design with the approved request capability, not before it. |
| G01 | Legal / trust | Affiliate Disclosure page | `/affiliate-disclosure` | Explain commercial relationship | `MISSING` | — | Missing | Missing | **Detected — legacy** | Legal copy/version | Affiliate disclosure accuracy | P0 | Design readable desktop/mobile legal template and contextual links. |
| G02 | Legal / trust | Ranking Methodology | `/methodology` | Explain Editor Score and ranking limits | `MISSING` | — | Missing | Missing | **Detected — legacy** | Editorial methodology/version | No unsupported testing or guarantee claims | P0 | Design trust template and link from all ranking surfaces. |
| G03 | Legal / trust | Editorial Policy | Planned | Explain editorial governance and corrections | `MISSING` | — | Missing | Missing | **Not detected** | Approved editorial policy | Independence, conflicts and correction process | P1 | Create only after policy content is approved. |
| G04 | Legal / trust | Responsible Gambling Policy | `/responsible-gambling` content | State safety approach and boundaries | `MISSING` | — | Missing | Missing | **Detected — legacy/hub** | Approved policy copy | Protected-shell rules | P0 | Separate policy role from help navigation; use protected presentation. |
| G05 | Legal / trust | Privacy Policy | `/privacy` | Explain data processing and rights | `MISSING` | — | Missing | Missing | **Detected — placeholder** | Actual data inventory/processors/retention | Legal approval; Programme separation | P0 | Do not polish placeholder into production truth; design template and mark content blocked. |
| G06 | Legal / trust | Terms and Conditions | `/terms` | State service terms | `MISSING` | — | Missing | Missing | **Detected — placeholder** | Approved terms/versioning | Legal approval, eligibility and service limitations | P0 | Design template; content remains launch blocker until approved. |
| G07 | Legal / trust | Cookie / consent surface | Global | Capture only required consent choices | `BLOCKED` | — | Blocked | Blocked | **Not detected** | Cookie/analytics inventory and consent contract | Applicable consent law and categories | P0 | Do not design speculative categories; unblock with actual inventory/legal decision. |
| G08 | Legal / trust | Contact page | Planned `/contact` | Legitimate support/editorial/business contact path | `MISSING` | — | Missing | Missing | **Not detected** | Contact channels and routing | Privacy, response expectations, no urgent-help confusion | P1 | Define approved contact routes before design. |
| G09 | Legal / trust | About and global 18+ notices | `/about`; global shell | Explain SevenBet and persistent eligibility boundary | `PARTIAL` | Footer `289:137`; no About screen | Notice fragment | Missing | **Detected — legacy/partial** | Approved company copy | 18+ and affiliate-business clarity | P0 | Complete 18+ shell treatment; About page can follow P0 legal templates. |
| G10 | Legal / trust | Restricted-jurisdiction explanation | Contextual/global | Explain why commercial content is unavailable | `MISSING` | — | Missing | Missing | **Not detected** | Approved reason codes | RFC-001/jurisdiction and legal copy | P0 | Add generic explanation to market-state family; avoid live location assertion. |
| H01 | System | 404 | Global | Recover from missing/unpublished routes | `MISSING` | — | Missing | Missing | **Detected — implemented** | Route/content status | Avoid unsafe commercial fallback in protected context | P0 | Design reusable Tilt-Locked public and protected-safe variants. |
| H02 | System | 500 / general error | Global | Retry without exposing technical detail | `MISSING` | — | Missing | Missing | **Detected — implemented** | Error boundary/reset | No misleading success/availability message | P0 | Design representative global and discovery error variants. |
| H03 | System | Maintenance / degraded | Global | Communicate planned/unplanned outage | `NOT_REQUIRED_FOR_INITIAL_LAUNCH` | — | Deferred | Deferred | **Not detected** (generic global error only) | Operational status source | Honest status and safe Help access | P2 | Reuse system-state pattern later unless operations require a dedicated state. |
| H04 | System | Loading skeleton principles | Representative public/Programme screens | Preserve structure and reduce uncertainty | `PARTIAL` | Casinos desktop `520:2742`; mobile `521:317` | Representative Casinos state designed | Representative Casinos first-fold state designed | **Not detected** on public routes | Route/data loading boundaries | Do not show fictitious offer facts while loading | P0 | Casinos preserves search/filter/card geometry without fictitious facts; Dashboard representative is still missing. |
| H05 | System | Generic empty / content under review | Reusable | Explain missing or unpublished content | `MISSING` | — | Missing | Missing | **Detected — partial** (discovery empty card) | Content lifecycle/reason | No unpublished fact leakage; neutral alternatives | P1 | Create reusable state component; use representative screen rather than many full frames. |
| H06 | System | Offline / network recovery | Client state | Recover from interrupted actions | `NOT_REQUIRED_FOR_INITIAL_LAUNCH` | — | Deferred | Deferred | **Not detected** | Network and retry behaviour | Avoid duplicate Programme rewards/actions | P2 | Cover Programme-specific retry in C17 first; generic offline can follow. |

## Gap analysis

### Design gaps

- The launch journey has an approved responsive Public Shell, approved revised `/10-steps` and Casinos families, plus a review-ready Casino Profile family, but no comparison family, dedicated Protected Help shell, or legal-system template set.
- Casino Profile now establishes available, visit-unavailable, unpublished/archived, outbound-confirmation and redirect-failure treatments. Applying the pattern consistently to Bonuses, Best Offers and Comparison remains outstanding.
- The Programme is the most mature product area, but its state coverage is incomplete around claim recovery, session expiry, pause, artefact deletion and explicit returning sign-in.
- Active Figma has no legacy/superseded frames to rescue. Existing older frontend pages should be treated as implementation debt, not visual references.

### Mobile and responsive gaps

- Figma page `06 — Screens / Mobile` contains approved Public Shell family `492:2268`, approved revised `/10-steps` family `502:2412`, approved Casinos family `521:312` and review-ready Casino Profile family `530:809`; the remaining launch families still lack active mobile frames.
- Header, Footer and account states have approved 1440, 1280, 390×844 and 375×667 evidence; the generic availability treatment remains blocked as live product authority. Route-level Home and downstream families still need their own responsive QA.
- Full 390×844 mobile frames are still required for Home, Bonuses, Best Offers, Comparison, Dashboard, Protected Help and registration/sign-in. Casinos and Casino Profile now have full 390 families plus representative 390×844 states.
- Each family also needs a documented 1280 laptop contract and 375×667 small-mobile behaviour, including safe areas, long terms, sticky actions, filters, comparison overflow and focus order.

### State and interaction gaps

- The Public Header now has 7 reaction nodes covering Menu/Close and Escape recovery; Motion & Prototype remains empty and other journeys lack prototype coverage.
- Casinos empty, generic restricted/unknown, unavailable and error states are approved; Casino Profile fail-closed states are review ready. Equivalent cross-family states, expired offers, claim/session recovery and protected exits remain absent or fragmentary.
- Casino Profile now has a governed outbound confirmation/failure representative, but the pattern is not yet propagated across other commercial families.
- Ready for Dev is empty, so no responsive contract, dependency note or implementation annotation is consolidated for handoff.

### Frontend parity gaps

- The global `SiteChrome` renders the same public commercial header/footer around Protected Help content; this conflicts with the planned protected shell.
- The frontend `/10-steps` remains an older visual implementation, still includes the standalone Help block and stale reward copy (`+20 XP`) that conflicts with the approved Mission 01 reward of +60 XP. The Figma family corrects the design contract but no frontend code was changed.
- Casinos, Casino Profile, Bonuses, Best Offers, Learning, Help and legal routes exist, but most do not match the active Tilt-Locked Figma direction or complete state coverage.
- `/best-offers` is a limited market preview rather than the designed full family.
- No public comparison route, country landing, contact route, account settings/privacy-control route, or password recovery route was detected.
- Better Auth currently configures email/password sign-up/sign-in only; password recovery, account export and account deletion must not be presented as supported capabilities.

### Compliance and data gaps

- RFC-004 approves Great Britain as the first intended launch market, but RFC-001 remains proposed and live commercial jurisdiction enforcement is not approved. Market designs must remain generic and explicitly non-live until that authority exists.
- Production operator facts, licences, offers and terms are not available as design truth. Commercial mock content must carry: `ILLUSTRATIVE — REQUIRES BACKEND, MARKET, EDITORIAL, COMPLIANCE AND COMMERCIAL APPROVAL.`
- Privacy and Terms routes are placeholders and cannot be treated as approved production legal content.
- Protected Help needs an independent shell with no casino/bonus CTA, affiliate referral or commercial card inside protected content.

## Initial-launch scope

### P0 — required for the first commercial vertical slice

1. Public shell completeness: responsive header/footer, account entry, 18+, generic market/restricted state.
2. `/10-steps` acquisition landing and direct Programme explainer relationship.
3. Casinos family: catalogue, filters, loading, empty, restricted/unknown, mobile.
4. Casino Profile family: available, unavailable/restricted, outbound disclosure, mobile.
5. Bonuses family: catalogue, terms, expired/unavailable, mobile.
6. Best Offers family: shortlist, methodology/eligibility, no-eligible, mobile.
7. Comparison family: selection, results, no-comparable, mobile.
8. Programme completion through Mission 04: mobile acceptance, claim/session recovery, map, rewards, artefact control; Mission 05 remains a placeholder only.
9. Protected Help family and protected article mobile completion.
10. Launch identity/privacy entry points supported by the current Better Auth contract.
11. Affiliate Disclosure, Methodology, Privacy, Terms, responsible-gambling policy treatment and representative system states.

### P1 — soon after launch

- Bonus guide, country landing after jurisdiction approval, urgent support, Learning catalogue/category/article templates, editorial policy, contact, account export/deletion only after capability approval, and full related-reading/FAQ patterns.

### P2 — deferrable

- Learning search, dedicated maintenance state and generic offline system treatment after Programme-specific recovery is complete.

### Out of scope

- Global search, completed-Programme experience, Missions 05–10, new markets, speculative auth/account capabilities, jurisdiction engine implementation, affiliate tracking implementation and production operator content without approved data.

## Recommended P0 creation order

1. **Public shell completeness — APPROVED** — Header and revised Footer are approved across desktop, laptop and mobile states. The shell is the visual and navigation source of truth for every subsequent public P0 family.
2. **`/10-steps` campaign landing — APPROVED** — complete approved desktop/mobile family and clear entry to Mission 01, revised so the final CTA flows directly into the shared Footer.
3. **Casinos catalogue family — APPROVED** — filters, loading, empty, restricted/unknown and mobile are visually approved; live market authority remains blocked separately.
4. **Casino Profile family — REVIEW READY** — available/unavailable, outbound disclosure/failure, desktop/laptop and mobile; awaiting visual approval.
5. **Bonuses family** — catalogue, material terms, expired/unavailable and mobile.
6. **Best Offers family** — shortlist, methodology/eligibility, no eligible offers and mobile.
7. **Comparison family** — selection, results, no comparable results and mobile.
8. **Programme QA through Mission 04** — mobile representatives and missing recovery/control states; no redesign of sound desktop work.
9. **Protected Help family** — dedicated shell, hub, support/resource detail and neutral exit.
10. **Identity/privacy launch surfaces** — only currently supported account entry/sign-in plus truthful privacy request paths.
11. **Learning and article templates** — protected and neutral variants, evidence and related content.
12. **Legal/trust/system family** — finish P0 legal templates and reusable 404/500/loading/empty states.

## First completed action — PUBLIC SHELL APPROVED

The first screen family is **Public shell completeness** because every public acquisition, commercial, learning and legal route depends on it. It is designed in Figma as family `492:2268`, with the existing Header set extended at `289:43`, the Footer converted to responsive set `488:100`, and generic Availability Notice set `489:70`. The user visually approved the family on 2026-08-04 and visually approved the 2026-08-05 Footer revision adding the compact protected-Help link. Header and Footer desktop, laptop and mobile states are approved. The generic Availability Notice remains a designed treatment without live jurisdiction authority.

### Family completion contract

- Desktop: 1440 canonical and documented 1280 behaviour.
- Mobile: 390×844 representative frames and 375×667 small-mobile notes.
- States: signed out, signed in/Programme entry, mobile closed/open, focus/keyboard, generic commercial unavailable/unknown message, protected-route handoff rule.
- Components: extend `SevenBet / Public Header` (`289:43`) and `SevenBet / Public Footer` (`289:137`) only where semantics match; do not duplicate them.
- Content: no production market detection claim; any market example is explicitly illustrative.
- QA: token use, auto layout, text constraints, long labels, tap targets, focus order, overflow, safe areas, disclosures and no detached instances without reason.

### Completion report — 2026-08-04

- Desktop: canonical 1440 frame `492:2283`; signed-in 1280 frame `494:116`.
- Mobile: 390×844 signed-out `493:57`, menu-open `493:78`, signed-in `493:115`; 375×667 unavailable state `493:131`; full mobile footer instance `494:151`.
- Components: Header set `289:43` now has 8 variants; Footer set `488:100` has 2 variants; Availability Notice set `489:70` has 4 variants.
- States: signed out, signed in, menu closed/open, unknown availability, unavailable commercial listings, desktop/mobile footer and protected Help handoff.
- Interaction: 7 reaction nodes; Menu/Close uses 240ms Smart Animate; Escape closes open mobile variants.
- Accessibility QA: all audited interactive targets are at least 44px; focus-order contract is documented; no horizontal mobile navigation scroll.
- Structural QA: approved fonts only (`Archivo Black`, `Archivo`, `Instrument Serif`); 11 linked instances, 0 detached; 0 placeholder texts; 0 remaining text-bound defects.
- Data/compliance: generic states make no live location claim and carry the required illustrative approval marker. RFC-001/live market authority remains blocked.
- Approval: desktop `492:2283`, laptop `494:116`, mobile `493:57`, `493:78`, `493:115`, small-mobile `493:131` and full mobile footer `494:151` are visually approved. These representative node IDs are unchanged.
- Downstream rule: every subsequent public P0 screen family must reuse this Public Shell as its shared visual and navigation source of truth; it must not create a competing header, footer or public navigation model.
- Help hierarchy revision: Public Footer components `289:137` and `488:69` retain their IDs and add approved 44px `Open Help` link rows `514:38` and `514:41`, with text nodes `514:40` and `514:43`. All inherited Footer instances use `https://sevenbet-next.vercel.app/responsible-gambling`. The Header remains unchanged and approved.

## Second completed design action — `/10-STEPS` APPROVED

The **`/10-steps` acquisition landing** is designed as desktop family `502:2238` and mobile family `502:2412`. It reuses the approved Public Header and revised Public Footer, makes Mission 01 the only body conversion action, keeps Casinos, Bonuses and Best Offers in the shared shell only, and makes the private-start / post-Mission-01 account boundary explicit. The 2026-08-05 revision removes the standalone Protected Help panel so the final Programme action flows directly into the Footer `CONTROL & SUPPORT` link.

### Responsive and state contract

- Desktop: signed-out full landing at 1,440 (`502:2240`) and 1,280 (`502:2241`).
- Mobile: full 390 signed-out landing (`502:2414`), 390×844 returning signed-in first fold (`502:2415`) and 375×667 signed-out first fold (`502:2416`).
- Inherited shell states: mobile menu open/closed, account and market/availability states remain governed by approved Public Shell family `492:2268` and are not duplicated.
- Programme states: Mission 01 is available; Missions 02–10 are visible as upcoming titles/status only; account creation follows Mission 01; XP, progress and next Mission remain server-owned.
- Navigation: the body has one Programme transition to Mission 01 or My Programme. Commercial discovery remains accessible through the shared Header/Footer only.

### Components and QA — 2026-08-04

- Reused: Public Header components `289:25`, `486:76`, `486:120`; revised Public Footer components `289:137`, `488:69`; Programme Theatre `289:72`; Program Path Node `403:62`; pending Mission 01 recognition `411:38`; desktop Evidence cards `289:121`, `289:125`; Core primary button `287:13`.
- Retained but no longer placed on active public screens: desktop Protected Help `289:131` and mobile Protected Help `503:2832`. These definitions remain available only for a future approved urgent/protected context.
- Added to the shared Footer: desktop link row/text `514:38` / `514:40`; mobile link row/text `514:41` / `514:43`. Both 44px rows open `https://sevenbet-next.vercel.app/responsible-gambling`.
- Visual QA: full desktop, laptop and mobile layouts plus both final Programme action frames were inspected. The final action now remains the dominant closing CTA and flows directly into the lower-emphasis Footer support link.
- Structural QA: 64 linked instances across the desktop/mobile `/10-steps` families after removing three Help instances, 0 remaining standalone Help instances or matching legacy text on the active screen pages, 0 direct-child overflow on eight audited public desktop frames and the full mobile frame, and no audited Help target below 44 px.
- Approval: `APPROVED`. The family was revised after user feedback and visually re-approved on 2026-08-05; family labels `502:2239` and `502:2413` now read `APPROVED`. Family/frame node IDs are unchanged.
- Frontend gap: the current route still uses the legacy shell, standalone Help block and in-body commercial bridge, has different mission copy, and displays stale `+20 XP`; no frontend code was changed in this design/documentation action.

## Third completed design action — CASINOS FAMILY APPROVED

The **`/casinos` discovery family** is approved in Figma as desktop family `520:2496` and mobile family `521:312`. The original 1,440 Tilt-Locked anchor `325:323` remains untouched and is retained as the visual source; the family composes responsive and state representatives around it while reusing the approved Public Shell. The user visually approved the family on 2026-08-05.

### Responsive and state contract

- Desktop: canonical full 1,440 frame `520:2498`, representative 1,280 first fold `520:2741`, and desktop state contract `520:2742`.
- Mobile: full 390 catalogue `521:314`; 390×844 filter-open `521:315`, filter-applied `521:316`, loading `521:317` and no-matches `521:318`; availability/error state matrix `521:319`; 375×667 first fold `521:320`.
- Ordering: search → sort/filter controls → removable active filters → result count → cards. Desktop retains a full-width command-centre model; mobile uses a dedicated filter sheet with persistent Reset and Show results actions.
- States: populated; filters open and applied; loading; no matches; no eligible visit actions; availability unknown; commercial listings unavailable/restricted; load error.
- Safety: published editorial review may remain readable without a visit action; commercial actions appear only for eligible results; empty results never substitute an ineligible operator; market states are explicitly illustrative and do not claim live jurisdiction authority.

### Components and QA — 2026-08-05

- Reused: responsive Header set `289:43`; revised Footer set `488:100`; mobile Header `486:82`; mobile Footer `488:69`; Review Signal `320:5`; Filter Chip set `321:6`; Review Card `322:2`; Featured Review `324:8`; Filter Option set `332:548`; desktop FAQ Row `298:65`; Availability set `489:70`; Core Button set `287:43`.
- New screen-specific composition only: mobile catalogue sections, filter sheet, skeletons, empty/error cards and mobile FAQ rows. No new reusable component set or frontend component was created.
- Visual QA: canonical desktop, desktop state board, full 390, filter-open/applied, loading, no-matches, state matrix and 375 first fold were inspected. Approved Tilt-Locked fonts remain Archivo, Archivo Black and Instrument Serif; no placeholder nodes were detected.
- Structural QA: canonical 1,440, desktop states and full 390 have no direct-child overflow. Cropping is deliberate only for 1,280 and 375 first-fold representatives and the 390 applied-state viewport. All interactive mobile filter controls and active-filter hit areas are at least 44px. Shell instances remain linked to the approved Header/Footer components.
- Approval: `APPROVED`. Family labels `520:2497` and `521:313` now read `APPROVED`; all family/frame node IDs are unchanged.
- Frontend gap: the current route provides search, six facets, eligibility flags, five sort modes, 12/24/48 page sizes, empty and error handling, but retains legacy Inter styling and does not implement this responsive Tilt-Locked composition. Country remains a user preference rather than trusted GEO; no application code changed.

## Fourth completed design action — CASINO PROFILE FAMILY REVIEW READY

The **`/casino/[slug]` profile family** is ready for visual review in Figma as desktop family `529:2850` and mobile family `530:809`. The original 1,440 Northstar anchor `343:601` remains unchanged and supplies the editorial hierarchy; the new family adds responsive and fail-closed representatives while reusing the approved Public Shell. This status is `DESIGNED_NEEDS_QA`, not approval.

### Responsive and state contract

- Desktop: canonical full 1,440 profile `529:2852`, representative 1,280 first fold `529:3075`, and desktop state contract `529:3299`.
- Mobile: full 390 profile `530:811`; outbound confirmation `531:3983`; visit unavailable while review remains readable `531:3984`; unpublished/archived profile unavailable `531:3985`; redirect failure `531:3986`; 375×667 first fold `531:3987`.
- Ordering: identity → score and short verdict → eligible offer → decision bar → facts → offer/evidence → full verdict and methodology → FAQ/final eligible offer → approved Footer.
- States: available; affiliate route unavailable; licence/market not confirmed; unpublished/archived profile unavailable; outbound confirmation; redirect failure.
- Safety: review availability and commercial-route eligibility are independent. Operator actions appear only for an eligible internal `/r/<slug>` route; raw destination URLs are never exposed; an unpublished/archived profile renders no review content or legacy fallback; protected Help and neutral navigation remain available.

### Components and QA — 2026-08-05

- Reused: Public Header set `289:43`; mobile Header `486:82`; revised Public Footer set `488:100` and mobile Footer `488:69`; Core primary/ghost buttons; Key Fact Row `342:38`; FAQ Row `298:65`; the original desktop composition `343:601` as the retained visual anchor.
- New screen-specific composition only: mobile long-form sections, desktop state board and mobile confirmation/unavailable/failure frames. No reusable component set or frontend component was created.
- Reference lock: preserve the existing SevenBet Tilt-Locked profile and RFC-007. Borrow only the sticky action-rail discipline, compact score/evidence summary and explicit redirect interstitial from researched product references; reject ecommerce imagery, purchase language, invented user-review counts, new palette roles and a permanent sidebar.
- Visual QA: canonical desktop, 1,280 first fold, desktop state board, full 390, all four 390 state frames and 375 first fold were inspected. Two detected mobile text collisions were corrected before handoff.
- Structural QA: canonical 1,440, desktop state contract, full 390 and fixed-height state frames have no direct-child overflow. Cropping is deliberate only for the 1,280 and 375 first-fold representatives and the dimmed long review behind the outbound sheet. Approved Archivo/Archivo Black families are used; linked Header/Footer and Core action instances remain intact; audited actions are at least 44px.
- Frontend gap: the current route has a legacy/partial published-review implementation and `notFound` handling, but not this responsive Tilt-Locked composition or the complete confirmation/failure contract. Trusted live jurisdiction authority remains not detected. No application code was changed.
- Review status: family labels `529:2851` and `530:810` read `REVIEW READY`. Visual approval is pending; node IDs above are the handoff references.

## Next screen family

The next P0 candidate after Casino Profile approval is the **Bonuses family**: catalogue, material terms, expired/unavailable treatment, eligibility and mobile states.

## Blockers and decisions not to infer

- Live market eligibility and enforcement remain blocked pending the applicable jurisdiction decision; design may express generic unavailable/unknown states but not claim live detection.
- Password recovery, account export and account deletion are not detected capabilities and must not be designed as functioning flows.
- Privacy, Terms, cookie categories, production operator data and urgent-support copy require approved legal/compliance/data inputs.
- Mission 05 may appear only as the approved current/next navigation placeholder. No Mission 05 content, reward, order or prerequisite is to be designed.

## Update protocol

After each completed family, update this document with node IDs, desktop/mobile coverage, states, component changes, dependencies and QA evidence. Update `docs/PROJECT_STATE.md` only after the family is actually complete; do not mark completion while mobile or required states are absent.
