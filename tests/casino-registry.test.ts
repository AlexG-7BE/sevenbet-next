import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

type RegistryEntry = {
  slug: string;
  name: string;
  status: "PUBLISHED" | "ARCHIVED" | "DRAFT";
  markets: string[];
  release: string | null;
  bundles: string[];
};

const registry = JSON.parse(readFileSync("data/casino-registry.json", "utf8")) as { casinos: RegistryEntry[] };

function ingestionBundles(dir = "data/casino-ingestion"): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return ingestionBundles(path);
    return name.endsWith(".v1.json") && name !== "manifest.v1.json" ? [path] : [];
  });
}

function readBundle(path: string) {
  return JSON.parse(readFileSync(path, "utf8")) as { casino: { slug: string }; markets?: Array<{ countryCode?: string }> };
}

test("casino registry lists each casino once, sorted by slug", () => {
  const slugs = registry.casinos.map((entry) => entry.slug);
  assert.equal(new Set(slugs).size, slugs.length, "duplicate slug in data/casino-registry.json");
  assert.deepEqual(slugs, [...slugs].sort(), "keep data/casino-registry.json sorted by slug");
});

test("every registry bundle exists and imports the registered casino and markets", () => {
  for (const entry of registry.casinos) {
    const markets = new Set<string>();
    for (const bundle of entry.bundles) {
      assert.ok(existsSync(bundle), `${entry.slug}: missing bundle ${bundle}`);
      const data = readBundle(bundle);
      assert.equal(data.casino.slug, entry.slug, `${bundle} imports a different casino`);
      for (const market of data.markets ?? []) if (market.countryCode) markets.add(market.countryCode);
    }
    assert.deepEqual([...markets].sort(), [...entry.markets].sort(), `${entry.slug}: registry markets differ from its bundles`);
    if (entry.status === "PUBLISHED") assert.ok(entry.bundles.length > 0, `${entry.slug}: published casinos need a repository bundle`);
  }
});

test("every casino import bundle in the repository is registered", () => {
  const registered = new Set(registry.casinos.flatMap((entry) => entry.bundles));
  const unregistered = ingestionBundles().filter((bundle) => !registered.has(bundle));
  assert.deepEqual(unregistered, [], "add new casino bundles to data/casino-registry.json");
});
