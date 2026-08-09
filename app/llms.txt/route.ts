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

  const body = `# B4GAMBLE

B4GAMBLE is a responsible gambling platform centered on the B4GAMBLE 10-Step Control Program. Casino comparisons and bonus offers are secondary resources presented inside a control-first framework.

## Core Pages

- [Home](${absoluteUrl("/")}) - program-first responsible gambling entry point.
- [10-step program](${absoluteUrl("/program")}) - the primary B4GAMBLE control program.
- [Self-Check](${absoluteUrl("/self-check")}) - private, non-clinical reflection whose answers remain local to the browser and do not personalise commercial recommendations.
- [Learning Center](${absoluteUrl("/learn")}) - scalable educational hub for casino basics, bonuses, safety, payments, licensing, games, glossary and country guides.
- [Protected Help](${absoluteUrl("/responsible-gambling")}) - non-commercial control and support information with no casino, bonus or affiliate actions.
- [Personal Gambling Limit Tracker](${absoluteUrl("/tools/budget-calculator")}) - works from a gambling limit chosen by the user. B4GAMBLE does not calculate a safe or affordable amount and does not generate a stop-loss recommendation.
- [Casino bonuses](${absoluteUrl("/bonuses")}) - secondary bonus comparison directory.
- [Casino reviews](${absoluteUrl("/casinos")}) - reviewed casino profiles.
- [Methodology](${absoluteUrl("/methodology")}) - review criteria and editorial process.
- [Affiliate disclosure](${absoluteUrl("/affiliate-disclosure")}) - commercial relationship explanation.
- [Bonus guide](${absoluteUrl("/bonus-guide")}) - wagering, max bet, expiry and withdrawal rules.
- [B4GAMBLE FAQ](${absoluteUrl("/faq")}) - product and trust answers covering B4GAMBLE, the Programme, private tools, editorial and affiliate boundaries, privacy and Protected Help separation.
- [Privacy](${absoluteUrl("/privacy")}) - current handling boundaries for account, Programme, Self-Check, Personal Limit Tracker, Protected Help and affiliate-related data.
- [Terms](${absoluteUrl("/terms")}) - current service, commercial, operator and user boundaries for B4GAMBLE.

## Learning Center Categories

${learningCenterCategories}

## Learning Center Seed Articles

${learningCenterArticles}

## Responsible Gambling Guides

${learningGuides}

## Top Casino Profiles

${topCasinos}

## Important Context

B4GAMBLE does not operate casinos, accept deposits or guarantee winnings. Some outbound links may be affiliate links. Users should verify operator terms, local legality, licensing, KYC, withdrawal rules and responsible gambling tools before depositing.
`;

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
