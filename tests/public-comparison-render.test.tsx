import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { ComparisonSelectedCardMarkup, type ComparisonSelectedCardClassNames } from "../components/comparison/ComparisonSelectedCard";
import type { PublicComparisonCasino, PublicComparisonResult } from "../lib/public-comparison/public-comparison.types";

const classNames: ComparisonSelectedCardClassNames = {
  selectedCard: "selectedCard",
  selectedIdentity: "selectedIdentity",
  selectedLinks: "selectedLinks",
};

function casino(dataClassification: PublicComparisonCasino["dataClassification"], patch: Partial<PublicComparisonCasino> = {}): PublicComparisonCasino {
  return {
    id: dataClassification === "DEMO_FIXTURE" ? "demo-id" : "published-id",
    dataClassification,
    slug: dataClassification === "DEMO_FIXTURE" ? "fictional-profile" : "published-profile",
    name: dataClassification === "DEMO_FIXTURE" ? "Fictional Profile" : "Published Profile",
    summary: "Profile summary.",
    logo: null,
    editorScore: 8,
    publishedAt: "2030-05-01T00:00:00.000Z",
    lastReviewedAt: "2030-05-02T00:00:00.000Z",
    reviewHref: dataClassification === "DEMO_FIXTURE" ? "/casino/fictional-profile" : "/casino/published-profile",
    marketState: "AVAILABLE",
    action: { available: false, href: null, label: "Visit casino", reason: "Commercial action unavailable." },
    ...patch,
  };
}

function comparisonResult(selected: PublicComparisonCasino): PublicComparisonResult {
  return {
    status: "one-selected",
    query: { casinos: [selected.slug], country: "GB", differences: false, selectionMode: "explicit", issues: [] },
    selectedSlugs: [selected.slug],
    candidates: [],
    casinos: [selected],
    reasons: [],
    groups: [],
    hiddenEqualRows: 0,
    defaulted: false,
    inventoryMode: selected.dataClassification === "DEMO_FIXTURE" ? "DEMO_ONLY" : "PUBLISHED_ONLY",
  };
}

function mixedResult(casinos: PublicComparisonCasino[]): PublicComparisonResult {
  return {
    ...comparisonResult(casinos[0]),
    status: "available",
    query: { casinos: casinos.map((casino) => casino.slug), country: "GB", differences: false, selectionMode: "explicit", issues: [] },
    selectedSlugs: casinos.map((casino) => casino.slug),
    casinos,
    inventoryMode: "MIXED",
  };
}

test("comparison cards disclose each demo record without mislabelling published records", () => {
  const demo = casino("DEMO_FIXTURE");
  const demoHtml = renderToStaticMarkup(<ComparisonSelectedCardMarkup casino={demo} classNames={classNames} index={0} result={comparisonResult(demo)} />);
  assert.match(demoHtml, /<h3>Fictional Profile<\/h3><small><strong>DEMONSTRATION DATA<\/strong> · Fictional profile · GB illustrative context<\/small>/);
  assert.doesNotMatch(demoHtml, /Published profile/);

  const published = casino("PUBLISHED_RECORD");
  const publishedHtml = renderToStaticMarkup(<ComparisonSelectedCardMarkup casino={published} classNames={classNames} index={0} result={comparisonResult(published)} />);
  assert.match(publishedHtml, /<h3>Published Profile<\/h3><small>Published profile · GB declared available<\/small>/);
  assert.doesNotMatch(publishedHtml, /DEMONSTRATION DATA/);
});

test("mixed comparison cards preserve record-level published and fictional labels", () => {
  const demo = casino("DEMO_FIXTURE");
  const published = casino("PUBLISHED_RECORD");
  const result = mixedResult([demo, published]);
  const html = renderToStaticMarkup(<>
    <ComparisonSelectedCardMarkup casino={demo} classNames={classNames} index={0} result={result} />
    <ComparisonSelectedCardMarkup casino={published} classNames={classNames} index={1} result={result} />
  </>);

  assert.match(html, /Fictional Profile<\/h3><small><strong>DEMONSTRATION DATA<\/strong> · Fictional profile/);
  assert.match(html, /Published Profile<\/h3><small>Published profile/);
  assert.equal((html.match(/DEMONSTRATION DATA/g) ?? []).length, 1);
});
