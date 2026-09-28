import { articlePath, type PublicArticle } from "@/lib/articles/article-types";
import {
  DEFAULT_MARKET_PROFILE,
  languageRouteByLocale,
  marketProfileByCountry,
  publicMarketPath,
  type MarketProfile,
} from "@/lib/market/registry";
import { isLocalizedPublicDestination } from "@/lib/market/routing";
import { absoluteUrl } from "@/lib/site";

/**
 * The launch markets B4GAMBLE is built for (28 Sep 2026), in the order llms.txt lists them.
 * Each has its own language route, published reviews and offers.
 */
export const LLMS_LAUNCH_MARKET_CODES = ["GB", "SE", "DK", "DE"] as const;

export function llmsLaunchMarkets(): MarketProfile[] {
  return LLMS_LAUNCH_MARKET_CODES.map((code) => {
    const market = marketProfileByCountry(code);
    if (!market) throw new Error(`Launch market ${code} is missing from the registry`);
    return market;
  });
}

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

const languageNames = new Intl.DisplayNames(["en"], { type: "language" });

export function englishMarketName(market: Pick<MarketProfile, "countryCode">) {
  return regionNames.of(market.countryCode) ?? market.countryCode;
}

/** The market's name as it reads inside an English sentence ("the United Kingdom"). */
export function marketNameInSentence(market: Pick<MarketProfile, "countryCode">) {
  const name = englishMarketName(market);
  return /^United /.test(name) ? `the ${name}` : name;
}

/** The canonical URL of a page in English: locale-prefixed where the page is localized, so no 307 hop. */
export function canonicalEnglishUrl(pathname: string) {
  return absoluteUrl(isLocalizedPublicDestination(pathname, DEFAULT_MARKET_PROFILE)
    ? publicMarketPath(DEFAULT_MARKET_PROFILE, DEFAULT_MARKET_PROFILE.defaultLocale, pathname)
    : pathname);
}

export function marketUrl(market: MarketProfile, pathname: string) {
  return absoluteUrl(publicMarketPath(market, market.defaultLocale, pathname));
}

const oneLine = (value: string) => value.replace(/\s+/g, " ").trim();

function formatScore(score: number | null | undefined) {
  return typeof score === "number" && Number.isFinite(score)
    ? `editor score ${new Intl.NumberFormat("en-GB", { maximumFractionDigits: 1 }).format(score)}/10`
    : null;
}

export type LlmsMarketCatalogue = {
  market: MarketProfile;
  /** Unprefixed product pages this market's language route publishes as indexable (`/bonuses` …). */
  productPages: readonly string[];
  reviews: ReadonlyArray<{ name: string; slug: string; score: number | null }>;
};

const PRODUCT_PAGE_LINKS: Record<string, { name: string; description: string }> = {
  "/bonuses": { name: "Casino bonuses", description: "current welcome bonuses compared by wagering, minimum deposit, maximum bet and expiry" },
  "/best-offers": { name: "Best offers", description: "three offers picked by the editors, terms shown before any click" },
  "/casinos": { name: "Casino reviews", description: "published reviews with licence, payments, payout times and editor score" },
};

/**
 * llms.txt (llmstxt.org): what B4GAMBLE is, for which markets, where each market's pages
 * are, every published review, the Programme and the policies. Commercial pages first,
 * written plainly; every link is a canonical URL, so no agent follows a redirect.
 */
