# B4GAMBLE GB Public Legal Copy Pack

**Owner:** 7BE Inc. / B4GAMBLE
**Market:** Great Britain
**Effective:** 19 August 2026
**Status:** PUBLIC LEGAL IMPLEMENTATION: COMPLETE

This pack records the final public wording and placement rules implemented by this change. The complete Privacy Notice, Terms of Use and Affiliate Disclosure are maintained in their page source files:

- `app/(public)/privacy/page.tsx`
- `app/(public)/terms/page.tsx`
- `app/(public)/affiliate-disclosure/AffiliateDisclosureDocument.tsx`

## 1. Programme access and consent

### Entry checks

1. `I confirm I am 18 or over` — Required.
2. `I agree to the Terms and confirm I have read the Privacy Notice` — Required, with adjacent Terms and Privacy links.

The special-category consent is not bundled with these checks or repeated at account creation. It appears just in time, before typed or voice input is submitted.

### Just-in-time Programme disclosure

> Before you share. Your words may reveal health or other sensitive information. Typed input, or audio for transcription, is sent to our AI provider to create a suggested Starting Point. B4GAMBLE does not save the audio or use your words for offers or rankings. Privacy details.

### Explicit-consent checkbox

> I explicitly consent to B4GAMBLE processing what I type or say, including information that may reveal my health, and sending it to its AI and transcription provider to personalise my Programme.

Adjacent explanation:

> Optional. You can withdraw before saving. Withdrawal stops future processing and clears this draft, but cannot undo processing already completed.

Withdrawal action:

> Withdraw consent and clear this draft

### Identity disclosure

> Google provides identity only; it does not verify age or receive your Programme words from B4GAMBLE. Registration adds 0 XP. Programme and Help data never feeds offers or rankings.

### UK representative field — conditional

Placement: immediately after `Who controls your information` on `/privacy`. The public record at `lib/legal/gb-uk-representative.ts` remains `null` until Founder/Legal has retained and approved the signed mandate and every public field. Do not render brackets or an unappointed placeholder.

When and only when those particulars are approved, render:

> Our UK representative is [LEGAL NAME], [POSTAL ADDRESS]. You may contact them at [EMAIL] or [CONTACT ROUTE] about UK data-protection matters.

## 2. Commercial and affiliate labelling

Place one of the following labels before, within or immediately adjacent to the relevant action. The user must see it before following the link.

| Surface | Exact label |
|---|---|
| Active affiliate action | `Affiliate link · We may earn commission.` |
| Paid placement | `Advertisement · Sponsored placement` |
| Sponsored-placement qualifier | `Paid placement; sponsorship does not change Editor Score.` |
| Editorial link | `Editorial review` or the specific neutral action, such as `Read review` |
| No governed commercial route | `Review only` or `Offer unavailable` |

Outbound confirmation:

> You are about to visit a third-party gambling operator. B4GAMBLE may earn commission if you complete a qualifying action. This does not change Editor Score or natural editorial ranking.

> 18+ · Eligibility and operator terms apply · Gambling involves financial risk

## 3. Bonus and offer copy template

Use this order on every active offer. Do not publish or activate the action when a required fact is missing, stale or not supported by authoritative evidence.

1. `Advertisement · Affiliate link — we may earn commission` where the unit is commercial advertising; otherwise use the active affiliate-action label above.
2. Operator and offer headline.
3. `18+ · GB only · New customers only` or the exact verified eligibility conditions.
4. `Minimum deposit: [AMOUNT]`.
5. `Wagering: [MULTIPLIER AND BASE]`.
6. `Maximum stake / minimum odds: [VALUE]` where applicable.
7. `Game or market contribution and exclusions: [SUMMARY]`.
8. `Offer period / claim and use deadline: [DATE OR PERIOD]`.
9. `Withdrawal, payment-method and maximum-win restrictions: [SUMMARY]`.
10. `Full terms` — one direct click away before the action.
11. `Gambling involves financial risk. Do not treat gambling as income or a way to recover losses.`

Never use `free`, `risk-free`, `guaranteed`, `no-risk`, `instant` or an equivalent claim unless the exact meaning and every significant condition make the claim accurate.

## 4. Demonstration-data disclosure

> DEMONSTRATION DATA — Fictional example for interface testing. Not a real casino, current offer or B4GAMBLE partner. No gambling or affiliate link is available.

Demonstration data must remain noindex, excluded from structured offer data and public inventory, and incapable of producing an outbound action.

## 5. Footer baseline

> 18+ · Gambling involves financial risk. B4GAMBLE is an information and education service, not a gambling operator. We may earn commission from clearly labelled affiliate links.

Footer placement is intentionally non-duplicative:

- **Programme & Support:** Start Programme · 10 Steps · Responsible Gambling · Help — protected support →
- **Trust:** About · Methodology · FAQ · Affiliate Disclosure
- **Bottom legal:** 18+ · Gambling involves financial risk. · Terms · Privacy · Contact
- **Plain-text disclosure:** `We may earn commission from clearly labelled affiliate links.`

The commission statement is visible text, not another Affiliate Disclosure link. Affiliate Disclosure, Responsible Gambling and protected Help appear once in their governed groups and are not repeated in the bottom legal row.

## 6. Responsible-gambling and Help boundaries

Responsible Gambling:

> B4GAMBLE does not diagnose, provide treatment, calculate a ‘safe’ gambling amount or decide what you can afford. Gambling involves financial risk. If you are worried about harm, independent support and self-exclusion may be more appropriate than continuing the Programme.

Protected Help:

> No casino, bonus or affiliate actions appear here. Help activity is not used for offers, rankings or commercial personalisation. Take what you need.

Urgent boundary:

> If someone’s life is at risk, or you cannot keep yourself or someone else safe, call 999 or go to A&E now. For urgent mental-health help, use NHS 111 online or call 111 and select the mental-health option. B4GAMBLE is not an emergency or clinical service.

## 7. Claim replacements

| Do not publish without current substantiation | Approved replacement |
|---|---|
| `Independent reviews` | `Editorial reviews` |
| `Tested with real money` / `Real tests` | `Source and test status disclosed` |
| `Verified` | `Evidence checked [DATE] against [PRIMARY SOURCE]` |
| `Best` | `Ranked first under the published [USE-CASE] method as at [DATE]` |
| `Fastest payout` | `Published withdrawal information: [RANGE], source checked [DATE]` |
| `Current offer` | `Offer terms checked [DATE]; operator terms control` |
| `Trusted` / `Safe casino` | `Licence status checked [DATE] against the Gambling Commission register` |
| `Guaranteed` | Describe the bounded fact and limitation; do not use a guarantee. |
| `Delete everything immediately` | `Request deletion; legal, security and backup retention may apply.` |
| `Private` | State the exact local, provider and saved-data behavior. |

## 8. Release rule

Do not activate GB commercial or referral traffic through this copy change. Public wording does not replace partner, licence, offer, agreement, destination, privacy, vendor or regulatory evidence. Every unavailable authority continues to fail closed.

The GB launch uses only storage needed for requested features, authentication, security, access confirmation, same-tab comparison selection and temporary Programme continuity. It does not run non-essential product analytics, advertising trackers, tracking pixels or session replay. Reassess public information and user-choice requirements before introducing any non-essential technology.
