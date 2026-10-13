import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { pauseStatisticsLocale, pauseStatisticsMessages } from "../lib/i18n/static-pages/pause-statistics";
import { publicRoutePolicy } from "../lib/market/routing";
import { coreRoutes } from "../lib/site";

const read = (path: string) => readFileSync(path, "utf8");

test("every figure on the page has a source, and the CSV files carry the same series", () => {
  for (const locale of ["sv-SE", "da-DK", "en-GB"] as const) {
    const messages = pauseStatisticsMessages(locale);
    for (const row of [...messages.register.rows, ...messages.corpus.rows]) {
      assert.ok(row.source.length > 8, `${locale}: ${row.label} names a source`);
      assert.match(row.value, /\d/, `${locale}: ${row.label} is a number`);
    }
    assert.ok(messages.unknown.items.length >= 4, locale);
    assert.ok(messages.register.licence.includes("CC BY 4.0"), locale);
    assert.match(read(`public${messages.register.csvHref}`), /^date,registered_persons,note,source\n/, `${locale}: the CSV exists with its header`);
  }
  const spelpaus = read("public/data/spelpaus-registrations.csv");
  assert.match(spelpaus, /2023-12-31,104301/);
  assert.match(spelpaus, /2024-12-31,120607/);
  assert.match(spelpaus, /2025-12-31,134484/);
  assert.match(read("public/data/rofus-registrations.csv"), /2025-05-31,60000/);
  assert.equal(pauseStatisticsLocale("de-DE"), "en-GB");
});

test("the page is a localizable public route in the sitemap, states the revenue model and links to no casino", () => {
  assert.equal(publicRoutePolicy("/pause-statistics"), "LOCALIZABLE_PUBLIC");
  assert.ok(coreRoutes.includes("/pause-statistics"));
  const page = read("app/(public)/pause-statistics/page.tsx");
  assert.match(page, /data-clean-route-line/);
  assert.match(page, /"@type": "Dataset"/);
  assert.doesNotMatch(page, /\/best-offers|\/casinos|\/bonuses|\/r\/|\/go\//);
  assert.doesNotMatch(page, /@\/lib\/commercial|@\/lib\/public-offer|@\/lib\/services|@\/lib\/market-access|@\/lib\/public-casino|@\/lib\/db\/prisma/);
});
