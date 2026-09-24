"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const MOBILE = "(max-width: 760px)";
// Ignore scroll jitter and iOS momentum wobble; commit to a direction only after this many pixels.
const DIRECTION_THRESHOLD = 12;

/**
 * On long mobile decision pages the fixed header gives its height back to the
 * list while the reader scrolls down, and returns on the first scroll up. Pages
 * opt in with `data-header-autohide`; everywhere else, and on wider screens,
 * the header stays put. It never hides while its menu is open or holds focus.
 */
export function PublicHeaderAutoHide() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    const header = document.querySelector<HTMLElement>("[data-public-shell='header']");
    if (!header) return;
    const mobile = window.matchMedia(MOBILE);
    let lastY = window.scrollY;
    let frame = 0;

    const setHidden = (hidden: boolean) => {
      if (hidden) root.dataset.headerHidden = "true";
      else delete root.dataset.headerHidden;
    };

    const sync = () => {
      frame = 0;
      const y = window.scrollY;
      const enabled = mobile.matches && document.querySelector("[data-header-autohide]") !== null;
      const engaged = header.querySelector("details[open]") !== null || header.contains(document.activeElement);
      if (!enabled || engaged || y <= header.offsetHeight) {
        setHidden(false);
        lastY = y;
        return;
      }
      if (y - lastY > DIRECTION_THRESHOLD) {
        setHidden(true);
        lastY = y;
      } else if (lastY - y > DIRECTION_THRESHOLD) {
        setHidden(false);
        lastY = y;
      }
    };
    const queue = () => {
      if (!frame) frame = window.requestAnimationFrame(sync);
    };

    sync();
    window.addEventListener("scroll", queue, { passive: true });
    mobile.addEventListener("change", queue);
    header.addEventListener("focusin", queue);
    header.addEventListener("toggle", queue, true);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", queue);
      mobile.removeEventListener("change", queue);
      header.removeEventListener("focusin", queue);
      header.removeEventListener("toggle", queue, true);
      setHidden(false);
    };
  }, [pathname]);

  return null;
}
