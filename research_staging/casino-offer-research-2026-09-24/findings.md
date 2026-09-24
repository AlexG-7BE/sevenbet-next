# Offer research — 24 September 2026

Scope: the eight published casinos with no offer on record — AHTI Games,
Casino RedKings, DragonBet, EUcasino, MegawaysCasino, Regency Casino Online,
SlotsMagic, TurboNino.

## Reachability

Research ran from a Kazakhstan IP. Seven of the eight operator sites refused
the connection, and the refusals are regulatory rather than anti-bot:

| Site | Result |
| --- | --- |
| slotsmagic.com | **reachable** — served the MGA/.com variant |
| regencycasino.gr | blocked: "accessible only from Greece, per the Greek regulatory framework" |
| dragonbet.co.uk | blocked: "IP address is from outside UK or Ireland" |
| ahtigames.com, redkings.com, eucasino.com, megawayscasino.com, turbonino.com | connection refused |

A general VPN is not sufficient. Each site must be reached from an exit node
in its own market — Greece for Regency, UK or Ireland for DragonBet — because
the restriction is the operator complying with its licence, not bot filtering.
An offer read from the wrong country is also the wrong offer: market variants
differ, so a GB welcome offer cannot be captured from a German exit node.

## SlotsMagic — complete welcome offer (.com / MGA variant)

Source: <https://slotsmagic.com/promotions/welcome-offer/>, read 24 Sep 2026.

- 100% match, maximum bonus EUR 100, plus 50 free spins
- Minimum deposit EUR 10
- Wagering 30x deposit + bonus; 60x free-spin winnings, slots only
- Maximum bet 10% (minimum EUR 0.10) of free-spin winnings and bonus amount,
  or EUR 5 — whichever is lower
- Free spins on Big Bass Bonanza at EUR 0.10 spin value
- First deposit only, credited automatically
- Claimable once per 72 hours across all casinos on the platform

**Scope caution.** This is the .com site as served to a Kazakhstan request,
which is the MGA/international variant. It is *not* the Great Britain offer;
the UKGC site is a different variant. SlotsMagic is published here for AT, CA,
DK, GB and SE, and this offer matches none of them exactly. Recording it would
mean either the global/ROW model (`casinoCountryId` null, `geoMode` GLOBAL) or
leaving it unpublished. It must not be attached to GB.

## Malta licence — primary-source verification

The bundles record the Malta licence for every SkillOnNet .com brand as
"Active (number not primary-verified)". Two sources now close part of that.

**Operator footer** (slotsmagic.com, every page): Skill On Net Limited, Office
1/5297 Level G, Quantum House, 75 Abate Rigord Street, Ta' Xbiex XBX 1120,
Malta, licence **MGA/CRP/171/2009/01**, issued 1 August 2018.

**MGA URL Checker** (<https://mgaurlchecker.mga.org.mt/>, register last updated
24/09/2026) — the regulator's own register, and not geo-blocked:

- `slotsmagic.com` — listed, Skill On Net Limited
- `turbonino.com` — listed **twice**: Skill On Net Limited *and* Titanium Brace
  Marketing Limited

The second entry is worth resolving before the licence status is upgraded
anywhere. Two MGA licensees carrying the same domain is normal for a white-label
arrangement, but our record names only Skill On Net Limited, and which entity
actually operates the brand determines who a player complains to.

**Score implication, deliberately not acted on.** `classifyLicenceStatus`
scores a flagged licence at +0.2 and a verified one at +0.5, so upgrading the
Malta status would raise the trust component for roughly ten casinos and move
their Editor Scores. The Founder decided on 23 September not to disturb
published scores, so this is recorded as evidence only.

## Great Britain — seven offers captured (UK exit node)

All seven sites opened from a London exit node and served their GB variant.
Terms are in `data/casino-global-catalog-01/offers-gb.v1.json`, each read from
the operator's own promotions page.

Two of the seven contradict themselves, and in both cases the offer page was
recorded rather than the banner:

- **TurboNino** — the home banner says 10x wagering, the offer page says **60x**.
  Sixty is six times what every sibling brand asks for the same shape of offer,
  and is the single most important term on that page.
- **AHTI Games** — the page headline says "100 Super Spins", its own terms say a
  maximum of 50.

Four operators state no minimum deposit on the offer page. That is recorded as
null rather than copied from a sibling brand.

## Sweden — verified absence, nothing to import

From a Stockholm exit node, all five Swedish variants — TurboNino, SlotsMagic,
AHTI Games, RedKings and EUcasino — serve `/se/` with **no promotions section
in the navigation and no bonus link anywhere on the page**.

This is consistent with Swedish law rather than a scraping failure: the
Spellagen permits one bonus per player, offered only at the first occasion of
gambling, so licensees do not run visible welcome-bonus marketing. The five
Swedish routes therefore have no offer to attach, and that is the correct
outcome rather than a gap to fill.

## Denmark — three offers, and one route that earns nothing

From a Copenhagen exit node, TurboNino, AHTI Games and SlotsMagic all publish
the same Danish welcome: 100% up to 200 kr, minimum 100 kr, wagering 10x
deposit plus bonus, maximum bet 50 kr, slots only. Terms are in
`offers-dk.v1.json`. TurboNino serves the Danish terms in its home banner while
`/promotions/welcome-offer/` still shows the euro variant; the banner is the
Danish offer and is what was recorded.

**Casino RedKings is not available in Denmark.** Its own site tells Danish
visitors "Desværre er RedKings ikke tilgængeligt i Danmark" and redirects them
to SlotsMagic. Our record has it as `AVAILABLE` with an `ACTIVE`, `HEALTHY` DK
route, so Danish traffic is being sent into a rejection.

### Route health cannot see this

`lib/affiliate-health/checker.ts` fetches the route from our own
infrastructure and compares the final host to the expected one. It has no
notion of the market the route is for, so a destination that refuses the target
country passes as `HEALTHY`. Every one of the 77 active routes could be in this
state undetected.

Of sixteen routes opened from inside their own market — seven GB, five SE, four
DK — one was dead. At that rate roughly four or five of the 77 are earning
nothing while consuming paid traffic. Closing that is worth more than any
individual offer.

## Remaining, for a session with per-market exit nodes

Offers for AHTI Games, Casino RedKings, DragonBet, EUcasino, MegawaysCasino,
Regency Casino Online and TurboNino. Each needs an exit node in a market the
casino is published for, and the offer must be recorded against that exact
market. TurboNino is Pay N Play and may genuinely have no welcome offer; an
absence confirmed from a Swedish exit node is itself a useful result.
