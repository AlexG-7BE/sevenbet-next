# Git Branch Evidence Preservation — Phase 1

## Status and boundary

**PROPOSED / NOT MERGED — 16 September 2026.** This record prepares seven
historical refs for later archival. It authorises no branch deletion, tag or
Release creation, merge, Production deployment, Vercel change, database change
or commercial-state change.

The Phase 1 base is exact `origin/main`
`1e502fb36b5d9c4256f5425b518e7c124af901dd`. All seven remote heads still
matched the completed forensic inventory when rechecked. The repository copies
in this change preserve only material design evidence. One-time Production
executor source is deliberately not copied back onto `main`.

## Revalidated ref register

| Classification | Branch | Exact head | Exact tree | PR | Historical role |
|---|---|---|---|---:|---|
| ARCHIVE BEFORE DELETE | `codex/cpo-commercial-decision-layer-preview-02` | `9156c59a2ce9da783e2b0fcb60698c62602c0b06` | `d9d135d72cdb0992cb7438288b0ded34690aaae7` | #75 | Closed, unmerged seven-commit product/design A/B Preview; superseded alternative. |
| ARCHIVE BEFORE DELETE | `codex/founder-commercial-ui-scanability-03` | `1fd49143c4f9513dc2d2792d29d9659ef4c0ab13` | `78ba59bcbd33f02a3c2c760a444bfe3d9764bf20` | #237 | Closed, unmerged commercial UI alternative with eight branch-addressed screenshots; superseded by PR #276. |
| DO NOT DELETE — MATERIAL | `codex/archive-fe-mig-05-pre-main-sync` | `9ec8a76182afd5bd48e425ba3abde499db458d57` | `2bab71a4528f9fb56a001fc6d15c550ac85bdeae` | none | Pre-main responsive Casino Profile snapshot retained by FE-MIG-06/07 records. |
| DO NOT DELETE — MATERIAL | `release/casino-market-0025-one-time-operator` | `c573b568ee51634e9e70701fbddf921f932dd444` | `4f755bfd0b8c1aa27151ffe76f061d1f88462595` | #115 | Closed, unmerged bounded migration-operator history. |
| DO NOT DELETE — MATERIAL | `release/casino-market-0025-production-build-probe` | `61f52542339590e2f9b0b6a6a27ea0630d34f14d` | `35e079357550dc2ea7d35874d3c09068d17b7000` | #116 | Closed, unmerged exact migration/probe release commit. |
| DO NOT DELETE — MATERIAL | `codex/betsson-pe-se-production-factual-release` | `3a48739d668d5005eb2c4cdabfa2f23103549007` | `946cf031a8fd62e1924d59f4386ab7d904c3509b` | #119 | Closed, unmerged one-time Betsson PE/SE factual Production executor. |
| DO NOT DELETE — MATERIAL | `codex/casino-data-population-01-production-release` | `f6a0c289693133b8505ef62be6847a1636daf2e5` | `658459aae03c23a3bfdbe6773e28f6653f4fcbe6` | #124 | Closed, unmerged one-time CASINO-DATA-POPULATION-01 Production executor. |

## PR #75 product/design evidence

**DETECTED:** the exact branch had no committed screenshot binaries. It contained
three material decision/implementation documents, now copied byte-for-byte to
[`historical-cpo-commercial-preview-02`](../02_Product_Design/qa/historical-cpo-commercial-preview-02/README.md):

| Original branch path | Git blob | SHA-256 |
|---|---|---|
| `docs/06_RFC/RFC-034-CPO-Commercial-Decision-Layer-Preview-V2.md` | `6ec16b535700c821137296772116575f1a150e43` | `df810cc3d23e7826566391eeba0c795ccb56788c1fa7615a37cd4342cd59afdc` |
| `docs/product/CPO-COMMERCIAL-DECISION-LAYER-PREVIEW-V2.md` | `51ffd410149f8b6bb9464aaea76d0a444769b17e` | `a70c038b28a83804af41ff14bd1731f0433efd08c4c225aeeb1947074f3f26c4` |
| `docs/product/CPO-COMMERCIAL-GOLDEN-BEST-CASINOS-V1.md` | `be1ec4ad34b76ba13125380201162ab1162782d2` | `709e66749461ecdbff9d697887d16bddf32a27f96542885ee4296f4f745bed03` |

