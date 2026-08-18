import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { chromium } from "@playwright/test";

const sourceBaseUrl = process.env.B4GAMBLE_HANDOFF_URL ?? "http://127.0.0.1:4180";
const output = resolve("lib/final-handoff/generated-pages.json");

const sources = {
  home: "Home.dc.html",
  tenSteps: "10 Steps v2.dc.html",
  programme: "Programme.dc.html",
  login: "Login.dc.html",
  bestOffers: "Best Offers.dc.html",
  casinos: "Casinos.dc.html",
  casinosComparison: "Casinos.dc.html",
  casinoReview: "Casino Review.dc.html",
  bonuses: "Bonuses.dc.html",
  article: "Article.dc.html",
  learn: "Learn.dc.html",
  responsibleGambling: "Responsible Gambling.dc.html",
  help: "Help.dc.html",
  methodology: "Methodology.dc.html",
  about: "About.dc.html",
  faq: "FAQ.dc.html",
  affiliateDisclosure: "Affiliate Disclosure.dc.html",
  contact: "Contact.dc.html",
  privacy: "Privacy.dc.html",
  terms: "Terms.dc.html",
  notFound: "404.dc.html",
};

const routeByFile = new Map([
  ["Home.dc.html", "/"],
  ["10 Steps v2.dc.html", "/10-steps"],
  ["Programme.dc.html", "/program"],
  ["Login.dc.html", "/login"],
  ["Best Offers.dc.html", "/best-offers"],
  ["Casinos.dc.html", "/casinos"],
  ["Casino Review.dc.html", "/casino/demo-northstar"],
  ["Bonuses.dc.html", "/bonuses"],
  ["Article.dc.html", "/learn/casino-bonuses/welcome-bonus-terms"],
  ["Learn.dc.html", "/learn"],
  ["Responsible Gambling.dc.html", "/responsible-gambling"],
  ["Help.dc.html", "/help"],
  ["Methodology.dc.html", "/methodology"],
  ["About.dc.html", "/about"],
  ["FAQ.dc.html", "/faq"],
  ["Affiliate Disclosure.dc.html", "/affiliate-disclosure"],
  ["Contact.dc.html", "/contact"],
  ["Privacy.dc.html", "/privacy"],
  ["Terms.dc.html", "/terms"],
]);

const browser = await chromium.launch({ headless: true });
const generated = {};
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  for (const [name, file] of Object.entries(sources)) {
    await page.goto(`${sourceBaseUrl}/${encodeURIComponent(file)}`, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => document.fonts?.ready).catch(() => undefined);
    await page.waitForTimeout(350);
    if (name === "casinosComparison") {
      await page.getByText("+ Compare", { exact: true }).nth(0).click();
      await page.getByText("+ Compare", { exact: true }).nth(0).click();
      await page.getByRole("button", { name: /Compare 2 casinos/ }).click();
      await page.locator('[data-screen-label="Compare overlay"]').waitFor();
    }
    generated[name] = await page.evaluate(({ currentName, links }) => {
      const routes = new Map(links);
      const root = document.querySelector("#dc-root");
      if (!root) throw new Error(`No rendered handoff root for ${currentName}`);

      for (const slot of root.querySelectorAll("image-slot")) {
        const image = document.createElement("img");
        const source = slot.getAttribute("src");
        image.alt = slot.getAttribute("placeholder") ?? "";
        image.loading = "eager";
        image.decoding = "async";
        image.style.width = "100%";
        image.style.height = "100%";
        image.style.display = "block";
        image.style.objectFit = slot.getAttribute("fit") ?? "cover";
        if (source) {
          const url = new URL(source, location.href);
          image.src = url.pathname.replace(/^\/public\//, "/");
        }
        slot.replaceWith(image);
      }

      for (const anchor of root.querySelectorAll("a[href]")) {
        const raw = anchor.getAttribute("href");
        if (!raw) continue;
        let decoded = raw;
        try { decoded = decodeURIComponent(raw); } catch {}
        const fileName = decoded.split("/").pop() ?? decoded;
        const route = routes.get(fileName);
        if (route) anchor.setAttribute("href", currentName === "article" && fileName === "Article.dc.html" ? "/bonus-guide" : route);
      }

      for (const element of root.querySelectorAll("[data-dc-tpl]")) element.removeAttribute("data-dc-tpl");
      // The supplied boards reference a paint texture that is not included in the handoff archive.
      // Preserve the rendered transparent fallback without issuing a broken public request.
      for (const element of root.querySelectorAll("[style]")) {
        if (element.style.backgroundImage.includes("assets/paint.png")) element.style.backgroundImage = "none";
      }
      const css = Array.from(document.head.querySelectorAll("style"), (style) => style.textContent ?? "").join("\n");
      return { html: root.innerHTML, css };
    }, { currentName: name, links: Array.from(routeByFile.entries()) });
  }
  await page.close();
} finally {
  await browser.close();
}

await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(generated)}\n`);
console.log(`Generated exact handoff page fragments at ${output}`);
