"use client";

import { useEffect } from "react";

import { browserAnalyticsConsentState } from "@/lib/analytics/consent-contract";
import { productAnalyticsClient } from "@/lib/analytics/product-analytics-client";
import type { ProductAnalyticsEventMap } from "@/lib/analytics/product-analytics-events";

export function CommercialSurfaceView({ casinoId, surface }: { casinoId?: string; surface: ProductAnalyticsEventMap["commercial_surface_viewed"]["surface"] }) {
  useEffect(() => {
    const emittedOfferKeys = new WeakMap<Element, string>();
    const visibleOffers = new Set<Element>();
    const observedOfferKeys = new WeakMap<Element, string>();
    const offerSelector = "[data-analytics-offer-key][data-analytics-casino-id]";

    const recordCasino = () => {
      if (surface === "casino_review" && browserAnalyticsConsentState() === "granted") {
        productAnalyticsClient.casinoViewed(casinoId);
      }
    };
    const recordOffer = (element: Element) => {
      if (browserAnalyticsConsentState() !== "granted") return;
      const offerKey = (element as HTMLElement).dataset.analyticsOfferKey;
      const offerCasinoId = (element as HTMLElement).dataset.analyticsCasinoId;
      if (!offerKey || !offerCasinoId || emittedOfferKeys.get(element) === offerKey) return;
      emittedOfferKeys.set(element, offerKey);
      productAnalyticsClient.offerViewed(undefined, offerCasinoId, offerKey);
      observer?.unobserve(element);
      visibleOffers.delete(element);
    };
    const recordVisibleOffers = () => visibleOffers.forEach(recordOffer);
    const onConsentGranted = () => {
      recordCasino();
      recordVisibleOffers();
    };

    const observer = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          visibleOffers.add(entry.target);
          recordOffer(entry.target);
        } else {
          visibleOffers.delete(entry.target);
        }
      }
    }, { threshold: 0 });

    const observeOfferTargets = () => {
      document.querySelectorAll(offerSelector).forEach((element) => {
        const key = (element as HTMLElement).dataset.analyticsOfferKey;
        if (!key || observedOfferKeys.get(element) === key) return;
        observedOfferKeys.set(element, key);
        if (observer) observer.observe(element);
        else recordOffer(element);
      });
    };

    let scanQueued = false;
    const scheduleOfferScan = () => {
      if (scanQueued) return;
      scanQueued = true;
      queueMicrotask(() => {
        scanQueued = false;
        observeOfferTargets();
      });
    };
    const mutationObserver = new MutationObserver(scheduleOfferScan);

    recordCasino();
    observeOfferTargets();
    mutationObserver.observe(document.body, {
      attributeFilter: ["data-analytics-offer-key", "data-analytics-casino-id"],
      attributes: true,
      childList: true,
      subtree: true,
    });
    window.addEventListener("b4g:analytics-consent-granted", onConsentGranted);

    return () => {
      observer?.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener("b4g:analytics-consent-granted", onConsentGranted);
    };
  }, [casinoId, surface]);
  return null;
}
