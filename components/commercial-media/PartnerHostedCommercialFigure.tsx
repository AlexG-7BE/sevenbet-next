"use client";

import { useEffect, useRef, useState } from "react";

import { GovernedCommercialAction } from "@/components/casino-profile/CasinoOutboundAction";
import type { ProductPageMessages } from "@/lib/i18n/product-pages-catalog";
import {
  commercialCreativeFormat,
  creativePresentationFamily,
} from "@/lib/media/commercial-formats";
import { classifyMediaRatio } from "@/lib/media/media-presentation";
import type { OfferMediaPlacementName } from "@/lib/media/placement-media";
import type { PublicCasinoMedia } from "@/lib/public-casino/public-casino.types";

import styles from "./CommercialOfferMedia.module.css";

type HostedState = "loading" | "ready" | "failed";

function isHosted(media: PublicCasinoMedia | null): media is PublicCasinoMedia & {
  sourceMode: "PARTNER_HOSTED_IMAGE" | "PARTNER_HOSTED_EMBED";
  hostedCreativeId: string;
} {
  return Boolean(
    media?.hostedCreativeId
    && (media.sourceMode === "PARTNER_HOSTED_IMAGE" || media.sourceMode === "PARTNER_HOSTED_EMBED"),
  );
}

function creativeHref(canonicalHref: string, creativeId: string) {
  const separator = canonicalHref.includes("?") ? "&" : "?";
  return `${canonicalHref}${separator}${new URLSearchParams({ creative: creativeId })}`;
}

export function PartnerHostedCommercialFigure({
  canonicalHref,
  casinoName,
  fallbackMedia,
  governed,
  media,
  messages,
  mobileMedia,
  offerTitle,
  placement,
  variant,
}: {
  canonicalHref: string | null;
  casinoName: string;
  fallbackMedia: PublicCasinoMedia | null;
  governed: boolean;
  media: PublicCasinoMedia;
  messages: ProductPageMessages;
  mobileMedia: PublicCasinoMedia | null;
  offerTitle: string;
  placement: OfferMediaPlacementName;
  variant: "featured" | "secondary" | "bonus";
}) {
  const [mobile, setMobile] = useState(false);
  const selected = mobile && mobileMedia ? mobileMedia : media;
  const hosted = isHosted(selected);
  const creativeId = hosted ? selected.hostedCreativeId : null;
  const [state, setState] = useState<HostedState>(hosted ? "loading" : "ready");
  const frameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const update = () => setMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    setState(hosted ? "loading" : "ready");
  }, [creativeId, hosted]);

  useEffect(() => {
    if (!hosted || selected.sourceMode !== "PARTNER_HOSTED_EMBED" || !creativeId) return;
    const frame = frameRef.current;
    const receive = (event: MessageEvent<unknown>) => {
      if (event.source !== frame?.contentWindow || !event.data || typeof event.data !== "object") return;
      const message = event.data as Record<string, unknown>;
      if (message.type !== "b4-partner-creative-frame" || message.creativeId !== creativeId) return;
      if (message.state === "ready" || message.state === "failed") setState(message.state);
    };
    const timeout = window.setTimeout(() => setState("failed"), 9_000);
    window.addEventListener("message", receive);
    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("message", receive);
    };
  }, [creativeId, hosted, selected.sourceMode]);

  const fallback = state === "failed" ? fallbackMedia : null;
  const unavailable = state === "failed" && !fallbackMedia;
  const presented = fallback ?? selected;
  const presentedIsHosted = !fallback && !unavailable && hosted;
  const format = commercialCreativeFormat(presented.width, presented.height);
  const presentationFamily = creativePresentationFamily({
    height: presented.height,
    mediaType: presented.type,
    placement,
    source: fallback ? "LEGACY_HERO" : "EXPLICIT",
    width: presented.width,
  });
  const ratio = classifyMediaRatio({ width: presented.width, height: presented.height });
  const ariaLabel = `${messages.common.actionAvailable}: ${casinoName} — ${offerTitle}`;
  const actionHref = governed && canonicalHref
    ? presentedIsHosted && state === "ready" && creativeId
      ? creativeHref(canonicalHref, creativeId)
      : !presentedIsHosted || fallback
        ? canonicalHref
        : null
    : null;

  return <figure
    aria-label={`${casinoName} · ${messages.common.controlledMedia}`}
    className={styles.frame}
    data-commercial-clickable={Boolean(actionHref) || undefined}
    data-commercial-family={format?.family ?? "UNRECOGNIZED"}
    data-commercial-format={format?.id ?? "UNRECOGNIZED"}
    data-hosted-state={presentedIsHosted ? state : undefined}
    data-media-mode="CONTAIN"
    data-media-ratio={ratio}
    data-media-source={presentedIsHosted ? "PARTNER_HOSTED" : "FIRST_PARTY_FALLBACK"}
    data-offer-media={variant}
    data-presentation-family={presentationFamily}
  >
    <div className={styles.mediaStage}>
      {unavailable ? <div className={styles.hostedUnavailable}>
        <span>B4GAMBLE</span>
        <strong>{messages.common.mediaUnavailableTitle}</strong>
      </div> : fallback ? <img
        alt={fallback.alt || casinoName}
        className={styles.mediaArtwork}
        height={fallback.height ?? 900}
        loading="lazy"
        src={fallback.url}
        width={fallback.width ?? 1600}
      /> : selected.sourceMode === "PARTNER_HOSTED_EMBED" ? <iframe
        aria-label={`${casinoName} — ${messages.common.controlledMedia}`}
        className={styles.hostedEmbed}
        height={selected.height ?? 100}
        loading="lazy"
        ref={frameRef}
        referrerPolicy="no-referrer"
        sandbox="allow-scripts"
        src={selected.url}
        tabIndex={-1}
        title={`${casinoName} — ${messages.common.controlledMedia}`}
        width={selected.width ?? 300}
      /> : <img
        alt={selected.alt || casinoName}
        className={styles.mediaArtwork}
        height={selected.height ?? 250}
        loading="lazy"
        onError={() => setState("failed")}
        onLoad={() => setState("ready")}
        referrerPolicy="no-referrer"
        src={selected.url}
        width={selected.width ?? 300}
      />}
      {presentedIsHosted && state === "loading" ? <span className={styles.hostedLoading} aria-hidden="true" /> : null}
      {actionHref ? <GovernedCommercialAction
        action={{ href: actionHref, label: ariaLabel }}
        ariaLabel={ariaLabel}
        className={styles.partnerActionOverlay}
        context={{ source: "CREATIVE", placement }}
        messages={messages.outbound}
        offerMediaVariant={variant}
      ><span aria-hidden="true" /></GovernedCommercialAction> : null}
    </div>
    <figcaption>
      <span>B4GAMBLE / {messages.common.controlledMedia.toUpperCase()}</span>
      <small>{unavailable ? messages.common.mediaUnavailableTitle.toUpperCase() : presentationFamily.replaceAll("_", " ")}</small>
    </figcaption>
  </figure>;
}
