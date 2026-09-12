"use client";

import { useEffect } from "react";

import { browserAnalyticsConsentState } from "@/lib/analytics/consent-contract";
import { productAnalyticsClient } from "@/lib/analytics/product-analytics-client";
import type { ProductAnalyticsEventMap } from "@/lib/analytics/product-analytics-events";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function CommercialSurfaceView({ casinoId, surface }: { casinoId?: string; surface: ProductAnalyticsEventMap["commercial_surface_viewed"]["surface"] }) {
  useEffect(() => {
    const emitted = new WeakMap<Element, string>();
    const visible = new Set<Element>();
    const observed = new WeakMap<Element, string>();
    const selector = "[data-analytics-offer-key][data-analytics-casino-id], [data-analytics-card-key][data-analytics-casino-id]";

    const recordCasino = () => {
      if (surface === "casino_review" && browserAnalyticsConsentState() === "granted") productAnalyticsClient.casinoViewed(casinoId);
    };
    const recordElement = (element: Element) => {
      if (browserAnalyticsConsentState() !== "granted") return;
      const data = (element as HTMLElement).dataset;
      const offerKey = data.analyticsOfferKey;
      const cardKey = data.analyticsCardKey;
      const key = cardKey ?? offerKey;
      const elementCasinoId = data.analyticsCasinoId;
      if (!key || !elementCasinoId || !uuid.test(elementCasinoId) || emitted.get(element) === key) return;
      emitted.set(element, key);
      if (cardKey) {
        const position = Number.parseInt(data.analyticsPosition ?? "", 10);
        const placement = data.analyticsPlacement;
        if (placement && Number.isInteger(position) && position > 0) productAnalyticsClient.commercialCardViewed(elementCasinoId, placement, position, cardKey);
      }
      if (offerKey) productAnalyticsClient.offerViewed(undefined, elementCasinoId, offerKey);
      observer?.unobserve(element);
      visible.delete(element);
    };
    const recordVisible = () => visible.forEach(recordElement);
    const onConsentGranted = () => {
      recordCasino();
      recordVisible();
    };
    const observer = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          visible.add(entry.target);
          recordElement(entry.target);
        } else visible.delete(entry.target);
      }
    }, { threshold: 0.1 });

    const observeTargets = () => {
      document.querySelectorAll(selector).forEach((element) => {
        const data = (element as HTMLElement).dataset;
        const key = data.analyticsCardKey ?? data.analyticsOfferKey;
        if (!key || observed.get(element) === key) return;
        observed.set(element, key);
        if (observer) observer.observe(element);
        else recordElement(element);
      });
    };
    let scanQueued = false;
    const scheduleScan = () => {
      if (scanQueued) return;
      scanQueued = true;
      queueMicrotask(() => {
        scanQueued = false;
        observeTargets();
      });
    };
    const mutationObserver = new MutationObserver(scheduleScan);

    recordCasino();
    observeTargets();
    mutationObserver.observe(document.body, {
      attributeFilter: ["data-analytics-offer-key", "data-analytics-card-key", "data-analytics-casino-id", "data-analytics-position", "data-analytics-placement"],
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