export function buildLlmsTxt(input: {
  markets: readonly LlmsMarketCatalogue[];
  articles: readonly PublicArticle[];
}) {
  const marketNames = input.markets.map((entry) => marketNameInSentence(entry.market));
  const marketList = marketNames.length > 1
    ? `${marketNames.slice(0, -1).join(", ")} and ${marketNames[marketNames.length - 1]}`
    : marketNames[0] ?? "";

  const marketSections = input.markets.map(({ market, productPages }) => {
    const language = languageRouteByLocale(market.defaultLocale);
    const pages = ["/bonuses", "/best-offers", "/casinos"]
      .filter((pathname) => productPages.includes(pathname))
      .map((pathname) => `- [${PRODUCT_PAGE_LINKS[pathname].name}](${marketUrl(market, pathname)}): ${PRODUCT_PAGE_LINKS[pathname].description}.`);
    return [
      `### ${englishMarketName(market)} (${language.label}, /${language.publicSlug})`,
      "",
      `- [Home](${marketUrl(market, "/")}): start page in ${languageNames.of(language.language) ?? language.label}.`,
      ...pages,
    ].join("\n");
  });

  const reviewSections = input.markets
    .filter(({ reviews }) => reviews.length)
    .map(({ market, reviews }) => {
      const language = languageRouteByLocale(market.defaultLocale);
      return [
        `### ${language.label} (${englishMarketName(market)})`,
        "",
        ...reviews.map((review) => {
          const score = formatScore(review.score);
          return `- [${oneLine(review.name)} review](${marketUrl(market, `/casino/${review.slug}`)})${score ? `: ${score}.` : ""}`;
        }),
      ].join("\n");
    });

  const articleLines = input.articles
    .map((article) => `- [${oneLine(article.title)}](${canonicalEnglishUrl(articlePath(article))}): ${oneLine(article.excerpt)}`);

  return `# B4GAMBLE

> B4GAMBLE compares online casinos and their bonus terms for adults (18+) in ${marketList}. Each published review covers licence, payment methods, payout times and games, and gives an editor score from 0 to 10. The bonus pages compare wagering requirements, minimum deposit, maximum bet and expiry side by side, so the terms that decide what a bonus is worth are visible before anyone signs up.

B4GAMBLE does not run a casino, take deposits or accept bets. Some links to operators are affiliate links: B4GAMBLE may earn a commission when a reader signs up through one, and commission never changes an editor score. Offers depend on the reader's country: readers in ${marketList} see only offers from operators licensed there, and readers in Germany see offers only between 21:00 and 06:00 Berlin time, as German rules require.

The offers each market's Bonuses page shows right now, with their terms, are listed in [llms-full.txt](${absoluteUrl("/llms-full.txt")}).

## Markets

${marketSections.join("\n\n")}

## How B4GAMBLE reviews

- [Methodology](${canonicalEnglishUrl("/methodology")}): how casinos are reviewed and scored, and how offers are ordered.
- [Bonus guide](${canonicalEnglishUrl("/bonus-guide")}): wagering, maximum bet, expiry and withdrawal rules explained.
- [Affiliate disclosure](${canonicalEnglishUrl("/affiliate-disclosure")}): how B4GAMBLE earns money and why it does not change scores.
- [About](${canonicalEnglishUrl("/about")}): who runs B4GAMBLE.
- [FAQ](${canonicalEnglishUrl("/faq")}): answers about reviews, offers, the Programme, privacy and Help.
- [Contact](${canonicalEnglishUrl("/contact")}): how to reach the editors.
- [Privacy](${canonicalEnglishUrl("/privacy")}): what data B4GAMBLE keeps and why.
- [Terms](${canonicalEnglishUrl("/terms")}): terms of use.

## Casino reviews

${reviewSections.length ? reviewSections.join("\n\n") : "No review is published at the moment."}

## 10-Step Control Programme

The Programme is B4GAMBLE's own private plan for keeping gambling under control. It is separate from the casino pages: nothing a person does in it is used for offers or advertising.

- [10-Step Control Programme](${canonicalEnglishUrl("/program")}): the private plan, one step at a time.
- [The 10 steps](${canonicalEnglishUrl("/10-steps")}): what each step covers.
- [Responsible gambling](${canonicalEnglishUrl("/responsible-gambling")}): education, practical control, the 10-step plan and Help.
- [Help](${canonicalEnglishUrl("/help")}): support information with no casino, bonus or affiliate links.

## Published Learning Center Articles

${articleLines.length ? articleLines.join("\n") : "- [Learning Center](" + canonicalEnglishUrl("/learn") + "): guides are being published."}

## Before acting

Offers, terms, licences and availability change. Check the current page, the operator's own terms and local law before depositing. Gambling can be addictive; play only with money you can afford to lose.
`;
}

export type LlmsFullOffer = {
  casinoName: string;
  casinoSlug: string;
  editorScore: number | null;
  headline: string;
  bonusType: string;
  terms: readonly string[];
};

export type LlmsFullMarket = {
  market: MarketProfile;
  state: "OFFERS" | "NO_OFFERS" | "OUTSIDE_ADVERTISING_WINDOW" | "PROHIBITED" | "UNAVAILABLE";
  /** Plain-words reason when the page shows no offers. */
  note?: string;
  offers: readonly LlmsFullOffer[];
};

/**
 * llms-full.txt: for each launch market, the offers that market's Bonuses page presents at
 * this moment, in the page's order, with their terms and a link to our review. It carries
 * no partner or `/r/` link and does not depend on who asks: every market is resolved from
 * the market itself, never from the requester's IP.
 */
export function buildLlmsFullTxt(input: { generatedAt: Date; markets: readonly LlmsFullMarket[] }) {
  const sections = input.markets.map(({ market, state, note, offers }) => {
    const language = languageRouteByLocale(market.defaultLocale);
    const heading = `## ${englishMarketName(market)} — ${marketUrl(market, "/bonuses")}`;
    const intro = `Language: ${languageNames.of(language.language) ?? language.label} (${language.label}). Page for readers in ${marketNameInSentence(market)}.`;
    if (state !== "OFFERS" || !offers.length) {
      return [heading, "", intro, "", note ?? "No offers are shown on this page right now."].join("\n");
    }
    const lines = offers.map((offer, index) => {
      const score = formatScore(offer.editorScore);
      return [
        `${index + 1}. ${oneLine(offer.casinoName)}: ${oneLine(offer.headline)}`,
        `   - Type: ${offer.bonusType}`,
        ...offer.terms.map((term) => `   - ${oneLine(term)}`),
        ...(score ? [`   - ${score[0].toUpperCase()}${score.slice(1)}`] : []),
        `   - Review: ${marketUrl(market, `/casino/${offer.casinoSlug}`)}`,
      ].join("\n");
    });
    return [heading, "", intro, `${offers.length} offer${offers.length === 1 ? "" : "s"}, in the order the page shows them.`, "", ...lines].join("\n");
  });

  return `# B4GAMBLE — current offers by market

> Generated ${input.generatedAt.toISOString()}. For each launch market, the offers its Bonuses page presents at this moment, in the same order, with the terms that decide what a bonus is worth. 18+. B4GAMBLE may earn a commission from operators; this file has no affiliate links. Terms change: check the review page and the operator's own terms before acting.

Summary and site guide: ${absoluteUrl("/llms.txt")}

${sections.join("\n\n")}
`;
}
