# Market coverage by affiliate network — 24 September 2026

Which markets each partner casino actually serves, checked against the
affiliate networks' own sites and against what a player in each country is
served today. Row-level evidence is in [`geo-checks.v1.json`](geo-checks.v1.json).

Research only. Nothing in the database, the import bundles or the partner
routes was changed.

## Method

1. **Network sites.** Each network was read for the brands it carries and the
   markets it names: egamingonline.com (EGO), superflypartners.net (Superfly),
   netopartners.com (NetoPartners), affiliates.brothers.bet (Brothers Bet),
   betssongroup.com and betssongroupaffiliates.com (Betsson Group).
2. **Per-country check.** Every brand × market we hold, plus markets a network
   names, was opened through a proxy in that country (Firecrawl
   `location.country`, `maxAge: 0`). The method was confirmed on a known case
   first: redkings.com from Denmark returns "Desværre er RedKings ikke
   tilgængeligt i Danmark" and a link to SlotsMagic, as recorded earlier today.

Classification per row: **LOCAL** — a country-licensed version (local regulator
in the footer, local domain or path); **MGA** — the international .com version
under a Malta or offshore licence, with no local licence; **BLOCKED** — a geo-block
page or HTTP 403; **REDIRECT** — the player is sent to a different brand;
**?** — inconclusive.

### Limits of the evidence

- **IE and FI are not reliable.** The Firecrawl proxies for Ireland and
  Finland were observed exiting from US addresses, stealth mode included. No
  conclusion about Irish or Finnish availability rests on those rows alone.
- **Ontario was not tested.** The Canadian proxy exited in Quebec.
- **SkillOnNet block pages return HTTP 200.** A status-code health check cannot
  see them; see "Route health" below.

## Which casino belongs to which network

| Network | Casinos in our catalogue |
| --- | --- |
| EGO (eGamingOnline, SkillOnNet) | AHTI Games, BacanaPlay, Casino RedKings, DrückGlück, EUcasino, JackpotStar, MegawaysCasino, PlayOJO, PlayOJO Bingo, PlayUZU, Regency Casino Online, SlotsMagic, TurboNino |
| Superfly Partners (White Hat Gaming) | 21 Privé, Diamond7, G'day Casino, Hello Casino, Skol Casino, Slotnite |
| Brothers Bet Affiliates | DragonBet |
| NetoPartners (Anakatech) | GoldenPlay |
| Betsson Group Affiliates | Betsafe, Betsson, Inkabet, NordicBet, Rizk, StarCasino, SuperCasino |

## What each network says about its markets (DETECTED)

**EGO.** The brands page gives one line per brand: Regency "GREEK Launch",
MegawaysCasino "UK and COM Launch", PlayOJO "UK, CA and SE TV Advertised",
PlayUZU "Spain, Latam and Mexico", BacanaPlay "Portugal and Brazil",
DrückGlück "German TV Advertised", TurboNino "PaynPlay SE, DE & FI",
JackpotStar "UK, Sweden and MGA", and only "Multi Markets" or a slogan for AHTI
Games, EUcasino, RedKings and SlotsMagic. The affiliate T&Cs restrict USA,
Cyprus, Israel, Turkey and France for all EGO brands, and carry market-specific
rules for Germany, the UK, Spain, Sweden, Ontario, Denmark and Greece. EGO
press releases add: Regency live in Greece from May 2026 with the UK, Denmark,
Spain, Sweden and Germany announced as future roll-outs; MegawaysCasino
relaunched in the UK in March 2026 and on .com under MGA in May 2026; PlayOJO
and SlotsMagic live in Ontario since June 2022; PlayUZU on .es, .mx, .pe,
.bet.ar and .bet.br; BacanaPlay on .pt and .bet.br. The public site has no
per-brand market list; that sits behind the affiliate login.

**Superfly.** "All our brands are licensed in the UK and Malta." Wanted
traffic: UK, Ireland, Canada, Finland, Norway, Chile, Mexico. Affiliate T&Cs
(effective 1 October 2026) restrict, among others, Austria, Denmark, Germany,
Estonia, Latvia, Lithuania, Italy, Spain, Portugal, the Netherlands, France,
the USA and Australia, and forbid advertising in Swedish, Finnish or Dutch or
on .se, .fi or .nl sites. Separate welcome-offer terms are published for the
UK, Canada, Finland/Norway/Sweden, India and "Rest of World (MGA)". Since
19 January 2026 all six UK brands run one wager-free, points-based welcome
offer (minimum deposit £20, 14 days, spin winnings capped at £100 per batch).

**Brothers Bet.** Carries DragonBet and Gentleman Jim, "fully licensed online
betting sites for UK players". Brand and product pages are login-only.

**NetoPartners.** GoldenPlay: Tobique licence, EUR, minimum deposit €10,
languages EN, FR, IT, PL, PT (plus NL and DE in the body text). No market list
is published.

