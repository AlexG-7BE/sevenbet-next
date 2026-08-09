import { isTemporaryDemoCasinoId } from "@/lib/demo-data/temporary-demo-authority";
import type { PublicCasinoDTO } from "@/lib/public-casino/public-casino.types";

/**
 * Reconciles legacy consumer-brand copy only at an explicitly selected public
 * presentation boundary. Compatibility identifiers and historical records are
 * intentionally outside this helper.
 */
export function currentPublicBrandText(value: string) {
  return value.replaceAll("SevenBet", "B4GAMBLE").replaceAll("SEVENBET", "B4GAMBLE");
}

export function currentPublicCasinoBrand(casino: PublicCasinoDTO) {
  if (!isTemporaryDemoCasinoId(casino.id)) return casino;
  const brand = (value: string) => currentPublicBrandText(value);
  return {
    ...casino,
    summary: brand(casino.summary),
    reviewContent: brand(casino.reviewContent),
    operator: casino.operator ? brand(casino.operator) : null,
    pros: casino.pros.map(brand),
    cons: casino.cons.map(brand),
    responsibleGamblingTools: casino.responsibleGamblingTools.map(brand),
    seo: {
      ...casino.seo,
      title: brand(casino.seo.title),
      description: brand(casino.seo.description),
      socialTitle: brand(casino.seo.socialTitle),
      socialDescription: brand(casino.seo.socialDescription),
    },
    media: {
      ...casino.media,
      logo: casino.media.logo ? { ...casino.media.logo, alt: brand(casino.media.logo.alt), caption: casino.media.logo.caption ? brand(casino.media.logo.caption) : null } : null,
      hero: casino.media.hero ? { ...casino.media.hero, alt: brand(casino.media.hero.alt), caption: casino.media.hero.caption ? brand(casino.media.hero.caption) : null } : null,
      screenshots: casino.media.screenshots.map((item) => ({ ...item, alt: brand(item.alt), caption: item.caption ? brand(item.caption) : null })),
      gallery: casino.media.gallery.map((item) => ({ ...item, alt: brand(item.alt), caption: item.caption ? brand(item.caption) : null })),
      socialImage: casino.media.socialImage ? { ...casino.media.socialImage, alt: brand(casino.media.socialImage.alt), caption: casino.media.socialImage.caption ? brand(casino.media.socialImage.caption) : null } : null,
    },
    affiliate: { href: null, available: false },
    bonuses: casino.bonuses.map((bonus) => ({
      ...bonus,
      title: brand(bonus.title),
      summary: brand(bonus.summary),
      wageringText: bonus.wageringText ? brand(bonus.wageringText) : null,
      eligibility: bonus.eligibility ? brand(bonus.eligibility) : null,
      importantConditions: bonus.importantConditions.map(brand),
      affiliate: { href: null, available: false },
    })),
  };
}
