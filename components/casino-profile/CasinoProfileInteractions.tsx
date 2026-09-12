"use client";

import { useEffect } from "react";

export function shouldShowCasinoDecisionBar({
  barHeight,
  footerTop,
  headerHeight,
  heroBottom,
  mobile,
  viewportHeight,
}: {
  barHeight: number;
  footerTop: number | null;
  headerHeight: number;
  heroBottom: number;
  mobile: boolean;
  viewportHeight: number;
}) {
  const heroHasPassed = heroBottom <= headerHeight + 4;
  const footerIsNear = footerTop !== null && footerTop <= viewportHeight + barHeight;
  return mobile && heroHasPassed && !footerIsNear;
}

export function CasinoProfileInteractions() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-runtime-renderer='casino-review']");
    const sticky = root?.querySelector<HTMLElement>("[data-casino-decision-bar]");
    const hero = root?.querySelector<HTMLElement>("[aria-labelledby='casino-profile-title']");
    const footer = document.querySelector<HTMLElement>("[data-public-shell='footer']");
    if (!sticky || !hero) return;
    let frame = 0;
    const sync = () => {
      frame = 0;
      const mobile = window.matchMedia("(max-width: 600px)").matches;
      const headerHeight = document.querySelector<HTMLElement>("[data-public-shell='header']")?.getBoundingClientRect().height ?? 0;
      sticky.dataset.mobileVisible = String(shouldShowCasinoDecisionBar({
        barHeight: sticky.getBoundingClientRect().height,
        footerTop: footer?.getBoundingClientRect().top ?? null,
        headerHeight,
        heroBottom: hero.getBoundingClientRect().bottom,
        mobile,
        viewportHeight: window.innerHeight,
      }));
    };
    const queue = () => {
      if (!frame) frame = window.requestAnimationFrame(sync);
    };
    sync();
    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue, { passive: true });
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", queue);
      window.removeEventListener("resize", queue);
    };
  }, []);
  return null;
}
