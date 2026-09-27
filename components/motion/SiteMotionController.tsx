"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const REVEAL_SELECTOR = "[data-motion-reveal]";

export function SiteMotionController() {
  const pathname = usePathname();

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const enrolled = new Set<HTMLElement>();
    let observer: IntersectionObserver | null = null;

    const reveal = (element: HTMLElement) => {
      element.dataset.motionState = "visible";
      observer?.unobserve(element);
    };

    const revealAll = () => {
      document.querySelectorAll<HTMLElement>(REVEAL_SELECTOR).forEach(reveal);
      document.documentElement.dataset.siteMotion = "fallback";
    };

    if (reducedMotion || typeof window.IntersectionObserver !== "function") {
      revealAll();
      return () => {
        document.querySelectorAll<HTMLElement>(REVEAL_SELECTOR).forEach((element) => delete element.dataset.motionState);
        delete document.documentElement.dataset.siteMotion;
      };
    }

    // An observer reports every target it starts watching, so its first callback proves it works.
    // The four-second fuse only covers an observer that never reports: revealing everything on a
    // timer would drop the rise for anyone who reads the first screen for longer than that.
    let observerReported = false;
    let observerBroken = false;
    let safetyTimer = 0;

    try {
      observer = new window.IntersectionObserver((entries) => {
        observerReported = true;
        entries.forEach((entry) => {
          if (entry.isIntersecting) reveal(entry.target as HTMLElement);
        });
      }, { rootMargin: "0px 0px -8%", threshold: [0, .12] });
    } catch {
      revealAll();
      return () => {
        document.querySelectorAll<HTMLElement>(REVEAL_SELECTOR).forEach((element) => delete element.dataset.motionState);
        delete document.documentElement.dataset.siteMotion;
      };
    }

    const watch = (element: HTMLElement) => {
      observer?.observe(element);
      if (observerReported || safetyTimer) return;
      safetyTimer = window.setTimeout(() => {
        if (observerReported) return;
        observerBroken = true;
        enrolled.forEach(reveal);
      }, 4_000);
    };

    const enroll = (root: ParentNode) => {
      const candidates = root instanceof HTMLElement && root.matches(REVEAL_SELECTOR)
        ? [root, ...root.querySelectorAll<HTMLElement>(REVEAL_SELECTOR)]
        : Array.from(root.querySelectorAll<HTMLElement>(REVEAL_SELECTOR));
      candidates.forEach((element) => {
        if (enrolled.has(element)) return;
        // Streamed Suspense content first lands in a hidden container and is then moved into
        // place; judge it when that move re-inserts it, not while it has no box.
        if (!element.getClientRects().length) return;
        enrolled.add(element);
        const rect = element.getBoundingClientRect();
        const belowFirstViewport = !observerBroken && rect.top > window.innerHeight * .92;
        element.dataset.motionState = belowFirstViewport ? "pending" : "visible";
        if (belowFirstViewport) watch(element);
      });
    };

    enroll(document);
    document.documentElement.dataset.siteMotion = "ready";
    const mutationObserver = new MutationObserver((records) => {
      records.forEach((record) => record.addedNodes.forEach((node) => {
        if (node instanceof HTMLElement) enroll(node);
      }));
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.clearTimeout(safetyTimer);
      mutationObserver.disconnect();
      observer?.disconnect();
      enrolled.forEach((element) => delete element.dataset.motionState);
      delete document.documentElement.dataset.siteMotion;
    };
  }, [pathname]);

  return null;
}
