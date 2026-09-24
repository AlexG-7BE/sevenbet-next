# Market coverage by affiliate network — 24 September 2026

Which markets each partner casino actually serves, checked three ways: against
the affiliate networks' own sites, against what a player in each country is
served today, and against the regulators' own registers.

Research only. Nothing in the database, the import bundles or the partner
routes was changed.

| File | What it holds |
| --- | --- |
| [`geo-checks.v1.json`](geo-checks.v1.json) | First pass: Firecrawl scrapes through country proxies, 142 rows, plus the brands' restricted-country lists |
| [`real-exit-checks.v1.json`](real-exit-checks.v1.json) | Second pass: Globalping probes with verified local IPs, 91 rows, including the operator's own country/licence detection |
| [`regulator-registers.v1.json`](regulator-registers.v1.json) | Extracts from Spelinspektionen, Spillemyndigheden, iGaming Ontario and the UKGC domain registers |
| [`grai-register-2026-09-21.csv`](grai-register-2026-09-21.csv) | The full Irish GRAI licence register as downloaded |

## Method

1. **Network sites.** egamingonline.com (EGO), superflypartners.net
   (Superfly), netopartners.com (NetoPartners), affiliates.brothers.bet
   (Brothers Bet), betssongroup.com and betssongroupaffiliates.com (Betsson
   Group) were read for the brands each carries and the markets each names.
2. **Country proxies (Firecrawl).** Every brand × market we hold was opened
   through Firecrawl with `location.country`.
3. **Exit verification.** Each Firecrawl country was then checked against
   ipinfo.io. **GB, AT, DK, SE, DE, ES, GR, IT, MX and CA (Montréal) exit in
   the right country. IE, FI, PT, NZ, MT and NO exit in the United States**,
   in every proxy mode tried (basic, stealth, enhanced, mobile). Every Firecrawl
   row for those six countries is void and was redone in step 4.
4. **Real local exits.** Globalping HTTP probes, whose geolocation was confirmed
   the same way (Dublin, Helsinki, Valletta/Qormi/Ħamrun, Sandefjord, Auckland,
   Lisbon, Toronto, Lima, Buenos Aires, São Paulo, Thessaloniki, Vienna,
   Copenhagen, Stockholm), and check-host.net nodes (UK, PT, FI, AT, DE, NL, IT,
   PL, SE, Vancouver, US) for status codes. SkillOnNet pages embed a
   `SON_CONFIG` object that states the country and region the operator detected,
   the licence it applied, the currency and the page component served
   (`block`, `danish-block`, `ontario-block`), which removes any guesswork.
5. **Regulator registers**, read directly: Spelinspektionen (SE),
   Spillemyndigheden (DK), iGaming Ontario, UKGC domain registers, GRAI (IE).

Classification: **LOCAL** — a country-licensed version; **MGA** — the
international version under a Malta or offshore licence, no local licence;
**BLOCKED** — a geo-block page or HTTP 403; **REDIRECT** — sent to another
brand.

## Which casino belongs to which network

| Network | Casinos in our catalogue |
| --- | --- |
| EGO (eGamingOnline, SkillOnNet) | AHTI Games, BacanaPlay, Casino RedKings, DrückGlück, EUcasino, JackpotStar, MegawaysCasino, PlayOJO, PlayOJO Bingo, PlayUZU, Regency Casino Online, SlotsMagic, TurboNino |
| Superfly Partners (White Hat Gaming) | 21 Privé, Diamond7, G'day Casino, Hello Casino, Skol Casino, Slotnite |
| Brothers Bet Affiliates | DragonBet |
| NetoPartners (Anakatech) | GoldenPlay |
| Betsson Group Affiliates | Betsafe, Betsson, Inkabet, NordicBet, Rizk, StarCasino, SuperCasino |

## What each network says about its markets

