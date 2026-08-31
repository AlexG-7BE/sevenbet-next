"use client";

import { useEffect } from "react";

import { parseProgrammeRoute } from "@/lib/programme/presentation";

function targetsSameWindow(anchor: HTMLAnchorElement) {
  return !anchor.target || anchor.target === "_self";
}

/**
 * Permissions-Policy is attached to the top-level document, not to a Next.js
 * client route. Crossing between ordinary public pages (microphone=()) and the
 * Programme (microphone=(self)) must therefore load a fresh document so the
 * browser applies the destination response policy.
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

      // Capture-phase prevention stops next/link from converting this security
      // boundary crossing into an SPA transition. Native modified/new-tab clicks
      // are intentionally left alone because they create their own document.
      event.preventDefault();
      window.location.assign(destination.href);
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
