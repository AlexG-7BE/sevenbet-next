// The layout of the two plain-text pages, /who-runs-this and /for-organisations (Founder, 18 and
// 20 October 2026, on his phone: «границы проходят не там где надо на мобильной версии… сделай это
// и в десктоп версии и в мобильной версии и на обоих сайтах что бы было одинаково»).
//
// Two defects, both measured on the live page before the fix:
//
//  1. **Colour bands across the text.** The public shell makes html and body exactly one
//     viewport tall, so the body's decorative gradients are one viewport-sized tile repeated down
//     the page: a hard seam every 844px on a phone and every 900px on a laptop, wherever it falls
//     in a paragraph. These pages must paint one even surface of their own instead, and no other
//     page may lose the decorative background.
//  2. **The title under the header.** The header is fixed and 81px tall on both hosts; the page
//     began 40px from the top, so the eyebrow and half the title were hidden behind it.
//
// The rendered check, header against first line at phone and desktop widths, is
// tests/help-text-pages-browser.spec.ts; this file holds the stylesheet contract that makes it
// true on both hosts at once.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import postcss, { type Root, type Rule } from "postcss";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { resolvePresentationContext } from "../lib/market/presentation-resolver";
import { HELP_LOCALES, helpOrganisationsPage, helpOwnerPage } from "../lib/site/help-copy";

const require = createRequire(import.meta.url);
/** A CSS module whose class names are their own names, so the markup can be read as written. */
const classNames: Record<string, unknown> = new Proxy({}, {
  get: (_target, name) => (name === "__esModule" ? false : name === "default" ? classNames : String(name)),
});
require.extensions[".css"] = (module) => { module.exports = classNames; };
(globalThis as typeof globalThis & { React: typeof React }).React = React;

const TEXT_PAGE_SELECTOR = 'body:has([data-runtime-renderer="help-text-page"])';

function stylesheet(path: string): Root {
  return postcss.parse(readFileSync(path, "utf8"), { from: path });
}

/** Every top-level rule with exactly this selector (not inside a media query). */
function topLevelRules(root: Root, selector: string): Rule[] {
  const found: Rule[] = [];
  root.each((node) => {
    if (node.type === "rule" && node.selector === selector) found.push(node);
  });
  return found;
}

function declaration(rule: Rule, property: string) {
  let value: string | undefined;
  rule.walkDecls(property, (decl) => { value = decl.value; });
  return value;
}

const globals = stylesheet("app/globals.css");
const page = stylesheet("app/(public)/_help-pages/HelpTextPage.module.css");
const shell = stylesheet("components/public-shell/PublicShell.module.css");

