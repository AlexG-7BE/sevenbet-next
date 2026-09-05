# Frontend Migration Audit and P0 Implementation Plan

## Document status

**Historical baseline plus final reconciliation — superseded as an active implementation plan.**

The original 2026-08-05 audit established a repository/Figma comparison method, identified page-level migration and safety gaps, and decomposed work into bounded packages. That baseline was valid at the time but must not be read as current implementation state.

This document now records the final post-FE-GAP-02 disposition at repository baseline `30fc96e198f2a509ac3cae707f66bf9b6b9a5201`.

## Historical method retained

The original audit:

1. reviewed Product Vision, approved RFCs, current routes, layouts, services and live Figma;
2. separated visual parity from product, data and compliance authority;
3. classified claims as **Detected**, **Inferred**, **Planned** or **Not detected**;
4. required family-scoped delivery and protected Programme/Help/commercial boundaries;
5. prohibited treating a visually approved but capability-gated state as implemented.

The historical baseline found broad frontend parity gaps, unsafe pre-migration Self-Check/limit-tool mechanics, incomplete public/protected shell separation, missing trust/legal surfaces and an incomplete comparison/handoff journey. Those findings drove the packages below. They are not current defects.

## Final current-state conclusion

**Detected:**

- page-level public frontend migration is complete through FE-GAP-02;
- known public-surface P0 defects: **0**;
- known public-surface P1 defects: **0**;
- the frontend is ready to enter FE-DS-01 from a page-level perspective.

This conclusion does not mean SevenBet is launch-ready, GB compliance is complete, operations are complete, product-gated capabilities are implemented, or Missions 05–10 exist.

## Merged delivery history

