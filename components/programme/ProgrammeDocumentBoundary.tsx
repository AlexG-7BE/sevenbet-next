"use client";

import { useEffect } from "react";

import { programmeCrossingNeedsDocument } from "@/lib/programme/presentation";

function targetsSameWindow(anchor: HTMLAnchorElement) {
  return !anchor.target || anchor.target === "_self";
}

/**
 * Entering the Programme from a public page is a client transition; the links that still need a
 * fresh document get one here (`programmeCrossingNeedsDocument`): every link out of the
 * Programme, and a link into it in another language than the page's.
 *
 * The rule dates from the Programme's own Permissions-Policy (a microphone grant, removed with
 * voice input on 11 October 2026). Every document now sends the same deny-all policy, so the
 * policy no longer needs the load; the page language does.
 */
export function ProgrammeDocumentBoundary() {
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
      if (!programmeCrossingNeedsDocument(window.location.pathname, destination.pathname, document.documentElement.lang)) return;

      // Capture-phase prevention stops next/link from converting this crossing into an SPA
      // transition. Native modified/new-tab clicks are intentionally left alone because they
      // create their own document.
      event.preventDefault();
      window.location.assign(destination.href);
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
