import { getTopCasinos } from "@/lib/data";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

export function GET() {
  const topCasinos = getTopCasinos(8)
    .map((casino) => `- [${casino.name}](${absoluteUrl(`/casino/${casino.slug}`)}): ${casino.bonusHeadline}; wagering x${casino.wagering}; license ${casino.license}.`)
    .join("\n");

  const body = `# SevenBet

SevenBet is a responsible gambling platform centered on the SevenBet 10-Step Control Program. Casino comparisons and bonus offers are secondary resources presented inside a control-first framework.

## Core Pages

- [Home](${absoluteUrl("/")}) - program-first responsible gambling entry point.
- [10-step program](${absoluteUrl("/program")}) - the primary SevenBet control program.
- [Self-check](${absoluteUrl("/self-check")}) - structured self-assessment before casino comparison.
- [Responsible gambling](${absoluteUrl("/responsible-gambling")}) - safety guidance, red flags and support routes.
- [Budget calculator](${absoluteUrl("/tools/budget-calculator")}) - session limit and stop-loss calculator.
- [Casino bonuses](${absoluteUrl("/bonuses")}) - secondary bonus comparison directory.
- [Casino reviews](${absoluteUrl("/casinos")}) - reviewed casino profiles.
- [Methodology](${absoluteUrl("/methodology")}) - review criteria and editorial process.
- [Affiliate disclosure](${absoluteUrl("/affiliate-disclosure")}) - commercial relationship explanation.
- [Bonus guide](${absoluteUrl("/bonus-guide")}) - wagering, max bet, expiry and withdrawal rules.

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
