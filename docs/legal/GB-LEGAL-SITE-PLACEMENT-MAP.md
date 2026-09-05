# GB Legal Site Placement Map

- **Effective date:** 19 August 2026
- **Status:** PUBLIC LEGAL IMPLEMENTATION: COMPLETE
- **Owner:** Legal / Product / Engineering

This is the placement authority for public legal and trust copy. `Detected` means present in route/component source; `Planned` is limited to the conditional Article 27 field that cannot be published until external particulars exist.

| Surface | Placement and exact user-facing substance | Evidence classification | Source authority |
|---|---|---|---|
| `/privacy` | Controller identity/address/email at `Who controls your information`; categories; purposes/bases; OpenAI/voice; consent/withdrawal; named provider purposes; transfers; retention; strictly-necessary-only technology; affiliate boundary; rights/ICO; age/security | Detected | `app/(public)/privacy/page.tsx` |
| `/privacy` | `Our UK representative is [LEGAL NAME], [POSTAL ADDRESS]. You may contact them at [EMAIL] or [CONTACT ROUTE] about UK data-protection matters.` immediately after controller | Planned; record remains `null`; never render brackets | `lib/legal/gb-uk-representative.ts`; Article 27 assessment |
| `/terms` | Service/operator boundary; 18+ and no KYC; Programme/AI/non-clinical boundary; account security; changing operator/offer terms; commercial relationship; third parties; evidence/accuracy; liability and mandatory UK consumer rights | Detected | `app/(public)/terms/page.tsx` |
| `/affiliate-disclosure` | Commission relationship; active link and sponsored labels; what compensation can/cannot influence; significant conditions; demo separation; corrections | Detected | `app/(public)/affiliate-disclosure/AffiliateDisclosureDocument.tsx` |
| `/responsible-gambling` | `B4GAMBLE does not diagnose, provide treatment, calculate a ‘safe’ gambling amount or decide what you can afford...` adjacent to the control/support content | Detected in canonical rendered transform | `lib/final-handoff/transforms.ts` (`transformResponsibleGamblingHandoff`) |
| `/help` | `No casino, bonus or affiliate actions appear here. Help activity is not used for offers, rankings or commercial personalisation. Take what you need.` | Detected in protected rendered transform | `lib/final-handoff/transforms.ts` (`transformHelpHandoff`) |
| `/help` urgent boundary | `If someone’s life is at risk... call 999 or go to A&E... NHS 111... B4GAMBLE is not an emergency or clinical service.` | Detected in protected rendered transform | `lib/final-handoff/transforms.ts` |
| Global footer | Existing Explore, Programme & Support and Trust groups; bottom legal row contains only `18+`, financial-risk warning, Terms, Privacy and Contact; commission disclosure remains visible plain text, not a link; Affiliate Disclosure, Responsible Gambling and protected Help are not duplicated | Detected | `components/public-shell/PublicFooter.tsx` |
| Programme entry | Exactly two unchecked required checks: `I confirm I am 18 or over`; `I agree to the Terms and confirm I have read the Privacy Notice` with links | Detected | `components/programme/ProgramAiFinalPresentation.tsx` |
| Programme intake | `Before you share` disclosure; separate unchecked explicit sensitive-data/AI/transcription consent; optionality and withdrawal consequence before typed/voice processing | Detected | `components/programme/ProgramAiFinalPresentation.tsx` |
| Programme withdrawal | `Withdraw consent and clear this draft`; server authority invalidation and local-draft clearance | Detected | `components/programme/ProgramAiFinalPresentation.tsx`; `ProgramAiExperience.tsx` |
| Account creation | Email/Google continuation after confirmed Starting Point; account creation adds 0 XP; adult/legal authority preserved; no marketing checkbox | Detected | `components/programme/ProgramAiFinalPresentation.tsx`; `ProgramAiExperience.tsx` |
| Google identity | `Google provides identity only; it does not verify age or receive your Programme words from B4GAMBLE...` next to Google continuation | Detected | `components/programme/ProgramAiFinalPresentation.tsx` |
| Casino/offer card | Active: `Affiliate link · We may earn commission.`; unavailable: `Review only` or `Offer unavailable`; neutral editorial links remain neutral | Detected / conditional on server authority | casino profile, offer and directory components |
| Sponsored unit | `Advertisement · Sponsored placement` plus `Paid placement; sponsorship does not change Editor Score.` before engagement | Planned only for a future separately approved sponsored unit; no current unit detected | Public copy pack; Affiliate Disclosure |
| Commercial CTA/creative | `Affiliate link · We may earn commission.` remains adjacent to CTA actions; surrounding offer/profile surfaces retain material terms, 18+ and financial-risk context. Authorized actions link directly to the first-party `/r/{slug}` governed redirect without a confirmation popup/page or second click. | Detected / conditional on server authority | `components/casino-profile/CasinoOutboundAction.tsx`; `app/r/[slug]/route.ts` |
| Bonus/offer | Significant conditions next to the action and full terms one direct click away; no `free`/`risk-free` claim without exact substantiation | Control complete; real action unavailable | public copy pack; offer service/readiness code |
| Demonstration data | `DEMONSTRATION DATA — Fictional example for interface testing... No gambling or affiliate link is available.` near each fixture; no action/schema/indexing authority | Detected | bonus, best-offer, casino and comparison components/services |
| Corrections | Contact route and source/date qualification; no unsupported independent/tested/verified/best/fastest/current/trusted/safe/guaranteed claim | Detected controls plus copy authority | Affiliate Disclosure; Methodology; public copy pack; legal tests |

## Cross-surface rules

1. Legal disclosure appears before or next to the decision/action it qualifies; footer-only disclosure is insufficient for a commercial action.
2. Protected Help never inherits casino, bonus, comparison, affiliate or commercial navigation/actions.
3. Programme/Help data never chooses, ranks or personalises commercial content.
4. Demonstration records never expose outbound actions and never become real evidence through their names, timestamps or UI labels.
5. Unknown, stale, missing or inconsistent evidence is described as unavailable; it is never translated to verified.
6. A provider/account/appointment/registration fact is not published until durable evidence is reviewed.

## Release verification

Automated source/route tests cover the legal pages, Programme disclosure order, Help separation, footer, labels, demo denial, analytics absence and commercial gate. Exact-SHA Preview browser evidence remains required after push.