**EGO.** One line per brand on the brands page: Regency "GREEK Launch",
MegawaysCasino "UK and COM Launch", PlayOJO "UK, CA and SE TV Advertised",
PlayUZU "Spain, Latam and Mexico", BacanaPlay "Portugal and Brazil",
DrückGlück "German TV Advertised", TurboNino "PaynPlay SE, DE & FI",
JackpotStar "UK, Sweden and MGA", and only "Multi Markets" or a slogan for AHTI
Games, EUcasino, RedKings and SlotsMagic. The affiliate T&Cs restrict the USA,
Cyprus, Israel, Turkey and France for all brands, and carry market rules for
Germany, the UK, Spain, Sweden, Ontario, Denmark and Greece. Press releases:
Regency live in Greece from May 2026 with the UK, Denmark, Spain, Sweden and
Germany announced as later roll-outs; MegawaysCasino relaunched in the UK in
March 2026 and on .com under MGA in May 2026; PlayOJO and SlotsMagic in Ontario
since June 2022. The per-brand market list sits behind the affiliate login.

**Superfly.** "All our brands are licensed in the UK and Malta." Wanted
traffic: UK, Ireland, Canada, Finland, Norway, Chile, Mexico. Affiliate T&Cs
(effective 1 October 2026) restrict, among others, Austria, Denmark, Germany,
Estonia, Latvia, Lithuania, Italy, Spain, Portugal, the Netherlands, France,
the USA and Australia, and forbid advertising in Swedish, Finnish or Dutch or on
.se, .fi or .nl sites. Since 19 January 2026 all six UK brands run one
wager-free, points-based welcome offer (minimum deposit £20, 14 days, spin
winnings capped at £100 per batch).

**Brothers Bet.** DragonBet and Gentleman Jim, "fully licensed online betting
sites for UK players".

**NetoPartners.** GoldenPlay: Tobique licence, EUR, minimum deposit €10,
languages EN, FR, IT, PL, PT, NL, DE. No market list.

**Betsson Group.** betssongroup.com names brands, not markets. The BGA Betsson
page lists Betsson.es, .co, .mx, .gr, Argentina (City, Córdoba, Province), CL,
DK, IS, LATAM (BO, EC, PY, UY), PE and a Swedish site; NordicBet is for "Nordic
customers — particularly those from Sweden", Inkabet for "all Peruvians". The
per-market record for these brands is
[Global-14](../../docs/06_Operations/Global-14-Casino-Worldwide-Market-Authority-2026-09-10.md);
only their Swedish, Danish and Ontario register entries were re-read today.

## Registry

### EGO (SkillOnNet)

| Casino | LOCAL licence | MGA only | Blocked / redirected |
| --- | --- | --- | --- |
| AHTI Games | GB, SE, DK | IE, MT, FI | **AT**, **Ontario** |
| BacanaPlay | PT (licence PT), BR (licence BR), ES (DGOJ), GB, SE, DK | IE, MT, FI | **AT**, **Ontario** |
| Casino RedKings | GB, SE | IE, MT, FI | **AT**, **DK** (`danish-block` → SlotsMagic), **Ontario** |
| DrückGlück | DE (GGL), GB, SE, DK | IE, MT, FI | **AT**, **Ontario** |
| EUcasino | GB, SE, DK | IE, MT, FI, CA outside Ontario | **AT**, **Ontario** |
| JackpotStar | GB, SE | IE, MT, FI, CA outside Ontario | **AT**, **DK** (`danish-block` → PlayOJO), **Ontario** |
| MegawaysCasino | GB, **SE, DK** | IE, MT, FI, CA outside Ontario | **Ontario** |
| PlayOJO | GB, SE, DK (playojo.dk), **Ontario (playojo.ca)** | IE, MT, FI, CA outside Ontario, MX (.com) | **AT**; **ES → PlayUZU**; playojo.mx does not exist |
| PlayOJO Bingo | GB | — | — |
| PlayUZU | ES, MX, PE, AR (City of Buenos Aires only), BR | DK (MGA, prices in DKK, no Danish licence) | **AT** |
| Regency Casino Online | GR, GB, SE (regencycasino.se on the Swedish register) | — | DK: site serves /dk/ but see contradiction 6 |
| SlotsMagic | GB, SE, DK, **Ontario (slotsmagic.ca)** | IE, MT, FI, CA outside Ontario | **AT** |
| TurboNino | GB, SE, DK, DE (GGL) | IE, MT, FI | **Ontario** |

In Ontario every SkillOnNet .com brand serves an `ontario-block` page; only
PlayOJO and SlotsMagic redirect to Ontario-licensed sites, which matches the
iGaming Ontario operator list (Skill On Net Ltd: PlayOJO, SlotsMagic).

### Superfly Partners (White Hat Gaming)

