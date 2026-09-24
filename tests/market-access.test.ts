import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { egoExactRegulatoryEvidence } from "../lib/current-partner-worldwide-authority/ego-market-authority";
import { marketAccess, withholdClosedMarketOffers } from "../lib/market-access/access";
import { CASINO_MARKETS, MARKET_RULES } from "../lib/market-access/register";
import { OFFER_PRESENTATION_PROHIBITED_MARKETS } from "../lib/public-offer/offer-visibility";
import type { PublicCasinoDTO } from "../lib/public-casino/public-casino.types";

const evidenceDir = "research_staging/network-market-coverage-2026-09-24";
const registers = JSON.parse(readFileSync(`${evidenceDir}/regulator-registers.v1.json`, "utf8")) as {
  sweden: { rows: Array<Record<string, string | null>> };
  denmark: { skillOnNetOnlineCasinoDomains: string[] };
  greatBritain: { domainsByAccount: Record<string, string[]> };
};
const registry = JSON.parse(readFileSync("data/casino-registry.json", "utf8")) as { casinos: Array<{ slug: string; status: string }> };
const catalogue = registry.casinos.filter((casino) => casino.status !== "ARCHIVED").map((casino) => casino.slug);

// Monday 28 September 2026, 22:00 in Berlin: inside the German advertising window.
const berlinEvening = new Date("2026-09-28T20:00:00Z");

function openIn(market: string, now = berlinEvening) {
  return catalogue.filter((slug) => marketAccess(slug, market, now).open).sort();
}

test("every casino in the catalogue has a licence record", () => {
  assert.equal(catalogue.length, 28);
  for (const slug of catalogue) assert.ok(CASINO_MARKETS[slug], `${slug} has no entry in the market register`);
});

test("launch markets admit exactly the licensed casinos", () => {
  assert.deepEqual(openIn("GB"), [
    "21-prive", "ahti-games", "bacanaplay", "casino-redkings", "diamond7", "dragonbet", "drueckglueck", "eucasino",
    "gday-casino", "hello-casino", "jackpotstar", "megawayscasino", "playojo", "playojo-bingo", "regencycasino",
    "skol-casino", "slotnite", "slotsmagic", "turbonino",
  ]);
  assert.deepEqual(openIn("SE"), [
    "ahti-games", "bacanaplay", "betsafe", "betsson", "casino-redkings", "drueckglueck", "eucasino", "jackpotstar",
    "megawayscasino", "nordicbet", "playojo", "playuzu", "regencycasino", "slotsmagic", "turbonino",
  ]);
  assert.deepEqual(openIn("DK"), [
    "ahti-games", "bacanaplay", "betsson", "drueckglueck", "eucasino", "megawayscasino", "nordicbet", "playojo",
    "slotsmagic", "turbonino",
  ]);
  assert.deepEqual(openIn("DE"), ["drueckglueck", "turbonino"]);
});

test("each closed market names why it is closed", () => {
  const cases: Array<[string, string, string]> = [
    ["casino-redkings", "DK", "OPERATOR_BLOCKS"],
    ["jackpotstar", "DK", "OPERATOR_BLOCKS"],
    ["playuzu", "DK", "NO_LOCAL_LICENCE"],
    ["regencycasino", "DK", "NO_LOCAL_LICENCE"],
    ["goldenplay", "DK", "NO_LOCAL_LICENCE"],
    ["goldenplay", "SE", "NO_LOCAL_LICENCE"],
    ["goldenplay", "GB", "OPERATOR_BLOCKS"],
    ["hello-casino", "SE", "NO_LOCAL_LICENCE"],
    ["hello-casino", "DK", "NO_LOCAL_LICENCE"],
    ["playuzu", "GB", "NO_LOCAL_LICENCE"],
    ["playojo", "DE", "NO_LOCAL_LICENCE"],
    ["playojo", "AT", "OPERATOR_BLOCKS"],
    ["goldenplay", "AT", "NO_LOCAL_LICENCE"],
    ["goldenplay", "NO", "PROHIBITED_BY_LAW"],
    ["starcasino", "IT", "PROHIBITED_BY_LAW"],
    ["eucasino", "CA-ON", "OPERATOR_BLOCKS"],
    ["hello-casino", "CA-AB", "GREY_ZONE_CLOSED"],
  ];
  for (const [slug, market, closure] of cases) {
    assert.deepEqual(marketAccess(slug, market, berlinEvening), { open: false, closure }, `${slug} in ${market}`);
  }
});

test("grey-zone and unregulated markets stay open", () => {
  for (const slug of ["goldenplay", "hello-casino", "dragonbet", "playojo"]) {
    assert.deepEqual(marketAccess(slug, "IE", berlinEvening), { open: true }, `${slug} in IE`);
  }
  assert.deepEqual(marketAccess("playojo", "CA-ON", berlinEvening), { open: true });
  assert.deepEqual(marketAccess("playojo", "KZ", berlinEvening), { open: true }, "no rule is not a prohibition");
  assert.deepEqual(marketAccess("playojo", null, berlinEvening), { open: true });
});

