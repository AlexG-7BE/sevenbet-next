import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { chromium } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";
const outputRoot = resolve(process.env.LOCALIZATION_QA_OUTPUT ?? "/private/tmp/b4gamble-localization-quality-audit");
const allLocales = [
  ["GB", "en-GB", ""], ["DE", "de-DE", "/de"], ["IT", "it-IT", "/it"],
  ["ES", "es-ES", "/es"], ["PT", "pt-PT", "/pt"], ["GR", "el-GR", "/gr"],
  ["NL", "nl-NL", "/nl"], ["SE", "sv-SE", "/se"], ["DK", "da-DK", "/dk"],
  ["FI", "fi-FI", "/fi"], ["NO", "nb-NO", "/no"],
];
const allSurfaces = [
  ["home", "/"], ["casinos", "/casinos?visualFixture=true"], ["bonuses", "/bonuses?visualFixture=true"],
  ["methodology", "/methodology"], ["learning", "/learn"],
];
const locales = process.env.LOCALIZATION_QA_LOCALE
  ? allLocales.filter(([, locale]) => locale === process.env.LOCALIZATION_QA_LOCALE)
  : allLocales;
const surfaces = process.env.LOCALIZATION_QA_SURFACE
  ? allSurfaces.filter(([surface]) => surface === process.env.LOCALIZATION_QA_SURFACE)
  : allSurfaces;
const viewports = [{ width: 390, height: 844 }, { width: 1536, height: 1000 }];

await mkdir(outputRoot, { recursive: true });
const browser = await chromium.launch({ headless: true });
const rows = [];
try {
  for (const [market, locale, prefix] of locales) {
    for (const [surface, suffix] of surfaces) {
      for (const viewport of viewports) {
        const page = await browser.newPage({ viewport });
        await page.emulateMedia({ reducedMotion: "reduce" });
        const path = suffix === "/" ? `${prefix}/` || "/" : `${prefix}${suffix}`;
        const response = await page.goto(`${baseUrl}${path}`, { waitUntil: "networkidle" });
        const metrics = await page.evaluate(() => {
          const text = document.body.innerText;
          return {
            lang: document.documentElement.lang,
            documentWidth: document.documentElement.scrollWidth,
            viewportWidth: window.innerWidth,
            rawPlaceholder: /\{\{?[a-z][a-z0-9_-]*\}?\}/i.test(text),
            fakeControl: /\b(?:Filter|Filtre|Filtro|Suodatin)\s*[1-5]\b/i.test(text),
            offenders: Array.from(document.querySelectorAll("body *"))
              .map((element) => {
                const rect = element.getBoundingClientRect();
                return {
                  element: element.outerHTML.slice(0, 240),
                  left: Math.round(rect.left * 10) / 10,
                  right: Math.round(rect.right * 10) / 10,
                  width: Math.round(rect.width * 10) / 10,
                };
              })
              .filter((rect) => rect.left < -1 || rect.right > window.innerWidth + 1)
              .slice(0, 5),
          };
        });
        const filename = `${market.toLowerCase()}-${locale.toLowerCase()}-${surface}-${viewport.width}.jpg`;
        await page.screenshot({ animations: "disabled", path: resolve(outputRoot, filename), quality: 84, type: "jpeg" });
        rows.push({ market, locale, surface, viewport: viewport.width, path, status: response?.status() ?? 0, screenshot: filename, ...metrics });
        await page.close();
      }
    }
  }
} finally {
  await browser.close();
}

const failures = rows.filter((row) => row.status !== 200 || row.lang !== row.locale || row.rawPlaceholder || row.fakeControl || row.documentWidth > row.viewportWidth + 1);
await writeFile(resolve(outputRoot, "metrics.json"), `${JSON.stringify({ generatedAt: new Date().toISOString(), baseUrl, rows, failures }, null, 2)}\n`);
await writeFile(resolve(outputRoot, "README.md"), `# Localization visual review\n\n- Runtime: ${baseUrl}\n- Captures: ${rows.length}\n- Locales: ${locales.length}\n- Surfaces: ${surfaces.map(([name]) => name).join(", ")}\n- Viewports: ${viewports.map(({ width }) => width).join(", ")}\n- Failures: ${failures.length}\n\n${failures.length ? failures.map((failure) => `- ${failure.locale} ${failure.surface} ${failure.viewport}: ${JSON.stringify(failure)}`).join("\n") : "All captures passed locale, status, raw-placeholder, fake-control and horizontal-overflow checks."}\n`);

if (failures.length) {
  console.error(`Localization visual review failed: ${failures.length} finding(s). See ${resolve(outputRoot, "README.md")}`);
  process.exitCode = 1;
} else {
  console.log(`PASS ${rows.length} screenshots and ${resolve(outputRoot, "README.md")}`);
}