test("the text pages paint one even surface, and every other page keeps the decorative background", () => {
  const [surface] = topLevelRules(globals, TEXT_PAGE_SELECTOR);
  assert.ok(surface, "globals.css gives the text pages a body background of their own");
  assert.equal(declaration(surface, "background"), "var(--sb-surface-night)", "the night surface, the shell's own colour");
  const [grid] = topLevelRules(globals, `${TEXT_PAGE_SELECTOR}::before`);
  assert.ok(grid, "the decorative grid layer is switched off too");
  assert.equal(declaration(grid, "display"), "none");

  // The page itself carries the same surface, so even a browser without :has() never shows a
  // band behind the text, and the stylesheet draws no gradient of its own anywhere.
  const [pageRule] = topLevelRules(page, ".page");
  assert.equal(declaration(pageRule, "background"), "var(--sb-surface-night)");
  assert.doesNotMatch(readFileSync("app/(public)/_help-pages/HelpTextPage.module.css", "utf8"), /gradient\(/, "the text pages draw no gradient");

  // The other half: the decorative background is still exactly what every other page wears.
  const [body] = topLevelRules(globals, "body");
  assert.equal(
    declaration(body, "background")?.replace(/\s+/g, " "),
    "radial-gradient(circle at 18% 0%, rgba(0, 226, 138, .18), transparent 34rem), radial-gradient(circle at 86% 10%, rgba(59, 130, 246, .20), transparent 34rem), linear-gradient(180deg, #07111F 0%, #050B14 42rem, #07111F 100%)",
    "the decorative body background is unchanged",
  );
  const [bodyGrid] = topLevelRules(globals, "body::before");
  assert.match(declaration(bodyGrid, "background-image") ?? "", /linear-gradient/, "and so is its grid");
  // The override is keyed on the text pages' own marker and on nothing broader.
  let overrides = 0;
  globals.walkRules((rule) => {
    if (rule.selector.includes('data-runtime-renderer="help-text-page"')) overrides += 1;
  });
  assert.equal(overrides, 2, "only the two text-page rules mention the text pages");
});

test("the page starts below the fixed header, with room to breathe, on both hosts", () => {
  // The header both hosts draw: one component, one class, fixed, 81px at every width — plus, on
  // a phone, the notch inset, which is zero unless the phone reports one.
  const [header] = topLevelRules(shell, ".header");
  assert.equal(declaration(header, "position"), "fixed");
  const heights = new Set([declaration(header, "min-height")]);
  shell.walkAtRules("media", (media) => {
    media.walkRules((rule) => {
      if (/(^|,\s*)\.header(\s*,|$)/.test(rule.selector)) {
        const height = declaration(rule, "min-height");
        if (height) heights.add(height);
      }
    });
  });
  assert.deepEqual([...heights].sort(), ["81px", "calc(81px + env(safe-area-inset-top))"], "the header is 81px tall, plus the notch inset on a phone");

  // The page clears the larger of the two everywhere, which on a desktop, where the inset is
  // zero, is the 81px header itself.
  const [pageRule] = topLevelRules(page, ".page");
  assert.equal(declaration(pageRule, "--shell-header-height"), "calc(81px + env(safe-area-inset-top))", "the page clears the header the shell actually draws");
  const breathing = declaration(pageRule, "--page-breathing") ?? "";
  const minimum = Number(breathing.match(/^clamp\((\d+)px,/)?.[1]);
  assert.ok(minimum >= 32, `at least 32px between the header and the eyebrow on the narrowest phone (${breathing})`);
  assert.match(declaration(pageRule, "padding") ?? "", /^calc\(var\(--shell-header-height\) \+ var\(--page-breathing\)\) /, "the top padding is the header plus the breathing room");

  // An anchor jump never lands under the header either.
  let scrollMargin: string | undefined;
  page.walkRules((rule) => {
    if (rule.selector.includes(".page :is(h1, h2, section")) scrollMargin = declaration(rule, "scroll-margin-top");
  });
  assert.equal(scrollMargin, "calc(var(--shell-header-height) + 24px)");

  // One stylesheet for both hosts: nothing in it reads which site is answering.
  assert.doesNotMatch(readFileSync("app/(public)/_help-pages/HelpTextPage.module.css", "utf8"), /data-public-footer-site|data-site|\[data-shell-theme/, "the page has no per-host style");
});

test("the page is the same on both hosts, word for word", async () => {
  const { HelpTextPageBody } = await import("../app/(public)/_help-pages/HelpTextPageView");
  const routeLanguage = { "en-GB": "en", "sv-SE": "sv", "da-DK": "da", "uz-UZ": "uz" } as const;
  for (const locale of HELP_LOCALES) {
    const presentation = resolvePresentationContext({ routeLanguage: routeLanguage[locale] });
    for (const copy of [helpOwnerPage(locale), helpOrganisationsPage(locale)]) {
      const render = (site: "help" | "main") => renderToStaticMarkup(
        <HelpTextPageBody contentLocale={locale} copy={copy} presentation={presentation} site={site} />,
      );
      const help = render("help");
      assert.equal(render("main"), help, `${copy.title} (${locale}) differs between the hosts`);
      assert.match(help, /^<div class="page" data-runtime-renderer="help-text-page"/, "the marker the body rule keys on is on the page's root");
    }
  }
});

test("no text on the two pages is smaller than the 12px floor", () => {
  page.walkDecls("font-size", (decl) => {
    const px = decl.value.match(/^(\d+(?:\.\d+)?)px$/);
    const rem = decl.value.match(/^(\d+(?:\.\d+)?)rem$/);
    const clamp = decl.value.match(/^clamp\((\d+(?:\.\d+)?)(px|rem),/);
    const size = px ? Number(px[1]) : rem ? Number(rem[1]) * 16 : clamp ? Number(clamp[1]) * (clamp[2] === "rem" ? 16 : 1) : NaN;
    assert.ok(Number.isFinite(size), `an unread font size: ${decl.value}`);
    assert.ok(size >= 12, `${(decl.parent as Rule).selector} is ${decl.value}`);
  });
});
