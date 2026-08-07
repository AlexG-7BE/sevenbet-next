# SevenBet Figma Screen Inventory

Last reconciled: 2026-08-07

Status: **current canonical route/family/status inventory**

Figma file: [SevenBet](https://www.figma.com/design/UvuJZEzeMAd8cK9TNAueb8)

Visual direction: RFC-007 — Tilt-Locked Human Product Theatre

This document owns current Figma authority and implementation status. It is not a runtime specification, migration queue or production-content approval. Current operational truth is in [Project State](../PROJECT_STATE.md); completed migration history is in the [Frontend Migration Record](Frontend-Migration-Audit-and-P0-Implementation-Plan.md).

## Authority and evidence rules

Evidence labels used here:

- **Detected** — directly present in the merged repository or verified through read-only Figma metadata.
- **Inferred** — bounded conclusion supported by detected evidence.
- **Planned** — approved future work not detected as implemented.
- **Not detected** — supporting repository/Figma evidence was not found.

Figma controls approved visual design, composition, responsive intent and visual states. Runtime, governed data and Founder Office decisions control functionality, production data, auth, availability, evidence truth, compliance-sensitive copy and backend capability.

An illustrative Figma value, operator, offer, location, account state or `330 XP` example is not permission to fabricate runtime truth. Missing data stays missing; unavailable action stays unavailable; and a visual state does not create a backend capability.

The active repository root was confirmed as `/Users/alex/Documents/Codex/2026-07-09/ns/sevenbet-next`. Dependencies, generated output, caches, build artefacts and `tsconfig.tsbuildinfo` were excluded from source analysis. The nodes below were rechecked through read-only Figma metadata on 2026-08-07. No Figma write was performed.

## Page-level migration authorities

All rows in this table are visually approved and implemented at page level. “Implemented” does not claim Design System v1 consolidation or every cross-cutting capability.

| Route / surface | Current approved Figma authority | Responsive/state evidence | Merged implementation |
| --- | --- | --- | --- |
| Public Shell | Family `492:2268`; Header `289:43`; Footer `488:100` | 1,440 `492:2283`; 1,280 `494:116`; mobile representatives `493:57`, `493:78`, `493:115`; 375 `493:131` | FE-MIG-01. Server-owned public layout/account state; Protected Help and Programme retain separate shells. |
| Home `/` | Canonical 1,440 source `289:946`; desktop family `661:7551`; mobile family `657:2545` | 1,280 returning first fold `661:7554`; desktop contract `661:7607`; full 390 `657:2548`; menu-open `661:2635`; 375 first fold `661:2686`; mobile contract `661:2711` | FE-MIG-02, closed by FE-MIG-16 final parity. The responsive families supplement, not replace, `289:946`. |
| `/10-steps` | Desktop family `502:2238`; mobile family `502:2412` | Desktop 1,440 `502:2240`; 1,280 `502:2241`; full 390 `502:2414`; returning `502:2415`; 375 `502:2416` | FE-MIG-03, closed by FE-MIG-10. Runtime Dashboard/account truth overrides illustrative states. |
| Casino Directory `/casinos` | Desktop family `520:2496`; mobile family `521:312`; original anchor `325:323` | Full 1,440 `520:2498`; 1,280 `520:2741`; desktop states `520:2742`; full 390 `521:314`; filters/states `521:315`–`521:319`; 375 `521:320` | FE-MIG-04 foundation, closed by FE-MIG-06. SSR, URL controls and published DTO truth remain authoritative. |
| Casino Profile `/casino/[slug]` | Desktop family `529:2850`; mobile family `530:809`; original anchor `343:601` | Full 1,440 `529:2852`; 1,280 `529:3075`; desktop states `529:3299`; full 390 `530:811`; mobile failure/unavailable/375 states `531:3983`–`531:3987` | FE-MIG-05. Editorial availability and commercial eligibility remain separate. |
| Bonuses `/bonuses` | Desktop family `541:3002`; mobile family `541:3950`; original anchor `299:786` | Full 1,440 `541:3952`; 1,280 `541:4216`; desktop states `542:3328`; full 390 `542:4329`; mobile states `544:4415`–`544:4422` | FE-MIG-07. Current published offer projection and internal governed actions override illustrative Figma data. |
| Best Offers `/best-offers` | Desktop family `556:3336`; mobile family `557:1470`; original anchor `310:224` | Full 1,440 `556:3338`; 1,280 `556:3470`; desktop states `556:5324`; full 390 `557:1472`; 375 `558:1507`; mobile states `558:1616` | FE-MIG-08. Database-ranked, explicitly synthetic shortlist; current terms and ranking inputs are runtime truth. |
| Comparison `/compare` | Desktop family `567:3592`; mobile family `569:1589` | Full 1,440 `567:3594`; 1,280 `567:3868`; desktop contract `568:106`; full 390 `569:1591`; 375 `569:1831`; mobile contract `570:76` | FE-MIG-09. URL selection and latest-published comparable projection are server-owned. |
| Protected Help `/responsible-gambling/**` | Desktop family `599:3886`; mobile family `600:1713`; Header `595:59`; Footer `596:58` | Hub `599:3891` / `600:1718`; article `599:3972` / `600:1792`; governed states `599:4030`, `600:1855`–`600:1985`; first folds `599:4089`, `600:2010` | FE-MIG-11. Dedicated non-commercial layout is implemented and remains separate from the Public Shell. |
| Ranking Methodology `/methodology` | Legal/Trust desktop family `646:4467`, frame `646:4558`; mobile family `649:2257`, frame `649:2329` | Shared legal-content/system-state boards `648:4623`, `648:4749`, `650:2368`, `650:2469` | FE-MIG-12. Visual authority remains current; runtime methodology copy and evidence are content authority. |
| Affiliate Disclosure `/affiliate-disclosure` | Legal/Trust desktop family `646:4467`, frame `646:4469`; mobile family `649:2257`, frame `649:2259` | 1,280 first fold `648:4879`; 375 first fold `650:2586`; responsive contracts `648:4908`, `650:2600` | FE-MIG-13. Affiliate disclosure content must remain truthful to current commercial behaviour. |
| About `/about` | **Current family `835:5298`** | Canonical desktop `835:5301`; canonical mobile `835:5436`; 375 first fold `835:5559`; QA `835:5651`, `835:5787`, `835:5923`, `835:6015`, `835:6107` | FE-MIG-13. This family supersedes the old About frames in the Legal/Trust family. |
| Learning Center `/learn` | **Current family `835:6356`** | Canonical desktop `835:6359`; canonical mobile `835:6473`; 375 first fold `835:6590`; QA `835:6675`, `835:6789`, `835:6903`, `835:6988`, `835:7073` | FE-MIG-14. E05 Search & Filter v1 is approved and implemented. |
| Learning category routes | Desktop category `632:4360`; mobile category `634:2177` | Learning family roots `632:4237` and `634:2074` remain specialized template sources | FE-MIG-14. Category authority is separate from the `/learn` hub family. |
| Learning article routes | Desktop neutral article `633:4341`; mobile neutral article `635:2148`; evidence row `630:6351` | Evidence/source `633:4482`, `635:2318`; unavailable `635:2254`; first folds `633:4529`, `635:2304`; protected articles use Protected Help authority | FE-MIG-14. Neutral/commercial learning and protected-control articles remain distinct. |
| Bonus Guide `/bonus-guide` | Desktop family `694:5455`; mobile family `694:8724` | Full 1,440 `694:5461`; evidence `694:5531`; 1,280 `694:5542`; under review `694:5551`; full 390 `694:8730`; mobile recovery/evidence `694:8787`, `694:8800`, `694:8809` | FE-MIG-15. Figma is visual authority; merged regulatory-safe content is runtime/content truth. |

## Learning Search & Filter v1 (E05)

**Founder Office decision: APPROVED AND IMPLEMENTED.**

The bounded implementation provides client-side text search, Category, Tag and Difficulty filters, combined filters, result count, no-results recovery, Clear filters, Browse categories and a full SSR/no-JavaScript catalogue fallback. It added no search API, backend or index.

The older Figma annotation that described E05/search-filter as blocked is historical and superseded by this approval and FE-MIG-14 implementation. It must not be used as a current delivery blocker.

## Specialized and cross-cutting authorities

These families remain current design references but are not proof that every depicted capability is implemented.

| Surface | Current Figma authority | Runtime status / release boundary |
| --- | --- | --- |
| Programme through Mission 04 | Desktop flow sources `426:2`, `449:1413`, `468:1753`; mobile family `580:1713` | Missions 01–04 and server-owned rewards are implemented. Mission 05–10 task content is not approved. |
| Programme Map / My Plan | Desktop `666:4862`; mobile `668:2671` | Runtime has a compact three/five-node path. Full ten-node map, paused-map re-entry and Dashboard loading/retry remain gaps. |
| Pause / Support | Desktop `674:5143`; mobile `674:8171` | Protected routing exists. Local applicability, source ownership and content review remain release gates. |
| Commercial Handoff / Affiliate Outbound | Desktop `679:5238`; mobile `679:8391` | Confirmation and deny-safe internal routing exist on migrated commercial surfaces. FE-HANDOFF-01 failure/recovery remains unresolved system-wide. |
| Age / Market Boundary | Desktop `686:5333`; mobile `686:8301`; generic notice `489:70` | Approved visual fail-closed states only. Trusted live market/age/licensing authority is not detected. |
| Identity & Privacy | Desktop `613:4023`; mobile `624:1930` | Programme sign-up/sign-in exists. Password recovery, public account settings and account-wide export/erasure are not implemented capabilities. |
| Privacy, Terms and public/protected system states | Content board `648:4623` / `650:2368`; recovery board `648:4749` / `650:2469`; sets `641:6762`, `643:6828` | Privacy and Terms remain placeholders; system recovery is partial. Visual existence is not legal/content approval. |

## Superseded and historical nodes

| Historical node / statement | Current treatment |
| --- | --- |
| About desktop `646:4653` and mobile `649:2405` | **Superseded for `/about`** by family `835:5298` and descendants. They may appear only as historical Legal/Trust family evidence. |
| Learning catalogue desktop `632:4240` (and its old hub pairing) | **Superseded for `/learn`** by family `835:6356`. Category and article templates from the older Learning family remain current specialized authorities. |
| E05 dependency / search-filter blocked annotation | **Superseded** by Founder Office approval and FE-MIG-14 runtime implementation. |
| Home responsive families as replacements for `289:946` | Incorrect. `289:946` remains the canonical 1,440 visual/content source; `661:7551` and `657:2545` supplement its responsive intent. |

## Missing, blocked and deferred families

- `/self-check` and `/tools/budget-calculator` have no approved dedicated redesign family. They remain `P0_REDESIGN_REQUIRED` and launch-blocked under FE-SAFETY-01.
- Live age, market, jurisdiction and licensing enforcement is blocked by authority/data decisions even though generic visual states are approved.
- Mission 05 has no separate approved Mission RFC or implementation authority.
- Password recovery, account-wide export/erasure and functioning Privacy/Terms controls must not be inferred from designed states.
- A cross-site global search family is not required for the initial launch. E05 is scoped only to Learning Center.
- Motion & Prototype and Ready for Dev consolidation, variable-mode naming, Code Connect/production back-sync and component/token governance belong to FE-DS-01.

## Current handoff

**Page-level frontend migrations: complete.**

**Design system consolidation: not complete.**

The next authorized frontend workstream is **FE-DS-01 — Frontend & Design System Consolidation**. It must inventory and consolidate production patterns against these authorities without redesigning migrated pages, inventing functionality or changing governed data boundaries.
