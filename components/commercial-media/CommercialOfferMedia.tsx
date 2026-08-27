import type { PublicOfferDTO } from "@/lib/public-offer/public-offer.types";
import {
  classifyMediaRatio,
  isFeaturedCardMediaCompatible,
  mayPresentPromotionalMedia,
} from "@/lib/media/media-presentation";

import styles from "./CommercialOfferMedia.module.css";

export type CommercialOfferMediaVariant = "featured" | "secondary" | "bonus";

function governedActionAvailable(offer: PublicOfferDTO) {
  return offer.dataClassification === "PUBLISHED_RECORD"
    && offer.commercialAvailability === "AVAILABLE"
    && offer.action.available
    && Boolean(offer.action.href);
}

export function OperatorLogo({ offer, prominent = false }: { offer: PublicOfferDTO; prominent?: boolean }) {
  return <span className={styles.logo} data-prominent={prominent || undefined}>
    {offer.casino.logo ? <img
      alt={offer.casino.logo.alt || `${offer.casino.name} logo`}
      height={offer.casino.logo.height ?? 120}
      loading="lazy"
      src={offer.casino.logo.url}
      width={offer.casino.logo.width ?? 240}
    /> : <span aria-hidden="true">{offer.casino.name.slice(0, 1).toUpperCase()}</span>}
  </span>;
}

export function CommercialOfferMedia({ offer, variant }: { offer: PublicOfferDTO; variant: CommercialOfferMediaVariant }) {
  const media = offer.casino.hero;
  const ratio = classifyMediaRatio({ width: media?.width, height: media?.height });
  const demonstration = offer.dataClassification === "DEMO_FIXTURE";
  const allowed = Boolean(
    media
    && isFeaturedCardMediaCompatible(ratio)
    && mayPresentPromotionalMedia({ demonstration, governedActionAvailable: governedActionAvailable(offer) }),
  );

  if (allowed && media) {
    return <figure
      aria-label={`${offer.casino.name} controlled media`}
      className={styles.frame}
      data-media-ratio={ratio}
      data-media-state="presented"
      data-offer-media={variant}
    >
      <div><img
        alt={media.alt || `${offer.casino.name} promotional media`}
        height={media.height ?? 900}
        loading="lazy"
        src={media.url}
        width={media.width ?? 1600}
      /></div>
      <figcaption><span>B4GAMBLE / CONTROLLED MEDIA</span><small>{ratio.replaceAll("-", " ")}</small></figcaption>
    </figure>;
  }

  return <div
    aria-label={`No suitable promotional media available for ${offer.casino.name}`}
    className={styles.fallback}
    data-media-ratio={media ? ratio : "missing"}
    data-media-state="fallback"
    data-offer-media={variant}
    role="img"
  >
    <span>B4GAMBLE / CONTROLLED MEDIA</span>
    <strong>Decision first. Creative optional.</strong>
    <p>Logo, terms and review remain available without cropped or commercially unauthorised artwork.</p>
    <i aria-hidden="true" />
  </div>;
}