test("an unknown casino is closed wherever a local licence is required", () => {
  assert.deepEqual(marketAccess("", "GB", berlinEvening), { open: false, closure: "NO_LOCAL_LICENCE" });
  assert.deepEqual(marketAccess("not-a-casino", "SE", berlinEvening), { open: false, closure: "NO_LOCAL_LICENCE" });
});

test("Germany opens only between 21:00 and 06:00 Berlin time", () => {
  const at = (iso: string) => marketAccess("drueckglueck", "DE", new Date(iso));
  const outside = { open: false, closure: "OUTSIDE_ADVERTISING_WINDOW" };
  // Summer time, UTC+2.
  assert.deepEqual(at("2026-09-28T18:59:59Z"), outside, "20:59 CEST");
  assert.deepEqual(at("2026-09-28T19:00:00Z"), { open: true }, "21:00 CEST");
  assert.deepEqual(at("2026-09-29T03:59:59Z"), { open: true }, "05:59 CEST");
  assert.deepEqual(at("2026-09-29T04:00:00Z"), outside, "06:00 CEST");
  assert.deepEqual(at("2026-09-29T10:00:00Z"), outside, "midday");
  // Winter time, UTC+1.
  assert.deepEqual(at("2026-12-01T19:59:59Z"), outside, "20:59 CET");
  assert.deepEqual(at("2026-12-01T20:00:00Z"), { open: true }, "21:00 CET");
  assert.deepEqual(at("2026-12-02T04:59:59Z"), { open: true }, "05:59 CET");
  assert.deepEqual(at("2026-12-02T05:00:00Z"), outside, "06:00 CET");
  // The window never opens an unlicensed casino.
  assert.equal(marketAccess("playojo", "DE", new Date("2026-09-28T20:00:00Z")).open, false);
});

test("the Swedish entries are on the Spelinspektionen register", () => {
  const urls = new Set(registers.sweden.rows
    .filter((row) => row.Status === "Aktiv" && row.Licenstyp === "Kommersiellt online")
    .map((row) => String(row.Webbadress).toLowerCase()));
  for (const [slug, casino] of Object.entries(CASINO_MARKETS)) {
    const entry = casino.licensed.SE;
    if (entry) assert.ok(urls.has(entry.toLowerCase()), `${slug}: ${entry} is not an active Swedish online licence`);
  }
});

test("the Danish SkillOnNet entries are on the Spillemyndigheden register", () => {
  const domains = new Set(registers.denmark.skillOnNetOnlineCasinoDomains);
  const nonSkillOnNet = new Set(["betsson", "nordicbet"]);
  for (const [slug, casino] of Object.entries(CASINO_MARKETS)) {
    const entry = casino.licensed.DK;
    if (entry && !nonSkillOnNet.has(slug)) assert.ok(domains.has(entry), `${slug}: ${entry} is not a registered Danish domain`);
  }
});

test("the British entries are on the UKGC domain register", () => {
  const domains = new Set(Object.values(registers.greatBritain.domainsByAccount).flat());
  for (const [slug, casino] of Object.entries(CASINO_MARKETS)) {
    const entry = casino.licensed.GB;
    if (!entry || entry === "FOUNDER-EGO-2026-09-22") continue;
    assert.ok(domains.has(entry), `${slug}: ${entry} is not a registered UKGC domain`);
  }
});

test("the German entries match the GGL whitelist evidence", () => {
  for (const [slug, casino] of Object.entries(CASINO_MARKETS)) {
    assert.equal(Boolean(casino.licensed.DE), Boolean(egoExactRegulatoryEvidence(slug, "DE")), `${slug} in DE`);
  }
});

test("a market has one rule: the prohibition list is not repeated", () => {
  for (const market of Object.keys(MARKET_RULES)) {
    assert.equal(market.slice(0, 2) in OFFER_PRESENTATION_PROHIBITED_MARKETS, false, `${market} is already prohibited`);
  }
  for (const [slug, casino] of Object.entries(CASINO_MARKETS)) {
    for (const market of Object.keys(casino.licensed)) {
      const country = market.slice(0, 2);
      assert.ok(MARKET_RULES[market] ?? MARKET_RULES[country] ?? OFFER_PRESENTATION_PROHIBITED_MARKETS[country], `${slug}: ${market} has no market rule`);
    }
  }
});

test("a closed market keeps the review and loses the offer", () => {
  const casino = {
    slug: "playojo",
    bonuses: [{ id: "bonus" }],
    offerPresentation: { selectedOffer: { id: "bonus" }, relation: "EXACT", sourceCountryCode: "DE", presentationCountryCode: "DE", currentMarketVerified: true },
    summary: "Review",
  } as unknown as PublicCasinoDTO;
  const withheld = withholdClosedMarketOffers(casino, "DE", berlinEvening);
  assert.deepEqual(withheld.bonuses, []);
  assert.equal(withheld.offerPresentation?.relation, "NONE");
  assert.equal(withheld.offerPresentation?.selectedOffer, null);
  assert.equal(withheld.summary, "Review");
  assert.equal(withholdClosedMarketOffers(casino, "GB", berlinEvening), casino, "an open market is untouched");
});
