"use client";

import { useEffect, useRef, type RefObject } from "react";

/**
 * A reader who changes search, filter or sort from deep inside a long list must
 * see the new results from their start, not the middle of the old ordering.
 *
 * When `key` changes and the results' start is hidden above the sticky controls,
 * scroll it back to just under them. The target is computed from where the
 * controls rest while stuck — under the header, which returns on any upward
 * scroll — not from their current box: a shorter list can pull the page to its
 * end and carry the controls off screen with their container. Readers above the
 * list, and layouts whose controls are not sticky, are left alone.
 */
export function useRevealResults(controls: RefObject<HTMLElement | null>, start: RefObject<HTMLElement | null>, key: string) {
  const previous = useRef(key);
  useEffect(() => {
    if (previous.current === key) return;
    previous.current = key;
    const frame = window.requestAnimationFrame(() => {
      const bar = controls.current;
      const anchor = start.current;
      if (!bar || !anchor || getComputedStyle(bar).position !== "sticky") return;
      const header = document.querySelector<HTMLElement>("[data-public-shell='header']");
      const reserve = (header?.offsetHeight ?? 0) + bar.offsetHeight + 12;
      const top = anchor.getBoundingClientRect().top;
      if (top >= reserve - 1) return;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: Math.max(0, window.scrollY + top - reserve), behavior: reduceMotion ? "auto" : "smooth" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [controls, key, start]);
}
