import { formatProductMessage, type ProductPageMessages } from "@/lib/i18n/product-pages-catalog";
import type { PublicOfferPresentation } from "@/lib/public-casino/public-casino.types";
import type { PresentationResolution } from "@/lib/market/presentation-resolver";

type PresentationMetadata = Omit<PublicOfferPresentation, "selectedOffer">;

function regionName(countryCode: string | null, locale: string) {
  if (!countryCode) return null;
  try {
    return new Intl.DisplayNames([locale], { type: "region" }).of(countryCode) ?? countryCode;
  } catch {
    return countryCode;
  }
}

export function offerPresentationCopy(
  offer: PresentationMetadata | undefined,
  messages: ProductPageMessages,
  presentation: PresentationResolution,
) {
  const presentationMarket = regionName(offer?.presentationCountryCode ?? null, presentation.locale)
    ?? presentation.marketDisplayName;
  if (!offer) {
    return { label: messages.common.published, qualification: null };
  }
  if (offer.relation === "NONE") {
    return { label: messages.common.notListed, qualification: null };
  }
  if (offer.relation === "EXACT") {
    return {
      label: `${messages.profile.offerTerms} · ${presentationMarket}`,
      qualification: messages.common.current,
    };
  }
  if (offer.relation === "ROW") {
    return {
      label: `ROW · ${messages.profile.offerTerms}`,
      qualification: messages.profile.marketUnavailableCopy,
    };
  }
  return {
    label: `${regionName(offer.sourceCountryCode, presentation.locale) ?? offer.sourceCountryCode ?? messages.common.published} · ${messages.profile.offerTerms}`,
    qualification: formatProductMessage(messages.profile.marketUnavailable, { market: presentationMarket }),
  };
}