**DETECTED:** Vercel deployment `dpl_HVcZ36KABh2zyg2b2oSeM4Zmx1sg` was still
`Ready`; its immutable URL, branch alias and metadata resolved to the exact head
and branch. Three read-only recovery captures were added with checksums. They
are present-day visual context only.

**UNKNOWN:** the ten August `/tmp` screenshot files named in the branch document
were outside Git and are no longer available as repository evidence. The
September captures cannot retroactively establish their bytes or exact original
render-time data.

**SUPERSEDED:** the preserved branch RFC is not part of the current RFC registry.
Current authority is `RFC-034-Final-Design-Handoff-Public-Site.md`.

## PR #237 screenshot evidence

**DETECTED:** all eight PNG Git blobs were copied unchanged at their original
repository paths under
[`founder-commercial-ui-scanability-03`](../02_Product_Design/qa/founder-commercial-ui-scanability-03/README.md).

| Original/current archive path under `screenshots/` | Git blob | Dimensions | SHA-256 |
|---|---|---:|---|
| `best-offers-1440.png` | `cdb2e9bf64f635bb61bf7708b266de2964b268bb` | 1440 × 4251 | `8224fb0a12e0abc904c822181db3155ade7a0ec59dacb7fc2088be34ea804f20` |
| `best-offers-390.png` | `3790b833ac38aa7630f2e9a6d308b665f957e58e` | 390 × 6309 | `e967947131bf888cfb770a27665ec50c13ac69f4346d85c4a0355038f64b5c0c` |
| `bonuses-1440.png` | `915f2281315e842c8b452d48eb5ba45792a6bd74` | 1440 × 4815 | `6ae5d106f19efdd9afce205a30ce578c140be08131b8e22c95f90083313c2d5e` |
| `bonuses-390.png` | `7d362a4b1f5b9d54836fef3cd33933b65cb15d97` | 390 × 9151 | `56f89c86701c3b813bb2c5b19eebf033a58cd4a25310082fa523406270fc3b61` |
| `casino-profile-1440.png` | `5753bc9cbf112c35c326ba356eeaa8bcdd4e1fcb` | 1440 × 3842 | `51bb5ad97fb4a340c8ed5ebc65c463a6145eb9fc27edb66a2cf0ed2600165ff8` |
| `casino-profile-390.png` | `9a75133400adba698457fc71cb6a3b970281cfd8` | 390 × 5649 | `4739c290190a20e82156289254831192aef0481eb82f34efe22ca265ae8bf0a1` |
| `casinos-1440.png` | `d8b4ce099295e9557be06221d12ed2438a04d36e` | 1440 × 4134 | `666bafddc3b1cc50976e48572d94c8be12e9c084585b75047b2f61c9711e390f` |
| `casinos-390.png` | `1c32025fcea97c3c5342d5c45cecce4115fdebca` | 390 × 7465 | `52f0af5c4c5b897154941a24a3feb06241729e0be7768e152edef04c72b2f799` |

**DETECTED:** Preview `dpl_F5SuKyUypaM245ZAyE8oJHyf1uDT` remained
`Ready` and its immutable/branch URLs still resolved to this exact head.

**SUPERSEDED:** this code alternative was not merged. PR #276 later merged the
broader current Commercial UX v1 at
`23355a961782c8ff9296ff48fdb829808fc12bf8`.

## One-time executor and pre-main evidence

Current repository documents preserve the factual outcomes but do not retain
every unmerged commit object by themselves:

- **pre-main archive:** FE-MIG-06 and FE-MIG-07 records name exact head
  `9ec8a76182afd5bd48e425ba3abde499db458d57` and explain that it remained
  isolated;
- **PRs #115/#116:** the 0025 DB-first runbook, migration register, readiness
  record and post-migration steady-state record preserve the one-time mechanism,
  exact executed release commit `61f52542339590e2f9b0b6a6a27ea0630d34f14d`,
  migration checksum and Vercel execution `dpl_HAU77Wih5w52nhNfWqaTWwJY7Y8X`;
- **PR #119:** the Casino Market Data release record preserves exact head
  `3a48739d668d5005eb2c4cdabfa2f23103549007`, CI, Preview and intentional-stop
  Production deployment `dpl_Fk23XAokr33hjubGsFKRSTdEFhRo`;
