import { getTopCasinos } from "@/lib/data";
import {
  getArticlePath,
  getCategoryPath,
  learningArticles as centerArticles,
  learningCategories as centerCategories,
} from "@/lib/learning-center";
import { learningArticles } from "@/lib/responsible-gambling";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

export function GET() {
  const topCasinos = getTopCasinos(8)
    .map((casino) => `- [${casino.name}](${absoluteUrl(`/casino/${casino.slug}`)}): ${casino.bonusHeadline}; wagering x${casino.wagering}; license ${casino.license}.`)
    .join("\n");
  const learningGuides = learningArticles
    .map((article) => `- [${article.title}](${absoluteUrl(`/responsible-gambling/${article.slug}`)}): ${article.summary}`)
    .join("\n");
  const learningCenterCategories = centerCategories
    .map((category) => `- [${category.title}](${absoluteUrl(getCategoryPath(category.slug))}): ${category.description}`)
    .join("\n");
  const learningCenterArticles = centerArticles
    .map((article) => `- [${article.title}](${absoluteUrl(getArticlePath(article))}): ${article.summary}`)
    .join("\n");

  const body = `# SevenBet

SevenBet is a responsible gambling platform centered on the SevenBet 10-Step Control Program. Casino comparisons and bonus offers are secondary resources presented inside a control-first framework.

## Core Pages

- [Home](${absoluteUrl("/")}) - program-first responsible gambling entry point.
- [10-step program](${absoluteUrl("/program")}) - the primary SevenBet control program.
- [Self-check](${absoluteUrl("/self-check")}) - structured self-assessment before casino comparison.
- [Learning Center](${absoluteUrl("/learn")}) - scalable educational hub for casino basics, bonuses, safety, payments, licensing, games, glossary and country guides.
- [Responsible gambling learning center](${absoluteUrl("/responsible-gambling")}) - educational hub for budgeting, time management, bonus terms, licenses and responsible gambling tools.
- [Budget calculator](${absoluteUrl("/tools/budget-calculator")}) - session limit and stop-loss calculator.
- [Casino bonuses](${absoluteUrl("/bonuses")}) - secondary bonus comparison directory.
- [Casino reviews](${absoluteUrl("/casinos")}) - reviewed casino profiles.
- [Methodology](${absoluteUrl("/methodology")}) - review criteria and editorial process.
- [Affiliate disclosure](${absoluteUrl("/affiliate-disclosure")}) - commercial relationship explanation.
- [Bonus guide](${absoluteUrl("/bonus-guide")}) - wagering, max bet, expiry and withdrawal rules.
- [Help Center](${absoluteUrl("/faq")}) - searchable knowledge base for program, bonuses, reviews, methodology and affiliate questions.

## Learning Center Categories

${learningCenterCategories}

## Learning Center Seed Articles

${learningCenterArticles}

## Responsible Gambling Guides

${learningGuides}

## Top Casino Profiles

${topCasinos}

## Important Context

SevenBet does not operate casinos, accept deposits or guarantee winnings. Some outbound links may be affiliate links. Users should verify operator terms, local legality, licensing, KYC, withdrawal rules and responsible gambling tools before depositing.
`;

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
