"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const NAV_THEMES = new Set(["dark", "light", "cream", "photo"]);

function sectionTheme(section: HTMLElement | null) {
  const theme = section?.dataset.navTheme;
  return theme && NAV_THEMES.has(theme) ? theme : null;
}

export function PublicHeaderThemeController() {
  const pathname = usePathname();

  useEffect(() => {
    const header = document.querySelector<HTMLElement>("[data-public-shell='header']");
    if (!header) return;

    let frame = 0;
    let themedSections: HTMLElement[] = [];
    let resizeObserver: ResizeObserver | null = null;

    const collectSections = () => {
      themedSections = Array.from(document.querySelectorAll<HTMLElement>("[data-nav-theme]"))
        .filter((section) => sectionTheme(section));
      resizeObserver?.disconnect();
      resizeObserver?.observe(document.documentElement);
      themedSections.forEach((section) => resizeObserver?.observe(section));
    };

    const sync = () => {
      frame = 0;
      const headerRect = header.getBoundingClientRect();
      const probeY = Math.min(window.innerHeight - 1, Math.max(0, Math.round(headerRect.bottom + 1)));
      const probeX = Math.round(window.innerWidth / 2);
      const physicalSection = document.elementsFromPoint(probeX, probeY)
        .map((element) => element.closest<HTMLElement>("[data-nav-theme]"))
        .find((section) => sectionTheme(section)) ?? null;
      const geometricSection = themedSections.find((section) => {
        const rect = section.getBoundingClientRect();
        return rect.top <= probeY && rect.bottom > probeY;
      }) ?? themedSections.find((section) => section.getBoundingClientRect().bottom > probeY) ?? null;
      const theme = sectionTheme(physicalSection) || sectionTheme(geometricSection) || "dark";
      if (header.dataset.shellTheme !== theme) header.dataset.shellTheme = theme;
      header.dataset.themeController = "ready";
    };

    const queue = () => {
      if (!frame) frame = window.requestAnimationFrame(sync);
    };

    if (typeof window.ResizeObserver === "function") resizeObserver = new window.ResizeObserver(queue);
    const mutationObserver = new MutationObserver(() => {
      collectSections();
      queue();
    });
    mutationObserver.observe(document.body, { attributeFilter: ["data-nav-theme"], attributes: true, childList: true, subtree: true });
    collectSections();
    sync();
    document.fonts?.ready.then(queue).catch(() => undefined);
    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue, { passive: true });
    window.addEventListener("load", queue, { once: true });

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      mutationObserver.disconnect();
      resizeObserver?.disconnect();
      window.removeEventListener("scroll", queue);
      window.removeEventListener("resize", queue);
      window.removeEventListener("load", queue);
      delete header.dataset.themeController;
    };
  }, [pathname]);

  return null;
}