**Betsson Group.** betssongroup.com names the brands but not their markets. On
betssongroupaffiliates.com the Betsson brand page lists Betsson.es, .co, .mx
and .gr, Argentina (City, Córdoba, Province), CL, DK, IS, LATAM (BO, EC, PY,
UY), PE and a Swedish-language site. The brands page describes NordicBet as for
"Nordic customers — particularly those from Sweden" and Inkabet as for "all
Peruvians". StarCasino and SuperCasino do not appear on it. The per-market
record for these brands is already maintained in
[Global-14-Casino-Worldwide-Market-Authority-2026-09-10](../../docs/06_Operations/Global-14-Casino-Worldwide-Market-Authority-2026-09-10.md)
and was not re-checked country by country today.

## Registry

### EGO (SkillOnNet)

| Casino | LOCAL licence | MGA .com only | Blocked / redirected |
| --- | --- | --- | --- |
| AHTI Games | GB, SE, DK | FI, IE shown (proxy unreliable) | **AT blocked** |
| BacanaPlay | PT (.pt, SRIJ 25), BR (.bet.br, SPA 374/2025), ES (bacanaplay.es, DGOJ), GB, SE, DK | — | **AT blocked** |
| Casino RedKings | GB, SE | IE (proxy unreliable) | **AT blocked**, **DK → SlotsMagic** |
| DrückGlück | DE (.de, GGL 29.12.2022), GB, SE, DK | — | **AT blocked** |
| EUcasino | GB, SE, DK (eucasino.dk → /dk/) | CA | **AT blocked** |
| JackpotStar | GB, SE | CA (/fr-ca, MGA /06) | **AT blocked**, **DK → PlayOJO** ("ikke tilgængeligt i Danmark") |
| MegawaysCasino | GB, **SE, DK** | MT, CA, IE | — |
| PlayOJO | GB, SE (/se/), DK (playojo.dk) | CA (/fr-ca, MGA), MX (.com, MGA) | **AT blocked**, **ES: playojo.es → playuzu.es**, **playojo.mx does not resolve** |
| PlayOJO Bingo | GB (playojo.com/bingo/) | — | — |
| PlayUZU | ES (DGOJ), MX (SEGOB), PE (MINCETUR), AR (LOTBA — City of Buenos Aires only), BR (SPA 374/2025) | DK: Latin-American .com site, no licence line | **AT blocked** |
| Regency Casino Online | GR (HGC-000049-LH), GB (UKGC), DK (/dk/) | — | — |
| SlotsMagic | GB, SE, DK | CA (MGA /06) | **AT blocked** |
| TurboNino | GB, SE, DK, DE (turbonino.de, GGL 29.12.2022) | FI not determinable (proxy exited in US) | — |

### Superfly Partners (White Hat Gaming)

All six brands behave identically: one site, two licences — UKGC account
52894 for Great Britain and MGA/B2C/370/2017 "for all other customers".

| Casino | LOCAL licence | MGA .com only | Blocked |
| --- | --- | --- | --- |
| Hello Casino | GB | IE, MT, FI, NO, SE, NZ, CL, MX, IN, DK | CA: Ontario block page on first try; rest of Canada served the international site |
| Slotnite | GB | IE, MT, CA (CA$ offer), FI, NO, NZ | — |
| Skol Casino | GB | IE, MT, CA (CA$ offer), FI, NO, NZ | — |
| G'day Casino | GB | IE, MT, CA (CA$ offer), FI, NO, NZ | — |
| Diamond7 | GB | IE, MT, CA (CA$ offer), FI, NO, NZ | — |
| 21 Privé | GB | IE, MT, CA (CA$ offer), FI, NO, NZ | — |

The site loading is not the same as being promotable. Superfly's T&Cs restrict
Denmark, and forbid Swedish and Finnish-language promotion, even though Hello
Casino loads in both. The Rest-of-World welcome terms exclude Norway although
the Norwegian visitor is shown that offer.

**Brand restricted list (DETECTED).** All six brands share one list, clause 7.1
of the MGA terms (v6.3, 2 July 2026), 111 countries; the GB terms carry none.
Among markets relevant here it restricts Austria, Denmark, Germany, Greece,
Italy, Spain, Portugal, the Netherlands, Estonia, Latvia, Lithuania, Poland,
Czech Republic, Slovakia, Hungary, Switzerland, France, the USA, Australia,
Argentina, Brazil, Peru, India and Serbia. It does **not** list Ireland, Malta,
Canada, Finland, Norway, Sweden, New Zealand, Chile or Mexico. The full list is
in `geo-checks.v1.json` → `restrictedLists`. Restriction is enforced at
registration, not on the homepage: the Danish visitor is served normally.

India is on the brand list, yet Superfly publishes India offer terms.

