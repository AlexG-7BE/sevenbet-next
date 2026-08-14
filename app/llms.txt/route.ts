import {
  getArticlePath,
  getCategoryPath,
  learningArticles as centerArticles,
  learningCategories as centerCategories,
} from "@/lib/learning-center";
import { learningArticles as helpArticles } from "@/lib/responsible-gambling";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

export function GET() {
  const helpGuides = helpArticles
    .map((article) => `- [${article.title}](${absoluteUrl(`/help/${article.slug}`)}): ${article.summary}`)
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
- [Responsible Gambling](${absoluteUrl("/responsible-gambling")}) - public orientation hub for education, private tools, the 10-step plan and Help.
- [Protected Help](${absoluteUrl("/help")}) - non-commercial control and support information with no casino, bonus or affiliate actions.
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

## Protected Help Guides

${helpGuides}

## Casino Data Boundary

- [Casino reviews](${absoluteUrl("/casinos")}) publishes only the records and presentation state authorised by the current public casino service.
- [Best Offers](${absoluteUrl("/best-offers")}) may show a clearly labelled demonstration when no complete published offers pass the evidence contract. Demonstration records are fictional and have no commercial outbound action.
- Casino and bonus availability, terms, licence context and jurisdiction eligibility must be verified on the current page before a user acts.

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
