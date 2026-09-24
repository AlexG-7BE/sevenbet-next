"use client";

import { useEffect } from "react";

export function shouldShowTenStepsStart({
  barHeight,
  finalTop,
  footerTop,
  headerHeight,
  heroActionBottom,
  mobile,
  viewportHeight,
}: {
  barHeight: number;
  finalTop: number | null;
  footerTop: number | null;
  headerHeight: number;
  heroActionBottom: number;
  mobile: boolean;
  viewportHeight: number;
}) {
  const heroActionHasPassed = heroActionBottom <= headerHeight + 4;
  const finalActionIsNear = finalTop !== null && finalTop <= viewportHeight - barHeight;
  const footerIsNear = footerTop !== null && footerTop <= viewportHeight + barHeight;
  return mobile && heroActionHasPassed && !finalActionIsNear && !footerIsNear;
}

/** Shows the phone-only "Start Mission 01" bar once the hero action has scrolled away. */
export function TenStepsStickyStart() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-runtime-renderer='ten-steps']");
    const bar = root?.querySelector<HTMLElement>("[data-ten-steps-sticky-start]");
    const heroAction = root?.querySelector<HTMLElement>("[data-ten-steps-hero-action]");
    if (!bar || !heroAction) return;
    const final = root?.querySelector<HTMLElement>("[data-ten-steps-section='final-action']");
    const footer = document.querySelector<HTMLElement>("[data-public-shell='footer']");
    let frame = 0;
    const sync = () => {
      frame = 0;
      bar.dataset.mobileVisible = String(shouldShowTenStepsStart({
        barHeight: bar.getBoundingClientRect().height,
        finalTop: final?.getBoundingClientRect().top ?? null,
        footerTop: footer?.getBoundingClientRect().top ?? null,
        headerHeight: document.querySelector<HTMLElement>("[data-public-shell='header']")?.getBoundingClientRect().height ?? 0,
        heroActionBottom: heroAction.getBoundingClientRect().bottom,
        mobile: window.matchMedia("(max-width: 900px)").matches,
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
