import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

import generatedPages from "@/lib/final-handoff/generated-pages.json";
import { stripHandoffGlobalChrome } from "@/lib/final-handoff/transforms";

const read = (path: string) => readFileSync(path, "utf8");

const contentOnlyHandoffPages = [
  "home",
  "tenSteps",
  "article",
  "learn",
  "responsibleGambling",
  "help",
  "methodology",
  "about",
  "affiliateDisclosure",
  "privacy",
  "terms",
  "notFound",
] as const;

test("generated handoff pages surrender captured global chrome before rendering", () => {
  for (const name of contentOnlyHandoffPages) {
    const source = generatedPages[name].html;
    const content = stripHandoffGlobalChrome(source);
    assert.ok(content.length < source.length, `${name} must remove captured chrome`);
    assert.doesNotMatch(content, /<[^>]+\sdata-nav(?:=|\s|>)/, `${name} internal navigation`);
    assert.doesNotMatch(content, /Independent reviews\. Real tests\.<br>Player first\./, `${name} internal footer`);
  }
});

test("normal public and Programme routes have one production shell owner", () => {
  const publicLayout = read("app/(public)/layout.tsx");
  const programmeLayout = read("app/program/layout.tsx");
  for (const layout of [publicLayout, programmeLayout]) {
    assert.equal((layout.match(/<PublicHeader\b/g) ?? []).length, 1);
    assert.equal((layout.match(/<PublicFooter\b/g) ?? []).length, 1);
  }

  const interactions = read("components/final-handoff/HandoffInteractions.tsx");
  assert.doesNotMatch(interactions, /\[data-nav\]|data\.navtheme|syncNavigation/);
  assert.equal(existsSync("components/final-handoff/HandoffPublicChrome.tsx"), false);
  assert.doesNotMatch(read("app/(public)/faq/page.tsx") + read("app/(public)/contact/page.tsx"), /HandoffPublicNav|HandoffFooterStrip/);
  assert.doesNotMatch(read("app/globals.css"), /body:has\(\[data-handoff-page\]\)\s*>\s*\[data-public-shell/);
});

test("the measured Home and Learn grid owns the public geometry tokens", () => {
  const tokens = read("app/design-system.css");
  assert.match(tokens, /--public-outer-gutter: clamp\(24px, 5vw, 72px\);/);
  assert.match(tokens, /--public-content-max: 1440px;/);
  assert.match(tokens, /--public-wide-max: 1440px;/);
  assert.match(tokens, /--public-reading-max: 760px;/);
  assert.match(tokens, /--site-content-width: var\(--public-content-width\);/);

  const shell = read("components/public-shell/PublicShell.module.css");
  assert.match(shell, /\.headerInner\s*\{[^}]*width: var\(--public-frame-width\)/s);
  assert.match(shell, /\.footerInner\s*\{[^}]*width: var\(--public-wide-width\)/s);

  const globals = read("app/globals.css");
  assert.match(globals, /html:has\(body > \[data-public-shell="header"\]\)[\s\S]*height:\s*100%/);
});

test("Programme-specific UI is contextual content rather than a second global nav", () => {
  const contextualHeader = read("components/programme/ProgramAiAuthenticatedHeader.tsx");
  const presentation = read("components/programme/ProgramAiFinalPresentation.tsx");
  assert.match(contextualHeader, /data-programme-context-header/);
  assert.doesNotMatch(contextualHeader, /Programme navigation|href="\/best-offers"|className=\{styles\.wordmark\}/);
  assert.doesNotMatch(presentation, /ProgrammeChrome|ProgrammeFootnote/);
});