| Package | Outcome | Merge evidence |
| --- | --- | --- |
| FE-MIG-01 — Public Shell | Completed | PR [#15](https://github.com/AlexG-7BE/sevenbet-next/pull/15), merge `ceee4e7` |
| FE-MIG-02 — Home | Completed | PR [#16](https://github.com/AlexG-7BE/sevenbet-next/pull/16), merge `bef86bd` |
| FE-MIG-03 — 10 Steps | Completed | PR [#17](https://github.com/AlexG-7BE/sevenbet-next/pull/17), merge `d85146e` |
| FE-MIG-04 — Casinos foundation | Completed | PR [#18](https://github.com/AlexG-7BE/sevenbet-next/pull/18), merge `5090cec` |
| FE-MIG-05 — Casino Profile | Completed | PR [#21](https://github.com/AlexG-7BE/sevenbet-next/pull/21), merge `2b35822` |
| FE-MIG-06 — Casino Directory | Completed | PR [#23](https://github.com/AlexG-7BE/sevenbet-next/pull/23), merge `328d209`; media hotfix PR [#24](https://github.com/AlexG-7BE/sevenbet-next/pull/24) |
| FE-MIG-07 — Bonuses | Completed | PR [#25](https://github.com/AlexG-7BE/sevenbet-next/pull/25), with contrast/mobile parity in PRs [#28](https://github.com/AlexG-7BE/sevenbet-next/pull/28) and [#30](https://github.com/AlexG-7BE/sevenbet-next/pull/30) |
| FE-MIG-08 — Best Offers | Completed | PR [#26](https://github.com/AlexG-7BE/sevenbet-next/pull/26), with parity in PRs [#29](https://github.com/AlexG-7BE/sevenbet-next/pull/29) and [#31](https://github.com/AlexG-7BE/sevenbet-next/pull/31) |
| FE-MIG-09 — Comparison | Completed | PR [#32](https://github.com/AlexG-7BE/sevenbet-next/pull/32), merge `5e4a42f` |
| FE-MIG-10 — final 10 Steps | Completed | PR [#33](https://github.com/AlexG-7BE/sevenbet-next/pull/33), merge `01c2a7d` |
| FE-MIG-11 — Protected Help | Completed | PR [#34](https://github.com/AlexG-7BE/sevenbet-next/pull/34), merge `b07fb74` |
| FE-MIG-12 — Methodology | Completed | PR [#35](https://github.com/AlexG-7BE/sevenbet-next/pull/35), merge `a56ffac` |
| FE-MIG-13 — Affiliate Disclosure + About | Completed | PR [#36](https://github.com/AlexG-7BE/sevenbet-next/pull/36), merge `8c41442` |
| FE-MIG-14 — Learning | Completed | PR [#37](https://github.com/AlexG-7BE/sevenbet-next/pull/37), merge `fa58d08` |
| FE-MIG-15 — Bonus Guide | Completed | PR [#38](https://github.com/AlexG-7BE/sevenbet-next/pull/38), merge `d15543a` |
| FE-MIG-16 — Home final parity | Completed | PR [#39](https://github.com/AlexG-7BE/sevenbet-next/pull/39), merge `110e8e6` |
| FE-GAP-01 — final legal/control surfaces | Completed | PR [#41](https://github.com/AlexG-7BE/sevenbet-next/pull/41), merge `f612531` |
| FE-GAP-02 — final pre-DS closure | Completed | PR [#42](https://github.com/AlexG-7BE/sevenbet-next/pull/42), merge `30fc96e` |

Both FE-GAP feature heads (`01c82cf2…` and `f2d04d5…`) are ancestors of this main baseline.

## Final work-package disposition

| Disposition | Packages / concerns |
| --- | --- |
| **Completed** | FE-MIG-01–16, FE-GAP-01, FE-GAP-02 and FE-HANDOFF-01. |
| **Superseded** | The original parity counts, route-missing claims, legal-placeholder claims, legacy shell findings and active P0 implementation sequence. |
| **Closed safety redesign** | Historical FE-SAFETY-01 behaviour was replaced by FE-GAP-01: Self-Check is now a local, non-clinical, non-score reflection; the Limit Tracker uses only a user-defined limit and has no commercial result action. |
| **Deferred product** | Missions 05–10; complete password recovery; account-wide export/erasure; trusted live age/jurisdiction authority; unapproved Learning search/filter capability. |
| **FE-DS debt** | Tokens, component/CSS duplication, responsive/state normalization, accessibility, cross-route visual regression, Storybook decision, Figma back-sync and legacy deprecation. |

## Current safety and legal contracts

- **Self-Check:** exactly eight questions; deterministic non-score routing; no diagnosis; React-memory only; Help-first result available; no casino, bonus or affiliate action.
- **Personal Gambling Limit Tracker:** user chooses the limit; SevenBet does not calculate affordability, a safe-spend amount or a stop-loss recommendation; React-memory only; no commercial result CTA.
- **Privacy / Terms:** substantive launch-candidate documents; correct legal identity/contact; server-rendered; `noindex, follow`; absent from sitemap. External counsel and processor/retention/transfer review remain.
- **Protected Help:** dedicated shell, Hub, ten article routes, governed Cooling-off states and protected unknown-article recovery. Commercial recovery is prohibited.
- **Commercial Handoff:** direct governed CTA/creative → managed `/r/[slug]` → server-authoritative resolution → external destination only when valid; failure → `/outbound/unavailable`; no substitute offer. `/outbound/[slug]` is an internal compatibility redirect to `/r/[slug]`, and `/go/[slug]` remains fail closed.

## Remaining dependencies outside page migration

- Product approval and implementation for Missions 05–10 and remaining account lifecycle.
- Live trusted market/age/licensing authority and compliance sign-off.
- Real operator/partner data and removal or replacement of the temporary RFC-012 fictional dataset.
- CI/CD, monitoring, incident response, backups, distributed Programme controls and privacy operations.
- FE-DS-01 consolidation and Design System v1 governance.

## Final readiness statement

**PAGE-LEVEL FRONTEND: READY FOR FE-DS-01.**

FE-DS-01 is consolidation of the now-real production patterns. It is not a new page-redesign programme and it does not supply market, compliance, data-partner or operational launch approval.
