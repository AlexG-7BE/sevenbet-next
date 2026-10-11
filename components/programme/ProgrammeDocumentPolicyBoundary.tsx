"use client";

import { useEffect } from "react";

import { parseProgrammeRoute } from "@/lib/programme/presentation";

function targetsSameWindow(anchor: HTMLAnchorElement) {
  return !anchor.target || anchor.target === "_self";
}

/**
 * Crossing between ordinary public pages and the Programme loads a fresh
 * document instead of a client transition. The rule dates from the Programme's
 * own Permissions-Policy (a microphone grant, removed with voice input on
 * 11 October 2026): a response policy binds to the top-level document, not to
 * a Next.js client route. Both sides now send the same deny-all policy; the
 * full load stays until a client transition across this boundary is verified.
 */
export function ProgrammeDocumentPolicyBoundary() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (
        event.button !== 0
        || event.metaKey
        || event.ctrlKey
        || event.shiftKey
        || event.altKey
      ) return;

      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest<HTMLAnchorElement>("a[href]");
      if (!anchor || !targetsSameWindow(anchor) || anchor.hasAttribute("download")) return;

      const rawHref = anchor.getAttribute("href");
      if (!rawHref || rawHref.startsWith("#")) return;

      let destination: URL;
      try {
        destination = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }

      if (destination.origin !== window.location.origin) return;

      const currentIsProgramme = parseProgrammeRoute(window.location.pathname) !== null;
      const destinationIsProgramme = parseProgrammeRoute(destination.pathname) !== null;
      if (currentIsProgramme === destinationIsProgramme) return;

      // Capture-phase prevention stops next/link from converting this boundary
      // crossing into an SPA transition. Native modified/new-tab clicks are
      // intentionally left alone because they create their own document.
      event.preventDefault();
      window.location.assign(destination.href);
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
