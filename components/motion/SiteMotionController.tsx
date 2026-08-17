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

    try {
      observer = new window.IntersectionObserver((entries) => {
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

    const enroll = (root: ParentNode) => {
      const candidates = root instanceof HTMLElement && root.matches(REVEAL_SELECTOR)
        ? [root, ...root.querySelectorAll<HTMLElement>(REVEAL_SELECTOR)]
        : Array.from(root.querySelectorAll<HTMLElement>(REVEAL_SELECTOR));
      candidates.forEach((element) => {
        if (enrolled.has(element)) return;
        enrolled.add(element);
        const rect = element.getBoundingClientRect();
        const belowFirstViewport = rect.top > window.innerHeight * .92;
        element.dataset.motionState = belowFirstViewport ? "pending" : "visible";
        if (belowFirstViewport) observer?.observe(element);
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
    const safetyTimer = window.setTimeout(() => enrolled.forEach(reveal), 4_000);

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
