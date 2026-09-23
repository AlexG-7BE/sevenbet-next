import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import {
  deriveCategories,
  deriveCorporateLicences,
  deriveCurrencies,
  deriveGlobalCatalog,
  deriveLanguages,
  deriveOperator,
  derivePayments,
  deriveProviders,
  type DerivationMarket,
} from "../lib/casino-global-catalog/derivation";

function market(overrides: Partial<DerivationMarket> & { countryCode: string }): DerivationMarket {
  return {
    availability: "AVAILABLE",
    operatingLegalEntity: null,
    primaryLanguage: null,
    supportLanguages: [],
    supportedLanguages: [],
    primaryCurrency: null,
    supportedCurrencies: [],
    payments: [],
    providers: [],
    categories: [],
    ...overrides,
  };
}

function provider(key: string, name = key) {
  return { key, name, gameCount: null, liveCasino: null };
}

function category(key: string, name = key) {
  return { key, name, gameCount: null, featured: false };
}

function payment(key: string, name = key) {
  return {
    key,
    name,
    supportsDeposits: true,
    supportsWithdrawals: true,
    currencies: [],
    minimumDeposit: null,
    minimumWithdrawal: null,
    maximumWithdrawal: null,
    depositProcessingTime: null,
    withdrawalTime: null,
    fees: null,
    crypto: null,
  };
}

test("catalog intersection promotes only rows evidenced in every contributing market", () => {
  const markets = [
    market({ countryCode: "GB", providers: [provider("playtech"), provider("netent"), provider("evolution")] }),
    market({ countryCode: "SE", providers: [provider("netent"), provider("playtech")] }),
  ];
  assert.deepEqual(deriveProviders(markets).map((entry) => entry.key), ["playtech", "netent"]);
});

test("markets without evidence of a kind do not veto the intersection", () => {
  // TurboNino holds provider rows for GB and SE only; DE, DK, FI, IN and NO
  // carry none. Treating an absent row set as an empty set would erase the
  // brand catalogue entirely.
  const markets = [
    market({ countryCode: "DE" }),
    market({ countryCode: "GB", providers: [provider("playtech"), provider("netent")] }),
    market({ countryCode: "SE", providers: [provider("playtech"), provider("netent")] }),
  ];
  assert.deepEqual(deriveProviders(markets).map((entry) => entry.key), ["playtech", "netent"]);
});

test("a market-specific payment rail is never promoted to the global layer", () => {
  // MB Way is a Portuguese rail. Promoting it globally would let the exact-market
  // merge assert it in markets that never listed it.
  const markets = [
    market({ countryCode: "PT", payments: [payment("mbway"), payment("visa")] }),
    market({ countryCode: "GB", payments: [payment("visa"), payment("paypal")] }),
  ];
  assert.deepEqual(derivePayments(markets).map((entry) => entry.key), ["visa"]);
});

test("derived catalog rows stay a subset of every contributing market", () => {
  const markets = [
    market({ countryCode: "GB", categories: [category("slots"), category("live-casino"), category("bingo")] }),
    market({ countryCode: "SE", categories: [category("slots"), category("live-casino")] }),
    market({ countryCode: "DE", categories: [category("slots")] }),
  ];
  const derived = deriveCategories(markets).map((entry) => entry.key);
  assert.deepEqual(derived, ["slots"]);
  for (const entry of markets.filter((candidate) => candidate.categories.length)) {
    const keys = new Set(entry.categories.map((row) => row.key));
    assert.ok(derived.every((key) => keys.has(key)), `${entry.countryCode} must already assert every derived category`);
  }
});

test("payment intersection is empty when markets share no rail", () => {
  // TurboNino: GB is card/PayPal, SE is Trustly/Zimpler Pay N Play. An empty
  // global payment set is the truthful outcome.
  const markets = [
    market({ countryCode: "GB", payments: [payment("visa-debit"), payment("paypal")] }),
    market({ countryCode: "SE", payments: [payment("trustly"), payment("zimpler")] }),
  ];
  assert.deepEqual(derivePayments(markets), []);
});

test("operator resolves to the normalized corporate entity behind the brand", () => {
  const markets = [
    market({ countryCode: "GB", operatingLegalEntity: "Skill On Net Limited (UKGC account 39326; head office Limassol, Cyprus)" }),
    market({ countryCode: "SE", operatingLegalEntity: "Skill On Net Ltd (C50024)" }),
    market({ countryCode: "DE", operatingLegalEntity: "Skill On Net Ltd (GGL permit holder)" }),
    market({ countryCode: "DK", operatingLegalEntity: "Skill On Net Ltd (assumed for .com brand — confirm from site footer)" }),
  ];
  assert.equal(deriveOperator(markets), "Skill On Net Limited");
});

test("operator stays unresolved when markets name different local licensees", () => {
  // Betsafe: Triogames OÜ in Estonia, SIA Latsson Licensing in Latvia. There is
  // no majority corporate entity in the record, so the field must stay empty
  // rather than adopt one market's licensee as the brand operator.
  const markets = [
    market({ countryCode: "EE", operatingLegalEntity: "Triogames OÜ (register code 11079281)" }),
    market({ countryCode: "LV", operatingLegalEntity: "SIA Latsson Licensing (reg. 40103940885)" }),
  ];
  assert.equal(deriveOperator(markets), null);
});

test("an entity that is only ever assumed is never promoted", () => {
  const markets = [
    market({ countryCode: "BR", operatingLegalEntity: "Brazilian authorised entity not verified" }),
    market({ countryCode: "MX", operatingLegalEntity: "Mexican permit holder not verified" }),
  ];
  assert.equal(deriveOperator(markets), null);
});

