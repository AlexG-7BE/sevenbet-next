import type { PublicOfferDTO } from "@/lib/public-offer/public-offer.types";
import type { ProductPageMessages } from "@/lib/i18n/product-pages-catalog";
import {
  classifyMediaRatio,
  mayPresentPromotionalMedia,
  offerMediaRenderingMode,
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
      alt=""
      height={offer.casino.logo.height ?? 120}
      loading="lazy"
      src={offer.casino.logo.url}
      width={offer.casino.logo.width ?? 240}
    /> : <span aria-hidden="true">{offer.casino.name.slice(0, 1).toUpperCase()}</span>}
  </span>;
}

export function CommercialOfferMedia({ offer, variant, messages }: { offer: PublicOfferDTO; variant: CommercialOfferMediaVariant; messages: ProductPageMessages }) {
  const media = offer.casino.hero;
  const ratio = classifyMediaRatio({ width: media?.width, height: media?.height });
  const demonstration = offer.dataClassification === "DEMO_FIXTURE";
  const allowed = mayPresentPromotionalMedia({ demonstration, governedActionAvailable: governedActionAvailable(offer) });
  const mode = offerMediaRenderingMode({ hasMedia: Boolean(media), ratio });
  const sourceLabel = messages.common.controlledMedia.toUpperCase();

  if (allowed && media && mode === "CONTAIN") {
    return <figure
      aria-label={`${offer.casino.name} · ${messages.common.controlledMedia}`}
      className={styles.frame}
      data-media-mode={mode}
      data-media-ratio={ratio}
      data-media-state="presented"
      data-offer-media={variant}
    >
      <div className={styles.mediaStage}>
        <img aria-hidden="true" className={styles.mediaBackdrop} alt="" height={media.height ?? 900} loading="lazy" src={media.url} width={media.width ?? 1600} />
        <img className={styles.mediaArtwork} alt={media.alt || offer.casino.name} height={media.height ?? 900} loading="lazy" src={media.url} width={media.width ?? 1600} />
      </div>
      <figcaption><span>B4GAMBLE / {sourceLabel}</span><small>{offer.casino.name}</small></figcaption>
    </figure>;
  }

  return <figure
    aria-label={`${offer.casino.name} · ${messages.common.controlledMedia}`}
    className={styles.composed}
    data-media-mode="COMPOSED"
    data-media-ratio={media ? ratio : "missing"}
    data-media-state="presented"
    data-offer-media={variant}
  >
    <div className={styles.compositionBody}>
      <span className={styles.compositionSource}>B4GAMBLE / {sourceLabel}</span>
      <div className={styles.compositionIdentity}><OperatorLogo offer={offer} prominent /><span><small>{offer.casino.name}</small><strong>{offer.bonus.title}</strong></span></div>
      {media ? <img className={styles.controlledStrip} alt={media.alt || offer.casino.name} height={media.height ?? 50} loading="lazy" src={media.url} width={media.width ?? 320} /> : null}
      <i aria-hidden="true" />
    </div>
    <figcaption><span>{messages.common.current}</span><small>{offer.casino.name}</small></figcaption>
  </figure>;
}
