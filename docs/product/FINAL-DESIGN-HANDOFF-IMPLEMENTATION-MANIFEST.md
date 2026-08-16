# Final Design Handoff Implementation Manifest

## Authority and baseline

- **Detected:** implementation branch `codex/final-design-handoff-v1` was created from current `origin/main` at `0c956d0d99c9ac703234e82a0bca3c1d5b3a9167`.
- **Detected:** handoff archive checksum `35cfccb78a3e368e0e58c720ef8ad306c7cebaf4aaf56b42bceb23e44b1a2862` matches pack v1.2.
- **Detected:** all 24 handoff HTML screens, the README, editor support scripts and seven image assets were inventoried. Editor-only `support.js` and `image-slot.js` are references, not runtime dependencies.
- **Approved:** [RFC-034](../06_RFC/RFC-034-Final-Design-Handoff-Public-Site.md) governs this bounded Draft-PR/Preview implementation.

## Reference lock

The supplied screens are the visual and editorial lock. `Foundation Board` supplies tokens and component language; `Hero System` supplies responsive hero rules; `Programme` supplies state presentation; `Index`, `Home Classic`, `support.js` and `image-slot.js` are reference-only. No visual averaging with unrelated products is authorised.

The implementation retains these distinctive choices: paper and near-black fields, acid-yellow action surfaces, Instrument Serif italic display copy, Archivo utility type, oversized editorial hierarchy, rounded 24–28px cards, pill controls, tight borders, offset image compositions, restrained reveal motion and safety-green Help chrome.

## Surface mapping

| Public destination | Handoff authority | Runtime/data authority | State before work |
| --- | --- | --- | --- |
| `/` | Home | existing public home assets and route | Detected, to replace visually |
| `/10-steps` | 10 Steps v2 | static editorial plus Programme navigation | Detected, to replace visually |
| `/program` | Programme | authenticated session, Programme services and mission components | Detected, logic preserved |
| `/login` | Login | existing Auth.js/Google flow and acknowledgement | Detected, logic preserved |
| `/best-offers` | Best Offers | `publicOfferService` | Detected, dynamic values preserved |
| `/casinos` | Casinos | `publicCasinoDiscoveryService` | Detected, dynamic values preserved |
| `/casino/[slug]` | Casino Review | public casino profile/review DTO | Detected, dynamic values preserved |
| `/bonuses` | Bonuses | public bonus/offer DTOs | Detected, dynamic values preserved |
| `/bonus-guide` | Article | evidence/source mechanics and FAQ JSON-LD | Detected, retained standalone |
| `/learn` | Learn | published Learn manifest and category query | Detected, category URLs to consolidate |
| `/learn/[category]/[slug]` | Article | published article data/metadata | Detected, retained |
| `/responsible-gambling` | Responsible Gambling | approved safety content and support links | Detected, absorbs retired tools |
| `/help` | Help | protected safety shell and current Help behaviour | Detected, retained and protected |
| trust/legal routes | matching handoff screens | current legal/contact functionality | Detected, to restyle |
| not found | 404 | Next.js not-found handling | Detected, to replace visually |

## Shared implementation rules

- Navigation is exactly `B4GAMBLE · Best Offers · Casinos · Bonuses · Learn · Log in/My Programme · Start Programme/My Programme` on normal public surfaces.
- `10 Steps`, `Help` and `Compare` are not primary-navigation items. Help remains prominent in the safety footer and protected route shell.
- Login and not-found use reduced chrome. Help uses safety-green protected chrome. Programme uses its state-aware shell.
- Static Draft Preview copy follows the handoff verbatim. Live casino, offer, eligibility, ranking, jurisdiction, reward and account values override illustrative handoff values.
- Interactive controls must keep visible focus, semantic labels, keyboard operation, reduced-motion handling and adequate contrast.

## Contextual comparison contract

The shared comparison controller accepts at most three validated public casino slugs. The first selection opens a persistent tray; the second automatically opens a modal/sheet; the third updates that same surface. Users can remove entries, close the comparison while retaining the tray, and reopen it. Desktop uses a centered dialog; small screens use a bottom sheet. The state is limited to public slugs/country/differences and never receives Programme, Help or private data.

Legacy `/compare` requests redirect to `/casinos` with valid state preserved so the controller can initialise. The route is absent from navigation, sitemap and canonical discovery.

## Redirect and discovery matrix

- `/catalog` → `/casinos`
- `/responsible-gaming`, `/self-check`, `/tools/budget-calculator` → `/responsible-gambling`
- `/learn/[category]` → `/learn?category=[category]`
- Help child pages → `/help` or a stable Help anchor
- `/compare` → `/casinos` with approved state preservation

The sitemap retains canonical destinations, published articles, published casino profiles and `/bonus-guide`; it excludes redirect-only destinations and contextual comparison.

## Implementation phases and gates

1. Documentation/RFC and reference lock.
2. Shared tokens, shell, motion and comparison controller.
3. Acquisition, commercial, editorial, safety and legal surface implementation.
4. Route consolidation, SEO, analytics and regression updates.
5. Functional and visual QA, Draft PR and Preview evidence.

Completion requires the gates in RFC-034. Until they pass, all new implementation claims are **Planned**. Production activation is **Not authorised**.

## Final implementation disposition

- **Detected:** shared public chrome, all mapped handoff surfaces, route consolidation, contextual comparison, analytics and responsive presentation are implemented on `codex/final-design-handoff-v1`.
- **Detected:** `/bonus-guide` remains standalone; `/compare` is redirect-only and absent from public navigation, canonical discovery and the sitemap.
- **Detected:** Programme, auth, CMS, affiliate, jurisdiction, privacy, security, rewards and data-service boundaries remain in place; Programme progress and reward calculations remain server-owned.
- **Detected:** functional, responsive, regression, build and screenshot gates passed. Evidence is recorded in [`../02_Product_Design/qa/final-design-handoff/README.md`](../02_Product_Design/qa/final-design-handoff/README.md).
- **Not authorised:** merge to `main`, Production configuration changes or Production deployment.

## Recorded deviations

- The base screenshot environment has no current published casino inventory. Casino, bonus and comparison surfaces therefore show their designed fail-closed state; guarded disposable fixtures verify populated comparison behaviour.
- Anonymous Programme evidence stops at the existing adult/Terms access gate. Post-gate voice, text, Starting Point, claim and dashboard states are covered by Programme/browser tests without bypassing access architecture.
- Protected Help retains verified current resources and omits unsupported prototype response-time and pause-duration promises.
- Privacy includes the current Google identity boundary, controller identity and 13 August 2026 access-contract date.
- Bonus Guide retains the supplied Draft copy verbatim and appends current primary-source records for claims review.
- Static commercial, methodology, operational and privacy claims remain Draft-only where classified in [`FINAL-DESIGN-COPY-CLAIMS-AUDIT.md`](FINAL-DESIGN-COPY-CLAIMS-AUDIT.md).
