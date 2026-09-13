import { PartnerHostedCommercialFigure } from "@/components/commercial-media/PartnerHostedCommercialFigure";
import type { ProductPageMessages } from "@/lib/i18n/product-pages-catalog";
import type { PublicCasinoDTO, PublicCasinoMedia } from "@/lib/public-casino/public-casino.types";

import styles from "./CasinoProfileMediaStrip.module.css";

function hosted(media: PublicCasinoMedia | null): media is PublicCasinoMedia & {
  sourceMode: "PARTNER_HOSTED_IMAGE" | "PARTNER_HOSTED_EMBED";
  hostedCreativeId: string;
} {
  return Boolean(
    media?.hostedCreativeId
    && (media.sourceMode === "PARTNER_HOSTED_IMAGE" || media.sourceMode === "PARTNER_HOSTED_EMBED"),
  );
}

export function CasinoProfileMediaStrip({ casino, messages }: { casino: PublicCasinoDTO; messages: ProductPageMessages }) {
  const placement = casino.media.placements?.CASINO_DIRECTORY_CARD;
  const desktop = placement?.variants.DESKTOP?.asset ?? placement?.asset ?? null;
  const mobile = placement?.variants.MOBILE?.asset ?? placement?.asset ?? null;
  if (!hosted(desktop)) return null;

  const safeMobile = hosted(mobile) ? mobile : desktop;
  const canonicalHref = casino.action?.href ?? null;
  return <aside aria-label={`${casino.name} · ${messages.common.controlledMedia}`} className={styles.shell} data-casino-profile-hosted-media>
    <PartnerHostedCommercialFigure
      canonicalHref={canonicalHref}
      casinoName={casino.name}
      fallbackMedia={casino.media.hero ?? casino.media.logo}
      governed={Boolean(canonicalHref)}
      media={desktop}
      messages={messages}
      mobileMedia={safeMobile}
      offerTitle={`${casino.name} · ${messages.common.controlledMedia}`}
      placement="CASINO_OFFER_BLOCK"
      variant="bonus"
    />
  </aside>;
}
