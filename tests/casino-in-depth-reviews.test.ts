import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { CASINO_IN_DEPTH, casinoInDepthReview } from "../lib/casino-profile/in-depth";
import { CASINO_MARKETS } from "../lib/market-access/register";
import { BLOCKED_TARGETS } from "../lib/market-access/release";

const MARKET_BY_LANGUAGE = { sv: "SE", da: "DK" } as const;
const words = (text: string) => text.split(/\s+/).filter((word) => /\p{L}/u.test(word)).length;
// Live facts the page shows in its own rows; a long review that repeats them goes stale.
const VOLATILE = /\d+\s*(?:x|×|gånger|gange)\b|\d+\s*(?:free ?spins|freespins|gratisspinn|spins)|\d[\d\s.,]*\s*(?:kr|SEK|DKK|€|EUR)\b/i;

test("long reviews exist only for casinos licensed and open in the language's market (Founder, 15 October 2026)", () => {
  for (const [language, { reviews }] of Object.entries(CASINO_IN_DEPTH)) {
    const market = MARKET_BY_LANGUAGE[language as keyof typeof MARKET_BY_LANGUAGE];
    for (const slug of Object.keys(reviews)) {
      assert.ok(CASINO_MARKETS[slug]?.licensed[market], `${language}/${slug}: licensed in ${market}`);
      assert.ok(!BLOCKED_TARGETS.some((target) => target.casinoSlug === slug && target.market === market), `${language}/${slug}: not blocked in ${market}`);
    }
  }
});

test("each long review is a real review: 450–700 words, 4–6 parts, no volatile numbers, no copied sentences", () => {
  for (const [language, { reviews }] of Object.entries(CASINO_IN_DEPTH)) {
    const seen = new Map<string, string>();
    for (const [slug, review] of Object.entries(reviews)) {
      const paragraphs = review.parts.flatMap((part) => part.paragraphs);
      const count = words(paragraphs.join(" "));
      assert.ok(count >= 450 && count <= 700, `${language}/${slug}: ${count} words`);
      assert.ok(review.parts.length >= 4 && review.parts.length <= 6, `${language}/${slug}: ${review.parts.length} parts`);
      assert.match(review.checked, /^\d{4}-\d{2}-\d{2}$/);
      for (const paragraph of paragraphs) {
        assert.doesNotMatch(paragraph, VOLATILE, `${language}/${slug}: volatile figure in "${paragraph.slice(0, 80)}"`);
        assert.doesNotMatch(paragraph, /https?:\/\/|\*\*|<[a-z]/i, `${language}/${slug}: plain text only`);
        for (const sentence of paragraph.split(/(?<=[.!?])\s+/).filter((part) => words(part) >= 8)) {
          const other = seen.get(sentence);
          assert.ok(!other || other === slug, `${language}: "${sentence.slice(0, 60)}" repeats in ${slug} and ${other}`);
          seen.set(sentence, slug);
        }
      }
    }
  }
});

test("the long review renders only on its own language and stays out of every other page", () => {
  assert.equal(casinoInDepthReview("betsson", "en"), null);
  assert.equal(casinoInDepthReview("no-such-casino", "sv"), null);
  const profile = readFileSync("components/casino-profile/CasinoProfile.tsx", "utf8");
  assert.match(profile, /const inDepth = casinoInDepthReview\(casino\.slug, presentation\.language\);/);
  assert.match(profile, /\{inDepth \? <section aria-labelledby="in-depth-heading"[\s\S]*?: null\}\n\n      (?:\{neighbours\}\n\n      )?<section aria-labelledby="faq-heading"/);
});
