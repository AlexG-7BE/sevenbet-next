import { getTopCasinos } from "@/lib/data";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

export function GET() {
  const topCasinos = getTopCasinos(8)
    .map((casino) => `- [${casino.name}](${absoluteUrl(`/casino/${casino.slug}`)}): ${casino.bonusHeadline}; wagering x${casino.wagering}; license ${casino.license}.`)
    .join("\n");

  const body = `# SevenBet

SevenBet is a control-first casino comparison site. It helps users verify a mindful gambling plan before comparing welcome bonuses.

## Core Pages

- [Home](${absoluteUrl("/")}) - verified-control marketplace entry point.
- [Self-check](${absoluteUrl("/self-check")}) - risk signal checklist before bonuses.
- [Budget calculator](${absoluteUrl("/tools/budget-calculator")}) - session limit and stop-loss calculator.
- [10-step program](${absoluteUrl("/program")}) - mindful gambling control program.
- [Best bonuses](${absoluteUrl("/bonuses")}) - welcome bonus comparison.
- [Catalog](${absoluteUrl("/catalog")}) - casino database preview.
- [Bonus guide](${absoluteUrl("/bonus-guide")}) - wagering, max bet, expiry and withdrawal rules.
- [Responsible gaming](${absoluteUrl("/responsible-gaming")}) - safety guidance and red flags.

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