- **PR #124:** the Casino Data Population release record preserves exact head
  `f6a0c289693133b8505ef62be6847a1636daf2e5`, verification and intentional-stop
  Production deployment `dpl_6GR4ggFz8vYKvuUeoCeyB7dSJmjT`.

**DETECTED:** copying dormant executor source to current `main` would recreate
unnecessary Production mutation capability and is therefore rejected.

**PROPOSED:** after this evidence PR is merged, create one annotated evidence
tag for each exact commit, verify each remote tag resolves to the expected
commit/tree pair, and only then reconsider its branch independently. No tag was
created in Phase 1.

```bash
git tag -a evidence/pr-75-cpo-preview-2026-08-14 9156c59a2ce9da783e2b0fcb60698c62602c0b06 -m "Historical superseded CPO Preview PR #75"
git tag -a evidence/pr-237-commercial-ui-2026-09-11 1fd49143c4f9513dc2d2792d29d9659ef4c0ab13 -m "Historical superseded commercial UI PR #237"
git tag -a evidence/fe-mig-05-pre-main-2026-08-06 9ec8a76182afd5bd48e425ba3abde499db458d57 -m "Historical FE-MIG-05 pre-main archive"
git tag -a evidence/pr-115-casino-0025-operator-2026-09-01 c573b568ee51634e9e70701fbddf921f932dd444 -m "Historical one-time casino 0025 operator PR #115"
git tag -a evidence/pr-116-casino-0025-probe-2026-09-01 61f52542339590e2f9b0b6a6a27ea0630d34f14d -m "Historical casino 0025 Production probe PR #116"
git tag -a evidence/pr-119-betsson-factual-release-2026-09-02 3a48739d668d5005eb2c4cdabfa2f23103549007 -m "Historical one-time Betsson factual release PR #119"
git tag -a evidence/pr-124-casino-population-2026-09-02 f6a0c289693133b8505ef62be6847a1636daf2e5 -m "Historical one-time casino population PR #124"
git push origin refs/tags/evidence/pr-75-cpo-preview-2026-08-14 refs/tags/evidence/pr-237-commercial-ui-2026-09-11 refs/tags/evidence/fe-mig-05-pre-main-2026-08-06 refs/tags/evidence/pr-115-casino-0025-operator-2026-09-01 refs/tags/evidence/pr-116-casino-0025-probe-2026-09-01 refs/tags/evidence/pr-119-betsson-factual-release-2026-09-02 refs/tags/evidence/pr-124-casino-population-2026-09-02
```

Tag creation is a remote durable-state change and requires a separate Founder
decision. If signed tags are required, signer identity and key availability are
also a Founder/operations decision; Phase 1 does not infer them.

## Vercel retention evidence

**DETECTED — live project evidence:** a read-only Vercel project GET on 16
September 2026 reported deployment retention of 180 days for Preview, 365 days
for Production, 30 days for canceled deployments, 90 days for errored
deployments and a last-10 deployment floor. No setting was changed.

**DETECTED — Vercel contract:** generated commit URLs remain available only as
long as the configured retention policy permits. Vercel can mark expired
deployments for deletion, return 410 during the recovery period, and permanently
remove their resources afterward. Retention exceptions include recent Ready
deployments and specified alias targets. See [Deployment
Retention](https://vercel.com/docs/deployment-retention) and [Generated
URLs](https://vercel.com/docs/deployments/generated-urls).

**INFERRED:** deleting a Git branch does not rewrite the already-created
deployment object or its content-addressed Git commit metadata. The two
inspected deployment objects were still Ready before any deletion.

**UNKNOWN:** Vercel's public contract does not guarantee that an ordinary
generated branch alias remains assigned after its Git branch is deleted, nor
that the former active-branch retention exception continues. The immutable
deployment URL is therefore time-bounded evidence, not a durable archive.

## Phase 2 gate

No one of these branches is deletion-ready merely because this document exists.
The minimum gate for each branch is:

1. merge the evidence PR if Founder-approved;
2. create the exact approved annotated tag;
3. fetch tags in a separate clean checkout and verify tag commit plus tree hash;
4. verify the related release/design record and checksums remain reachable from
   `main`;
5. revalidate the branch head against this register; and
6. obtain an explicit branch-specific cleanup decision.

The 231 already-merged and eight obsolete cleanup candidates are outside this
record and remain untouched.