One site per brand, two licences: UKGC account 52894 for Great Britain (active,
all six domains on the register) and MGA/B2C/370/2017 "for all other
customers".

| Casino | LOCAL licence | Players accepted (MGA) per the brand's terms | Restricted |
| --- | --- | --- | --- |
| Hello Casino, Slotnite, Skol Casino, G'day Casino, Diamond7, 21 Privé | GB | IE, MT, CA outside Ontario, FI, NO, SE, NZ, CL, MX | 111 countries in the brands' MGA terms (v6.3, 2 July 2026), including DK, AT, DE, ES, PT, IT, NL, GR, IN, BR, PE, AR; Ontario (not on the iGO list; Hello serves a "Country Blocked — Ontario" page) |

White Hat's sites put a bot challenge ("Human Verification", HTTP 405) in front
of every Globalping probe, and serve their homepage even to restricted
countries, so a homepage test says nothing either way for these brands. The
evidence for IE, MT, FI, NO, SE and NZ is the brand's own restricted list
(none of them on it), its country-specific welcome terms (Canada; Finland,
Norway, New Zealand, Sweden; Rest of World) and Superfly naming Ireland as a
target market. White Hat holds no Swedish licence (not on the Spelinspektionen
register) and no Danish licence.

### Brothers Bet

| Casino | LOCAL licence | Other |
| --- | --- | --- |
| DragonBet | GB (UKGC 64908, active) | Serves Ireland (real Dublin probe, 200). Irish licence GRAI-1185-RB-26-0001 covers **remote betting only**. Blocks every other country tested (403). |

### NetoPartners

| Casino | Served (offshore, no local licence) | Blocked (HTTP 403) |
| --- | --- | --- |
| GoldenPlay (goldenplaywin.com = goldenplay.com) | IE, MT, NO, NZ (Globalping); PT, FI, AT, DE, NL, IT, PL, SE, CA (check-host) | **GB**, US |

GoldenPlay's User Agreement restricts the UK and Malta among 30 countries; the
page settings carry `"isRegulated": false`, the agreement is governed by Costa
Rican law, and no licence line renders on the site. The Tobique licence is
stated only by NetoPartners. The earlier 403s for IE, PT and NZ came from
US-exit proxies (the US is on its list) and are withdrawn.

## Regulator registers (DETECTED)

- **Sweden — Spelinspektionen.** Skill On Net Ltd, licence 709867263,
  "Kommersiellt online", **active**, from 2025-03-21 with no end date; the
  "giltig till och med 2026-03-20" line in the brands' footers is out of date.
  Licensed URLs include ahtigames.com/sv, bacanaplay.com/se,
  drueckglueck.com/se, eucasino.com/se, Jackpotstar.com/se,
  megawayscasino.com/se, playojo.com/se, playuzu.com/se, redkings.com/se,
  **regencycasino.se**, slotsmagic.com/se and turbonino.com/se. Betsson: the
  Betsson Nordic Ltd online licence for betsson.com/sv **ends 2026-09-30**; a
  new Spin Nordic Ltd licence for www.betsson.com/sv runs 2026-08-24 to
  2031-08-23. NordicBet (NGG Nordic Ltd) and Betsafe (BS Nordic Ltd) run to
  2028-12-31. White Hat Gaming, GoldenPlay and DragonBet are not on the register.
- **Denmark — Spillemyndigheden** (updated 20 August 2026). Skill on Net
  Limited, online casino, 59 domains, including ahtigames.com,
  bacanaplay.com, drueckglueck.com/.dk, eucasino.com/.dk,
  megawayscasino.com/dk, playojo.com/.dk, slotsmagic.com/.dk and
  turbonino.com. **Not listed: redkings, jackpotstar, playuzu, regencycasino.**
  BML Group Ltd holds betsson.dk and nordicbet.dk. White Hat Gaming is not
  listed.
- **Ontario — iGaming Ontario.** 84 brands. Of ours, only **PlayOJO and
  SlotsMagic**. No Betsson Group brand, no White Hat brand, no other
  SkillOnNet brand.
- **Great Britain — UKGC.** Skill On Net (39326, licence
  039326-R-319358-**061**, active; our bundles cite -059), White Hat Gaming
  (52894, active) and DragonBet (64908, active) all list every GB domain we
  route to, including regencycasino.com.