### Brothers Bet

| Casino | LOCAL licence | Blocked |
| --- | --- | --- |
| DragonBet | GB (UKGC account 64908) | Site admits "UK or Ireland" only; IE could not be verified (proxy). |

DragonBet's site also shows an Irish **betting** licence, GRAI-1185-RB-26-0001,
issued 4 September 2026. It covers betting, not casino.

### NetoPartners

| Casino | Served (international) | Blocked (HTTP 403 "Access Denied") |
| --- | --- | --- |
| GoldenPlay (goldenplaywin.com = goldenplay.com) | CA ($555 offer), DE (€7 no-deposit + welcome, Germany-specific creative), IT, FR, PL (zł offer), NL | **GB**, PT, NZ; IE also 403 but the IE proxy is unreliable |

**GoldenPlay's own User Agreement restricts the UK and Malta** (DETECTED,
goldenplay.com/user-agreement), along with Belgium, the Netherlands, Cyprus,
Lithuania, Bulgaria, New Brunswick, the USA, Australia and others — 30 in all.
Ireland is not on it. The page settings carry `"isRegulated": false`, the
agreement is governed by Costa Rican law, and no licence line renders on the
site; the Tobique licence is stated only by NetoPartners. The site does not
follow its own list consistently: it serves the Netherlands, and blocks
Ireland, Portugal and New Zealand, none of which it lists. After about 20
requests it also began refusing Canada and Germany, so part of the blocking may
be rate-based.

## Where our records disagree (CONTRADICTION)

1. **Austria is closed for every SkillOnNet brand tested — nine of nine.**
   The import bundles hold AT as `AVAILABLE` for AHTI Games, BacanaPlay, Casino
   RedKings, EUcasino, JackpotStar, PlayOJO, PlayUZU and SlotsMagic, from the
   22 September "всё что не запрещено — то разрешено" decision. The operator
   itself serves "The website isn't available from your region" to Austrian
   visitors, so any AT route lands on that page.
2. **Three Danish routes land in a refusal or an unlicensed site.**
   Casino RedKings → SlotsMagic; JackpotStar → PlayOJO; PlayUZU → its
   Latin-American .com site with no Danish licence. All three are `AVAILABLE`
   in DK in our bundles.
3. **PlayOJO ES and MX do not exist as PlayOJO.** The bundle names local
   domains playojo.es and playojo.mx; the first redirects to PlayUZU, the
   second does not resolve. Spain and Mexico are PlayUZU markets.
4. **Canada is MGA, not a provincial licence**, for EUcasino, JackpotStar,
   PlayOJO and SlotsMagic outside Ontario. This matches the 22 September Founder
   decision on Canada outside Ontario, but no Canadian regulator stands behind
   those rows.
5. **White Hat IE and MT routes point to the MGA international site.** Our
   IE and MT routes for the six Superfly brands are `ACTIVE_HEALTHY`; neither
   market has a local licence behind it. That is consistent with how those
   routes were authorised (INFERRED, Global-14), and it is now observed —
   subject to the IE proxy caveat.
6. **GoldenPlay excludes Great Britain, twice over.** GB is the market the
   rollout matrix and the Global-14 authority list for GoldenPlay; the site
   returns 403 to a UK visitor and its own User Agreement restricts the UK and
   Malta. The published IE profile could not be verified from a genuine Irish
   exit; IE is not on GoldenPlay's restricted list.
7. **Markets we under-record.** MegawaysCasino serves SE and DK under local
   licences (we hold GB only); BacanaPlay serves ES under DGOJ (not held);
   PlayUZU AR is live but limited to the City of Buenos Aires (we hold it as
   `RESTRICTED`).

Confirmed as recorded: Regency (GR, GB, DK), TurboNino (GB, SE, DK, DE),
DrückGlück (DE, GB, DK, SE), and GB, SE and DK for the other EGO brands except
those listed above.

## Route health

`lib/affiliate-health/checker.ts` fetches a route from our own infrastructure
and compares the final host. It does not request from the target market, and
SkillOnNet's block page is served with HTTP 200 on the brand's own host, so
every case in points 1–2 passes as `HEALTHY`. A market-aware check would need to
request from inside the market and look for the block and redirect texts
recorded here ("isn't available from your region", "ikke tilgængeligt i
Danmark", "Access Denied").

## Open

- **Swedish licence date.** PlayOJO, SlotsMagic, TurboNino and the other
  SkillOnNet Swedish pages state the Spelinspektionen licence is "giltig till och
  med 2026-03-20". The sites are live; the register should be read before Swedish
  availability is relied on.
- **Ireland and Finland** need a check from a genuine Irish or Finnish exit.
- **Ontario** needs a check from an Ontario exit.
- **EGO per-brand market list** is only in the affiliate back office, which
  needs the B4GAMBLE login.
