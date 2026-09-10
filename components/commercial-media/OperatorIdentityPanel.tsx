import type { PublicOfferDTO } from "@/lib/public-offer/public-offer.types";
import type { ProductPageMessages } from "@/lib/i18n/product-pages-catalog";
import { ResponsivePlacementImage } from "@/components/media/ResponsivePlacementImage";

import styles from "./OperatorIdentityPanel.module.css";

export type OperatorIdentityVariant = "featured" | "secondary" | "bonus";

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

/** B4GAMBLE-owned composition: operator logo only, never promotional artwork. */
export function OperatorIdentityPanel({
  offer,
  variant,
  messages,
}: {
  offer: PublicOfferDTO;
  variant: OperatorIdentityVariant;
  messages: ProductPageMessages;
}) {
  return <figure
    aria-label={`${offer.casino.name} · ${messages.common.published}`}
    className={styles.panel}
    data-offer-identity={variant}
  >
    <div className={styles.body}>
      <OperatorLogo offer={offer} prominent={variant === "featured"} />
      <div>
        <span>B4GAMBLE / {messages.common.published}</span>
        <strong>{offer.casino.name}</strong>
      </div>
      <i aria-hidden="true" />
    </div>
    <figcaption>{offer.bonus.title}</figcaption>
  </figure>;
}