test("languages and currencies union across markets", () => {
  const markets = [
    market({ countryCode: "GB", primaryLanguage: "en", supportLanguages: ["en"], primaryCurrency: "GBP" }),
    market({ countryCode: "SE", primaryLanguage: "sv", supportLanguages: ["sv"], primaryCurrency: "SEK" }),
  ];
  assert.deepEqual(deriveLanguages(markets), ["en", "sv"]);
  assert.deepEqual(deriveCurrencies(markets), ["GBP", "SEK"]);
});

test("a licence repeated across markets is corporate; a single-market licence is not", () => {
  const licences = [
    { id: "mga", authority: "Malta Gaming Authority", licenseNumber: null, jurisdiction: "MT", marketCountryCodes: ["DK", "FI", "IN", "NO"] },
    { id: "ukgc", authority: "Gambling Commission", licenseNumber: "039326-R-319358-059", jurisdiction: "GB", marketCountryCodes: ["GB"] },
  ];
  assert.deepEqual(deriveCorporateLicences(licences).map((entry) => entry.id), ["mga"]);
});

test("duplicate rows of one corporate licence are recognised by their combined reach", () => {
  // TurboNino stores the MGA B2C licence four times, once per market, each row
  // linking to a single country. Reading a row in isolation would classify the
  // brand's own licence as a market fact.
  const licences = ["DK", "FI", "IN", "NO"].map((countryCode) => ({
    id: `mga-${countryCode}`,
    authority: "Malta Gaming Authority",
    licenseNumber: null,
    jurisdiction: "MT",
    marketCountryCodes: [countryCode],
  }));
  const corporate = deriveCorporateLicences([
    ...licences,
    { id: "ukgc", authority: "Gambling Commission", licenseNumber: "039326-R-319358-059", jurisdiction: "GB", marketCountryCodes: ["GB"] },
  ]);
  assert.deepEqual(corporate.map((entry) => entry.id), ["mga-DK"], "the identity collapses to one representative row");
});

test("a licence held in one market only is never treated as corporate", () => {
  const corporate = deriveCorporateLicences([
    { id: "srij", authority: "SRIJ", licenseNumber: "025", jurisdiction: "PT", marketCountryCodes: ["PT"] },
  ]);
  assert.deepEqual(corporate, []);
});

test("a casino with no market evidence reports every field as unresolved", () => {
  const derivation = deriveGlobalCatalog({ slug: "boostwin", markets: [], licences: [] });
  assert.deepEqual(derivation.unresolved, [
    "operator",
    "languages",
    "currencies",
    "payments",
    "providers",
    "categories",
    "corporateLicences",
  ]);
});

test("the editorial corpus replaces the generated lists rather than restating them", async () => {
  const [corpus, generated] = await Promise.all([
    readFile(path.join(process.cwd(), "data/casino-global-catalog-01/editorial.v1.json"), "utf8"),
    readFile(path.join(process.cwd(), "data/casino-ingestion/ego-skillonnet-2026-09-22/editorial.json"), "utf8"),
  ]);
  const replacement = JSON.parse(corpus) as {
    commercialAuthority: boolean;
    entries: Array<{ slug: string; bestFor: string[]; thingsToKnow: string[]; description: string }>;
  };
  const original = JSON.parse(generated) as { casinos: Array<{ slug: string; bestFor: string[]; thingsToKnow: string[] }> };

  assert.equal(replacement.commercialAuthority, false, "editorial copy never carries commercial authority");
  assert.deepEqual(
    replacement.entries.map((entry) => entry.slug).sort(),
    original.casinos.map((casino) => casino.slug).sort(),
    "every generated entry is replaced",
  );

  const originalBySlug = new Map(original.casinos.map((casino) => [casino.slug, casino]));
  for (const entry of replacement.entries) {
    const before = originalBySlug.get(entry.slug);
    assert.ok(before);
    // The generated lists all opened by reciting licence numbers the page
    // already shows in its regulation section.
    assert.match(before.bestFor[0] as string, /^Players who want a licensed site:/);
    for (const line of [...entry.bestFor, ...entry.thingsToKnow]) {
      assert.doesNotMatch(line, /^Players who want a licensed site:/, `${entry.slug} still recites licences`);
      assert.doesNotMatch(line, /licence \d/i, `${entry.slug} still quotes a licence number`);
    }
    assert.notDeepEqual(entry.bestFor, before.bestFor, `${entry.slug} "Best for" is unchanged`);
    assert.notDeepEqual(entry.thingsToKnow, before.thingsToKnow, `${entry.slug} "Things to know" is unchanged`);
  }
});

test("no two casinos share a Best for or Things to know line", async () => {
  // The generated lists repeated the same three caveats across all thirteen
  // casinos, which made the section worthless for comparing them.
  const corpus = JSON.parse(await readFile(
    path.join(process.cwd(), "data/casino-global-catalog-01/editorial.v1.json"),
    "utf8",
  )) as { entries: Array<{ slug: string; bestFor: string[]; thingsToKnow: string[] }> };

  const seen = new Map<string, string>();
  for (const entry of corpus.entries) {
    for (const line of [...entry.bestFor, ...entry.thingsToKnow]) {
      const normalized = line.trim().toLowerCase();
      const owner = seen.get(normalized);
      assert.equal(owner, undefined, `${entry.slug} repeats a line from ${owner}`);
      seen.set(normalized, entry.slug);
    }
  }
});
