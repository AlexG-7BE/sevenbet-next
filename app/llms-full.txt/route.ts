import { jurisdictionResolver } from "@/lib/jurisdiction/resolver";
import { buildLlmsFullTxt, llmsLaunchMarkets } from "@/lib/seo/llms";
import { LLMS_FULL_OFFER_QUERY, loadLlmsFullMarket, type LlmsFullDependencies } from "@/lib/seo/llms-full";
import { publicOfferService } from "@/lib/services/public-offer.service";

export const dynamic = "force-dynamic";

const dependencies: LlmsFullDependencies = {
  // A trusted signal for the market's own country: the same authority a visitor from there gets.
  resolveAuthority: (countryCode, now) => jurisdictionResolver.resolve({
    requestCountrySignal: { countryCode, marketCode: countryCode, trust: "TRUSTED", observedAt: now },
    accountCountry: null,
    now,
  }),
  searchOffers: (authority, options) => publicOfferService.searchOffers(LLMS_FULL_OFFER_QUERY, authority, options),
};

/**
 * The offers each launch market's Bonuses page shows at request time. The offer data comes
 * from the shared editorial cache; the market rules (Germany's advertising window included)
 * are applied per request, so the file is only cached by the client, for five minutes.
 */
export async function GET() {
  const now = new Date();
  const markets = await Promise.all(llmsLaunchMarkets().map((market) => loadLlmsFullMarket(market, now, dependencies)));
  return new Response(buildLlmsFullTxt({ generatedAt: now, markets }), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=300",
    },
  });
}
