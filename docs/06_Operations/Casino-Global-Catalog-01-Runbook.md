# CASINO-GLOBAL-CATALOG-01 runbook

Decision: [FOUNDER-CASINO-GLOBAL-CATALOG-2026-09-23](../07_Decisions/FOUNDER-CASINO-GLOBAL-CATALOG-2026-09-23.md).
Executor: `scripts/casino-global-catalog-01.ts` (`npm run casino-global-catalog`).

A manual, Founder-run command, like the EGO import. It grants no commercial
authority, opens no market and applies no migration.

## Commands

`plan` writes nothing and prints `targetDatabaseFingerprint`, which `apply` and
`editorial` then require.

```bash
npm run casino-global-catalog -- plan
```

```bash
npm run casino-global-catalog -- apply --confirm=CASINO-GLOBAL-CATALOG-01 --decision-ref=FOUNDER-CASINO-GLOBAL-CATALOG-2026-09-23 --actor-email=<admin email> --expected-database=<fingerprint>
```

```bash
npm run casino-global-catalog -- editorial --confirm=CASINO-GLOBAL-CATALOG-01 --actor-email=<admin email> --expected-database=<fingerprint>
```

`score-plan` previews Editor Scores and writes nothing. `scores` fills a
**missing** score and will not overwrite an existing one, because the fourteen
CASINO-REAL-CATALOG-02/03 scores are Founder editorial judgements rather than
outputs of this method — see the decision record for the movement a blanket
recompute would cause. To replace one deliberately, name it with `--only <slug>`.

```bash
npm run casino-global-catalog -- score-plan
npm run casino-global-catalog -- scores --confirm=CASINO-GLOBAL-CATALOG-01 --actor-email=<admin email> --expected-database=<fingerprint>
```

Point the shell at the target database first. For Production only
`PRODDB_POSTGRES_URL` carries a usable connection string:

```bash
vercel env pull /tmp/b4g-prod.env --environment=production --yes
```

Then pass it with `--db-env-file /tmp/b4g-prod.env --db-env-key PRODDB_POSTGRES_URL`
and delete the file. The runner raises Prisma's interactive-transaction timeout
before Prisma loads, because each republish is one long transaction against a
remote database.

Both write commands are idempotent. `apply` never overwrites an operator,
language list or currency list an editor has already set. `editorial` takes
`--only <slug>` to rewrite a single casino.

## Read this before running against Production

**Each casino leaves the public site for the length of its republish.** The
governed workflow has no in-place republish: `publishCasino` requires
`APPROVED`, and the only route there from `PUBLISHED` is
`DRAFT → IN_REVIEW → APPROVED → PUBLISHED`. While a casino sits in `DRAFT` the
publication query (`c.status = 'PUBLISHED'`) excludes it, so its review page
404s and it drops out of `/casinos`.

The executor processes one casino at a time, so at most one is missing at any
moment and the other 27 are unaffected. Against a remote database each casino
takes several minutes, so a full `apply` run is a multi-hour job. Run it in a
low-traffic window, and prefer `--only` to move one casino at a time if the
window is short.

## What `apply` does, per casino

1. Collapses duplicate rows of one licence identity into a single row that
   keeps every market link, so a corporate licence is recognised by its true
   reach instead of looking like a national one.
2. Writes the derived global catalog rows — payments, providers and categories
   with `casinoCountryId` null.
3. Fills `operator`, `languages` and `currencies` where they are empty and the
   derivation resolved them.
4. Republishes the casino so the public snapshot carries the new layer.
5. Records an `AuditLog` row naming the release, the decision reference and the
   fields left unresolved.

## If a run fails part way

A remote pool can refuse to start a transaction under contention. Each casino
is retried up to four times on a transient transaction or write-conflict
failure, and a casino that still fails is reported and skipped so the rest of
the run continues; the command then exits non-zero naming every casino to
redo. Re-running resumes — every command is idempotent.

**A casino that fails mid-workflow is left in `DRAFT` or `IN_REVIEW`, which
means it stays off the public site until the run is repeated for it.** Check
for stragglers before walking away:

```sql
SELECT slug, status FROM "Casino" WHERE status NOT IN ('PUBLISHED', 'ARCHIVED');
```

Repeat just those with `--only <slug>`.

## Offers

`offer-plan` lists every published-but-inactive offer with the material terms
it is missing, and writes nothing. `offers` activates the six EGO offers named
in the executor and no others.

```bash
npm run casino-global-catalog -- offer-plan
npm run casino-global-catalog -- offers --confirm=CASINO-GLOBAL-CATALOG-01 --actor-email=<admin email> --expected-database=<fingerprint>
```

A published offer is withheld only when the casino has no working partner
route. Where a `MarketActivation` is `ACTIVE` with a `HEALTHY` route the offer
page is reachable, so the offer exists and is published everywhere that casino
operates — the Founder rule of 24 September 2026.

An earlier hardcoded batch of six left GoldenPlay sitting on fifteen live
routes with eleven offers stranded in `DRAFT`, and Betsson on seven routes with
two. Offers already scoped to a country keep that scope and resolve as `EXACT`
there and `OTHER_MARKET` elsewhere; offers recorded globally serve as `ROW`.

`offer-plan` shows every inactive offer with the material terms it is missing
and whether its casino is routed. Incomplete terms no longer withhold an offer
— they are reported so the gaps can be filled, not used as a veto.

## What `editorial` does

Replaces `pros` ("Best for"), `cons` ("Things to know") and `description` for
all twenty-eight casinos from
`data/casino-global-catalog-01/editorial.v1.json`, keeps the published
editorial review in step, and republishes. The corpus loader refuses a file
whose schema, release or `commercialAuthority: false` do not match, and rejects
any line that has drifted back to opening with a licence recital.

## After the run

```bash
npm run casino-global-catalog -- plan
```

Expect 28 casinos with a global catalog layer and no casino reporting
`unresolved=payments,providers,categories` together. Four casinos legitimately
report `unresolved=operator` — Betsafe, Betsson, PlayUZU and Rizk name a
different local licensee per market, so there is no majority corporate entity
to adopt and the field stays empty until research supplies one.

Then check a profile from a country with no exact market profile. Operator,
"Licensed in", payment methods, game categories, providers and support
languages should all be populated; payout stays "Not verified" wherever no
payment method records a withdrawal time, which is a real gap in the data and
not a rendering fault.

## Known remaining gaps

- **Payout timing.** Only a handful of casinos record `withdrawalTime` on any
  payment method. `CasinoCountry.withdrawalSummary` holds prose for most
  markets but nothing reads it, so payout shows "Not verified" and the
  fast-payout ranking and badge stay inert for those casinos.
- **Offers.** Eight casinos have no bonus at all: AHTI Games, Casino RedKings,
  DragonBet, EUcasino, MegawaysCasino, Regency Casino Online, SlotsMagic and
  TurboNino. Recording one needs research, not derivation. Twelve further
  published offers stay inactive because their material terms are incomplete —
  run `offer-plan` for the current list and the exact missing fields.
- **Founded year** is missing for 16 casinos and **responsible-gambling tools**
  for 19. Both now display on the profile when present, so collecting them has
  a visible destination; neither is derivable from market profiles.
- **Payout timing for the global view.** The market sentence now shows on an
  exact-market profile, but a reader with no exact profile still sees nothing,
  because the sentence belongs to a market and cannot be borrowed. Only
  brand-level per-method timings would close that, and those need research.
