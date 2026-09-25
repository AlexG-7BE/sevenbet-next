"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";

import { productAnalyticsClient } from "@/lib/analytics/product-analytics-client";
import type { PresentationResolution } from "@/lib/market/presentation-resolver";
import { localizePublicHref, stripPublicMarketPrefix } from "@/lib/market/routing";
import { DEFAULT_MARKET_PROFILE, marketProfileByLocale } from "@/lib/market/registry";
import { createCommercialNavigationRetryRegistry } from "@/lib/market/navigation-stage2-retry";
import type { ProgrammeLocale } from "@/lib/programme/presentation";
import { isCurrentPublicRoute } from "@/lib/public-shell";
import { PublicLinkPendingSignal } from "./PublicNavigationFeedback";

type ProgrammePresentation = Readonly<{
  locale: ProgrammeLocale;
  localizePublicLinks: boolean;
}>;

const commercialNavigationRefreshes = createCommercialNavigationRetryRegistry();

/**
 * A closed <details> still lays out its content (content-visibility: hidden), so it has client
 * rects but cannot take focus. Only its own summary counts for the drawer's focus loop.
 */
function insideClosedDetails(element: HTMLElement) {
  const closed = element.closest("details:not([open])");
  return Boolean(closed) && !(element.tagName === "SUMMARY" && element.parentElement === closed);
}

export function PublicCommercialNavigationSettled() {
  const pathname = usePathname();

  useEffect(() => {
    commercialNavigationRefreshes.clear(pathname);
  }, [pathname]);

  return <span data-commercial-navigation-settled hidden />;
}

export function PublicCommercialNavigationRetry() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!commercialNavigationRefreshes.claim(pathname)) return;
    const timer = window.setTimeout(() => router.refresh(), 750);
    return () => {
      window.clearTimeout(timer);
      window.setTimeout(() => {
        if (window.location.pathname !== pathname) commercialNavigationRefreshes.clear(pathname);
      }, 0);
    };
  }, [pathname, router]);

  return <span data-commercial-navigation-timed-out hidden />;
}

export function PublicNavigationRouteLink({
  baseHref,
  children,
  className,
  label,
  presentation,
  programme,
}: {
  baseHref: string;
  children: ReactNode;
  className?: string;
  label: string;
  presentation: PresentationResolution;
  programme?: ProgrammePresentation;
}) {
  const pathname = usePathname();
  const editorialProfile = marketProfileByLocale(presentation.locale) ?? DEFAULT_MARKET_PROFILE;
  const href = programme && !programme.localizePublicLinks
    ? baseHref
    : localizePublicHref(baseHref, pathname, editorialProfile, presentation.locale);
  return (
    <Link
      aria-current={isCurrentPublicRoute(stripPublicMarketPrefix(pathname), baseHref) ? "page" : undefined}
      className={className}
      data-navigation-href={baseHref}
      href={href}
      prefetch={false}
    >
      {children}
      <PublicLinkPendingSignal label={label} />
    </Link>
  );
}

export function PublicProgrammeActionLink({
  authenticated,
  children,
  className,
  href,
}: {
  authenticated: boolean;
  children: ReactNode;
  className: string;
  href: string;
}) {
  const isProgrammeHref = href === "/program" || /^\/[a-z]{2}\/program(?:[/?#]|$)/.test(href);
  return (
    <Link className={className} href={href} onClick={() => {
      if (!authenticated && isProgrammeHref) productAnalyticsClient.startClicked("public_header");
    }}>
      {children}
    </Link>
  );
}

export function PublicMobileNavigationEnhancement() {
  const markerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const marker = markerRef.current;
    const disclosure = marker?.closest("details");
    const trigger = disclosure?.querySelector<HTMLElement>(":scope > summary");
    if (!(disclosure instanceof HTMLDetailsElement) || !trigger) return;
    disclosure.dataset.navigationEnhanced = "true";
    const inertState = new Map<HTMLElement, boolean>();

    const restoreOutsideContent = () => {
      for (const [element, wasInert] of inertState) element.inert = wasInert;
      inertState.clear();
    };
    const containPageToDisclosure = () => {
      restoreOutsideContent();
      let branch: HTMLElement = disclosure;
      let parent = branch.parentElement;
      while (parent) {
        for (const sibling of parent.children) {
          if (!(sibling instanceof HTMLElement) || sibling === branch) continue;
          inertState.set(sibling, sibling.inert);
          sibling.inert = true;
        }
        branch = parent;
        parent = parent.parentElement;
      }
    };
    const syncOpenState = () => {
      trigger.setAttribute("aria-expanded", String(disclosure.open));
      if (disclosure.open) {
        disclosure.setAttribute("role", "dialog");
        disclosure.setAttribute("aria-modal", "true");
        containPageToDisclosure();
      } else {
        disclosure.removeAttribute("role");
        disclosure.removeAttribute("aria-modal");
        restoreOutsideContent();
      }
    };
    const focusableElements = () => Array.from(disclosure.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])',
    )).filter((element) => element.getClientRects().length > 0 && !element.closest("[inert]") && !insideClosedDetails(element));

    const closeMenu = ({ restoreFocus = true } = {}) => {
      if (disclosure.open) disclosure.open = false;
      if (restoreFocus) requestAnimationFrame(() => trigger.focus());
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && disclosure.open) {
        event.preventDefault();
        event.stopPropagation();
        closeMenu();
        return;
      }
      if (event.key !== "Tab" || !disclosure.open) return;
      const focusable = focusableElements();
      if (focusable.length === 0) {
        event.preventDefault();
        trigger.focus();
        return;
      }
      const activeIndex = focusable.indexOf(document.activeElement as HTMLElement);
      const movingBeforeStart = event.shiftKey && activeIndex <= 0;
      const movingPastEnd = !event.shiftKey && activeIndex === focusable.length - 1;
      if (activeIndex === -1 || movingBeforeStart || movingPastEnd) {
        event.preventDefault();
        (event.shiftKey ? focusable.at(-1) : focusable[0])?.focus();
      }
    };
    const closeAfterNavigation = (event: MouseEvent) => {
      const target = event.target;
      const anchor = target instanceof Element ? target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!anchor || !disclosure.contains(anchor)) return;
      if (
        event.button !== 0
        || event.metaKey
        || event.ctrlKey
        || event.shiftKey
        || event.altKey
        || anchor.target === "_blank"
      ) return;
      closeMenu({ restoreFocus: false });
    };
    const desktop = window.matchMedia("(min-width: 901px)");
    const closeAfterDesktopResize = (event: MediaQueryListEvent) => {
      if (event.matches) closeMenu({ restoreFocus: false });
    };

    syncOpenState();
    disclosure.addEventListener("toggle", syncOpenState);
    document.addEventListener("keydown", onKeyDown);
    disclosure.addEventListener("click", closeAfterNavigation);
    desktop.addEventListener("change", closeAfterDesktopResize);
    return () => {
      delete disclosure.dataset.navigationEnhanced;
      disclosure.removeEventListener("toggle", syncOpenState);
      document.removeEventListener("keydown", onKeyDown);
      disclosure.removeEventListener("click", closeAfterNavigation);
      desktop.removeEventListener("change", closeAfterDesktopResize);
      disclosure.removeAttribute("role");
      disclosure.removeAttribute("aria-modal");
      restoreOutsideContent();
    };
  }, []);

  return <span data-public-mobile-navigation-enhancement hidden ref={markerRef} />;
}