- **Ireland — GRAI** (updated 21 September 2026). 36 licences, **all
  betting** (remote betting from 1 July 2026). No gaming (casino) licence has
  been issued; the GRAI says gaming licensing will follow in later phases and
  gaming licences remain with the Revenue Commissioners until then. Casino
  operators with an MGA licence currently serve Ireland without an Irish casino
  licence, and that will change when GRAI's gaming phase opens.

## Where our records disagree (CONTRADICTION)

1. **Austria is closed by every SkillOnNet brand tested.** Real Vienna probes
   receive `page: "block"` ("The website isn't available from your region").
   The bundles hold AT as `AVAILABLE` for AHTI Games, BacanaPlay, Casino
   RedKings, EUcasino, JackpotStar, PlayOJO, PlayUZU and SlotsMagic.
2. **Three Danish rows are wrong.** Casino RedKings and JackpotStar serve
   `danish-block`, and PlayUZU serves an unlicensed MGA site; none of the three
   domains is on the Danish register. All three are `AVAILABLE` in DK in our
   bundles.
3. **PlayOJO ES and MX do not exist as PlayOJO.** playojo.es redirects to
   PlayUZU; playojo.mx does not resolve.
4. **Canada outside Ontario is MGA, not a provincial licence**, for EUcasino,
   JackpotStar, PlayOJO, SlotsMagic, MegawaysCasino and the White Hat brands.
   Ontario is blocked for all of them except PlayOJO and SlotsMagic, which have
   their own Ontario sites. Betsafe is **not** on the iGaming Ontario list,
   although Global-14 holds Betsafe CA-ON as supported pending authority.
5. **GoldenPlay excludes Great Britain**, by its own terms and by a 403 to UK
   visitors. GB is the market the rollout matrix and Global-14 list for it.
   Ireland, its published market, is served.
6. **Regency Denmark is not on the Danish register.** The site serves a
   Danish /dk/ version with a Spillemyndigheden footer, but regencycasino is
   absent from Skill on Net Limited's 59 registered domains (register dated
   20 August 2026). Treat DK as unconfirmed until the register lists it.
7. **Markets we under-record.** MegawaysCasino serves SE and DK under local
   licences (we hold GB only); BacanaPlay serves ES under DGOJ; Regency is on
   the Swedish register (regencycasino.se); PlayUZU AR is live but limited to
   the City of Buenos Aires.
8. **Betsson Sweden changes licensee on 30 September 2026** — from Betsson
   Nordic Ltd to Spin Nordic Ltd. Our SE record should name the new entity.
9. **Skill On Net's UKGC licence number** is now 039326-R-319358-061.

Confirmed as recorded: Regency GR and GB; TurboNino GB, SE, DK, DE; DrückGlück
DE, GB, DK, SE; GB, SE and DK for AHTI Games, BacanaPlay, EUcasino, PlayOJO and
SlotsMagic; SE for RedKings and JackpotStar; the White Hat brands' GB; DragonBet
GB.

## Legal markets we cannot promote in, whatever the site serves

Finland (Veikkaus monopoly until the 2027 licensing regime), Norway (Norsk
Tipping monopoly), New Zealand (Online Casino Gambling Act 2026, only DIA
licensees from 1 December 2026) and Sweden for any operator not on the
Spelinspektionen register — which covers every White Hat brand. The SkillOnNet
and White Hat sites do serve Finland, and White Hat accepts Norway, New Zealand
and Sweden under its MGA licence; that does not make them promotable. These rows
were already recorded as blocked by law in the rollout matrix and the EGO source
note.

## Route health

`lib/affiliate-health/checker.ts` fetches a route from our own infrastructure
and compares the final host. It does not request from the target market, and
SkillOnNet's block pages are served with HTTP 200 on the brand's own host, so
the routes in contradictions 1 and 2 pass as `HEALTHY`. SkillOnNet's
`SON_CONFIG.page` value (`block`, `danish-block`, `ontario-block`) is a
reliable machine signal for a market-aware check run from inside each market.

## Not re-verified today

- **The MGA licence register.** The MGA URL checker could not be driven from
  this environment. The MGA numbers come from each site's footer
  (MGA/B2C/370/2017 for White Hat; MGA/CRP/171/2009/01 and /06 for SkillOnNet),
  and slotsmagic.com and turbonino.com were confirmed on the MGA URL checker
  earlier on 24 September.
