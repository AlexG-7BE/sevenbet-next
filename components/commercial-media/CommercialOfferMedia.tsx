import type { ReactNode } from "react";

import type { PublicOfferDTO } from "@/lib/public-offer/public-offer.types";
import type { ProductPageMessages } from "@/lib/i18n/product-pages-catalog";
import { GovernedCommercialAction } from "@/components/casino-profile/CasinoOutboundAction";
import { ResponsivePlacementImage } from "@/components/media/ResponsivePlacementImage";
import {
  commercialCreativeFormat,
  creativePresentationFamily,
  isPromotionalPresentationFamily,
} from "@/lib/media/commercial-formats";
import {
  classifyMediaRatio,
  mayPresentPromotionalMedia,
  offerMediaRenderingMode,
} from "@/lib/media/media-presentation";

import styles from "./CommercialOfferMedia.module.css";

export type CommercialOfferMediaVariant = "featured" | "secondary" | "bonus";

export function hasGovernedCommercialOfferAction(offer: PublicOfferDTO) {
  return offer.dataClassification === "PUBLISHED_RECORD"
    && offer.commercialAvailability === "AVAILABLE"
    && offer.action.available
    && Boolean(offer.action.href && /^\/r\/[a-z0-9][a-z0-9-]*$/i.test(offer.action.href));
}

export function OperatorLogo({ offer, prominent = false }: { offer: PublicOfferDTO; prominent?: boolean }) {
  return <span className={styles.logo} data-prominent={prominent || undefined}>
    {offer.casino.logo ? <ResponsivePlacementImage
      alt=""
      height={offer.casino.logo.height ?? 120}
      loading="lazy"
      media={offer.casino.logo}
      width={offer.casino.logo.width ?? 240}
    /> : <span aria-hidden="true">{offer.casino.name.slice(0, 1).toUpperCase()}</span>}
  </span>;
}

export function CommercialOfferMedia({ offer, variant, messages }: { offer: PublicOfferDTO; variant: CommercialOfferMediaVariant; messages: ProductPageMessages }) {
  const placement = variant === "featured"
    ? "BEST_OFFER_FEATURED"
    : variant === "secondary"
      ? "BEST_OFFER_SECONDARY"
      : "BONUS_LISTING_CARD";
  const resolved = offer.bonus.media?.[placement];
  const media = resolved?.asset ?? offer.casino.hero;
  const mobileMedia = resolved?.variants.MOBILE?.asset ?? media?.variants?.MOBILE ?? null;
  const format = commercialCreativeFormat(media?.width, media?.height);
  const mobileFormat = commercialCreativeFormat(mobileMedia?.width, mobileMedia?.height);
  const mediaSource = resolved?.source ?? (media ? "LEGACY_HERO" : "CODE_FALLBACK");
  const presentationFamily = creativePresentationFamily({
    height: media?.height,
    mediaType: media?.type,
    placement,
    source: mediaSource,
    width: media?.width,
  });
  const mobilePresentationFamily = mobileMedia
    ? creativePresentationFamily({
        height: mobileMedia.height,
        mediaType: mobileMedia.type,
        placement,
        source: resolved?.variants.MOBILE?.source ?? mediaSource,
        width: mobileMedia.width,
      })
    : presentationFamily;
  const ratio = classifyMediaRatio({ width: media?.width, height: media?.height });
  const demonstration = offer.dataClassification === "DEMO_FIXTURE";
  const governed = hasGovernedCommercialOfferAction(offer);
  const allowed = mayPresentPromotionalMedia({ demonstration, governedActionAvailable: governed });
  const mode = resolved?.renderingMode ?? offerMediaRenderingMode({ hasMedia: Boolean(media), ratio });
  const sourceLabel = messages.common.controlledMedia.toUpperCase();
  const focalPoint = resolved?.focalPoint
    ? `${resolved.focalPoint.x * 100}% ${resolved.focalPoint.y * 100}%`
    : "center";
  const creativeAriaLabel = `${messages.common.actionAvailable}: ${offer.casino.name} — ${offer.bonus.title}`;

  const promotionalMedia = Boolean(
    allowed
    && media
    && (isPromotionalPresentationFamily(presentationFamily) || isPromotionalPresentationFamily(mobilePresentationFamily)),
  );

  function withGovernedAction(content: ReactNode, clickable = promotionalMedia) {
    if (!clickable || !governed || !offer.action.href) return content;
    return <GovernedCommercialAction
      action={{ href: offer.action.href, label: creativeAriaLabel }}
      anchorData={{
        "data-presentation-family": presentationFamily,
        "data-mobile-presentation-family": mobilePresentationFamily,
      }}
      ariaLabel={creativeAriaLabel}
      className={styles.creativeAction}
      context={{ source: "CREATIVE", placement }}
      messages={messages.outbound}
      offerMediaVariant={variant}
    >{content}</GovernedCommercialAction>;
  }

  if (promotionalMedia && media) {
    return withGovernedAction(<figure
      aria-label={`${offer.casino.name} · ${messages.common.controlledMedia}`}
      className={styles.frame}
      data-commercial-clickable={governed || undefined}
      data-commercial-family={format?.family ?? "UNRECOGNIZED"}
      data-commercial-format={format?.id ?? "UNRECOGNIZED"}
      data-media-mode={mode}
      data-media-ratio={ratio}
      data-media-state="presented"
      data-media-source={mediaSource}
      data-mobile-commercial-family={mobileFormat?.family ?? undefined}
      data-mobile-commercial-format={mobileFormat?.id ?? undefined}
      data-mobile-presentation-family={mobilePresentationFamily}
      data-offer-media={variant}
      data-presentation-family={presentationFamily}
      data-creative-scale-cap="1"
    >
      <div className={styles.mediaStage}>
        <ResponsivePlacementImage className={styles.mediaArtwork} style={{ objectPosition: focalPoint }} alt={media.alt || offer.casino.name} height={media.height ?? 900} loading="lazy" media={media} width={media.width ?? 1600} />
      </div>
      <figcaption><span>B4GAMBLE / {sourceLabel}</span><small>{presentationFamily.replaceAll("_", " ")}</small></figcaption>
    </figure>);
  }

  return <figure
    aria-label={`${offer.casino.name} · ${messages.common.controlledMedia}`}
    className={styles.identityFallback}
    data-commercial-family={format?.family ?? "UNRECOGNIZED"}
    data-commercial-format={format?.id ?? "UNRECOGNIZED"}
    data-media-mode="COMPOSED"
    data-media-ratio={media ? ratio : "missing"}
    data-media-state="presented"
    data-media-source={mediaSource}
    data-mobile-commercial-family={mobileFormat?.family ?? undefined}
    data-mobile-commercial-format={mobileFormat?.id ?? undefined}
    data-mobile-presentation-family={mobilePresentationFamily}
    data-offer-media={variant}
    data-presentation-family={presentationFamily}
  >
    <div className={styles.identityFallbackBody}>
      <span>B4GAMBLE / {sourceLabel}</span>
      <strong>{messages.common.mediaUnavailableTitle}</strong>
      <i aria-hidden="true" />
    </div>
    <figcaption><span>{demonstration ? messages.common.demoData : messages.common.published}</span><small>{presentationFamily.replaceAll("_", " ")}</small></figcaption>
  </figure>;
}
