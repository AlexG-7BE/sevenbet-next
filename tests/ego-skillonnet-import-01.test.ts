import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  EGO_CASINO_SLUGS,
  EGO_DECISION_REF,
  EGO_IMPORT_RELEASE,
  assertEgoApplyAuthority,
  databaseFingerprint,
  egoRegistrationCommands,
  egoRegistrationPlan,
  parseCsv,
  parseEgoLinks,
} from "../lib/partner-imports/ego-skillonnet-import-01";

const HEADER = "casinoSlug,label,decision,marketCodes,language,trackingUrl,expectedOperatorHost,reason,partner";
const PROVINCES = "CA-AB CA-BC CA-MB CA-NB CA-NL CA-NS CA-NT CA-NU CA-PE CA-QC CA-SK CA-YT";

function csv(...rows: string[]) {
  return [HEADER, ...rows].join("\n");
}

function row(slug: string, label: string, decision: string, markets: string, language = "en", host = `www.${slug}.com`) {
  const url = `https://example-tracker.test/redirect?aname=b4gamble&brand=${slug}&site=${encodeURIComponent(label)}`;
  return `${slug},${label},${decision},${markets},${language},${url},${host},"reason, with comma",EGO`;
}

test("CSV parsing keeps quoted commas inside one cell", () => {
  assert.deepEqual(parseCsv('a,"b, c",d\n1,2,3'), [["a", "b, c", "d"], ["1", "2", "3"]]);
  assert.equal(parseEgoLinks(csv(row("playojo", "english", "ACTIVATE", "GB")))[0].reason, "reason, with comma");
});

test("only ACTIVATE rows become registration commands, one per exact market", () => {
  const commands = egoRegistrationCommands(parseEgoLinks(csv(
    row("playojo", "english", "ACTIVATE", "GB"),
    row("playojo", "default", "NO_MARKET", ""),
    row("playojo", "japanese", "DO_NOT_ACTIVATE", "JP"),
    row("slotsmagic", "englishca", "ACTIVATE", PROVINCES),
  )));
  assert.equal(commands.length, 13);
  assert.deepEqual(commands.filter((command) => command.casinoSlug === "playojo").map((command) => command.geo), ["GB"]);
  assert.equal(commands.some((command) => command.geo === "JP" || command.geo === "CA-ON"), false);
  assert.ok(commands.every((command) => /^[0-9a-f]{64}$/.test(command.linkHash)));
});

test("closed markets are rejected even when a row says ACTIVATE", () => {
  for (const [slug, market] of [["eucasino", "CA-ON"], ["playuzu", "GB"], ["eucasino", "DE"], ["slotsmagic", "GR"], ["playojo", "ES"], ["bacanaplay", "FI"]]) {
    assert.throws(() => egoRegistrationCommands(parseEgoLinks(csv(row(slug, "site", "ACTIVATE", market))) ), /EGO_LINK_FORBIDDEN_MARKET/, `${slug}:${market}`);
  }
  for (const [slug, market] of [["drueckglueck", "DE"], ["turbonino", "DE"], ["regencycasino", "GR"], ["playuzu", "ES"]]) {
    assert.equal(egoRegistrationCommands(parseEgoLinks(csv(row(slug, "site", "ACTIVATE", market)))).length, 1, `${slug}:${market}`);
  }
});

test("unsafe or unknown links are rejected", () => {
  assert.throws(() => egoRegistrationCommands(parseEgoLinks(csv(row("unknown-casino", "site", "ACTIVATE", "GB")))), /EGO_LINK_UNKNOWN_CASINO/);
  assert.throws(() => egoRegistrationCommands(parseEgoLinks(csv(`playojo,x,ACTIVATE,GB,en,http://example-tracker.test/r?aname=b4gamble,www.playojo.com,r,EGO`))), /EGO_LINK_NOT_HTTPS/);
  assert.throws(() => egoRegistrationCommands(parseEgoLinks(csv(`playojo,x,ACTIVATE,GB,en,https://example-tracker.test/r?prod_id=1download,www.playojo.com,r,EGO`))), /EGO_LINK_DOWNLOAD_FORBIDDEN/);
  assert.throws(() => parseEgoLinks("slug,label\nplayojo,x"), /EGO_LINKS_CSV_HEADER_INVALID/);
});

