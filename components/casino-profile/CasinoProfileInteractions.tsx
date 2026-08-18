"use client";

import { useEffect } from "react";

const SECTION_IDS = ["overview", "offer-evidence", "editorial-review", "verdict", "faq"];

export function CasinoProfileInteractions() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-runtime-renderer='casino-review']");
    const progress = root?.querySelector<HTMLElement>("[data-casino-read-progress]");
    const decisionBar = root?.querySelector<HTMLElement>("[data-casino-decision-bar]");
    if (!root || !progress || !decisionBar) return;

    const sections = SECTION_IDS.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const links = Array.from(decisionBar.querySelectorAll<HTMLAnchorElement>("a[href^='#']"));
    let activeId = sections[0]?.id ?? "overview";
    let frame = 0;

    const setActive = (id: string) => {
      activeId = id;
      links.forEach((link) => {
        if (link.hash === `#${id}`) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    };

    const sync = () => {
      frame = 0;
      const rootRect = root.getBoundingClientRect();
      const maximum = Math.max(1, root.scrollHeight - window.innerHeight);
      const travelled = Math.min(maximum, Math.max(0, -rootRect.top));
      progress.style.width = `${Math.min(100, travelled / maximum * 100)}%`;
      const headerHeight = document.querySelector<HTMLElement>("[data-public-shell='header']")?.getBoundingClientRect().height ?? 81;
      decisionBar.dataset.stuck = decisionBar.getBoundingClientRect().top <= headerHeight + 2 ? "true" : "false";
      const probe = headerHeight + decisionBar.getBoundingClientRect().height + 26;
      let current: HTMLElement | undefined;
      for (let index = sections.length - 1; index >= 0; index -= 1) {
        if (sections[index].getBoundingClientRect().top <= probe) {
          current = sections[index];
          break;
        }
      }
      if (current && current.id !== activeId) setActive(current.id);
    };

    const queue = () => {
      if (!frame) frame = window.requestAnimationFrame(sync);
    };

    setActive(activeId);
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