test("duplicate language sites keep one link per market: local domain, French Quebec, then market-labelled site", () => {
  const { commands, superseded } = egoRegistrationPlan(parseEgoLinks(csv(
    row("eucasino", "language site (danish)", "ACTIVATE", "DK", "da"),
    row("eucasino", "Danish site (.dk)", "ACTIVATE", "DK", "da", "www.eucasino.dk"),
    row("eucasino", "language site (english)", "ACTIVATE", "GB"),
    row("eucasino", "language site (GB)", "ACTIVATE", "GB"),
    row("eucasino", "language site (englishca)", "ACTIVATE", PROVINCES),
    row("eucasino", "language site (french)", "ACTIVATE", PROVINCES, "fr"),
  )));
  const kept = new Map(commands.map((command) => [command.geo, command.label]));
  assert.equal(commands.length, 14);
  assert.equal(kept.get("DK"), "Danish site (.dk)");
  assert.equal(kept.get("GB"), "language site (GB)");
  assert.equal(kept.get("CA-QC"), "language site (french)");
  assert.equal(kept.get("CA-AB"), "language site (englishca)");
  assert.equal(superseded.length, 14);
});

test("apply mode refuses CI, Vercel builds, missing confirmations and an unexpected database", () => {
  const databaseUrl = "postgres://user:secret@db.example.test:5432/postgres";
  const valid = {
    confirm: EGO_IMPORT_RELEASE,
    decisionRef: EGO_DECISION_REF,
    actorEmail: "founder@example.test",
    expectedDatabase: databaseFingerprint(databaseUrl),
    databaseUrl,
    env: {},
  };
  assert.doesNotThrow(() => assertEgoApplyAuthority(valid));
  assert.throws(() => assertEgoApplyAuthority({ ...valid, env: { CI: "true" } }), /FORBIDDEN_IN_CI/);
  assert.throws(() => assertEgoApplyAuthority({ ...valid, env: { VERCEL: "1" } }), /FORBIDDEN_IN_VERCEL_BUILD/);
  assert.throws(() => assertEgoApplyAuthority({ ...valid, confirm: undefined }), /REQUIRES --confirm/);
  assert.throws(() => assertEgoApplyAuthority({ ...valid, decisionRef: "FOUNDER-OTHER-2026" }), /REQUIRES --decision-ref/);
  assert.throws(() => assertEgoApplyAuthority({ ...valid, actorEmail: undefined }), /REQUIRES --actor-email/);
  assert.throws(() => assertEgoApplyAuthority({ ...valid, expectedDatabase: "0000000000000000" }), /DATABASE_MISMATCH/);
  assert.doesNotMatch(databaseFingerprint(databaseUrl), /secret|db\.example/);
});

test("raw tracking links stay out of the repository", () => {
  assert.match(readFileSync(".gitignore", "utf8"), /^\*tracking-links\*\.csv$/m);
  const manifest = readFileSync("data/casino-ingestion/ego-skillonnet-2026-09-22/manifest.v1.json", "utf8");
  assert.doesNotMatch(manifest, /aname=|tracking-links/);
});

test("editorial content covers every EGO casino with a score equal to the mean of its six components", () => {
  const editorial = JSON.parse(readFileSync("data/casino-ingestion/ego-skillonnet-2026-09-22/editorial.json", "utf8")) as {
    decisionRef: string;
    casinos: Array<{ slug: string; score: number; scoreComponents: Record<string, number>; summary: string; description: string; bestFor: string[]; thingsToKnow: string[]; seo: { title: string; description: string } }>;
  };
  assert.equal(editorial.decisionRef, EGO_DECISION_REF);
  assert.deepEqual(editorial.casinos.map((entry) => entry.slug).sort(), [...EGO_CASINO_SLUGS].sort());
  for (const entry of editorial.casinos) {
    const components = Object.values(entry.scoreComponents);
    assert.equal(components.length, 6, entry.slug);
    assert.equal(entry.score, Math.round((components.reduce((sum, value) => sum + value, 0) / 6) * 10) / 10, entry.slug);
    assert.ok(entry.score >= 1 && entry.score <= 10, entry.slug);
    for (const text of [entry.summary, entry.description, entry.seo.title, entry.seo.description]) assert.ok(text.trim().length > 20, entry.slug);
    assert.ok(entry.bestFor.length > 0 && entry.thingsToKnow.length > 0, entry.slug);
    assert.doesNotMatch(JSON.stringify(entry), /aname=|prod_id=/, entry.slug);
  }
});
