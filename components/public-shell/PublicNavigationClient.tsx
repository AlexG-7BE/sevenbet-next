"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";

import { productAnalyticsClient } from "@/lib/analytics/product-analytics-client";
import { signedInUser, subscribeSignedInUser } from "@/lib/auth/signed-in-signal";
import type { PresentationResolution } from "@/lib/market/presentation-resolver";
import { finalPublicHref, localizePublicHref, stripPublicMarketPrefix } from "@/lib/market/routing";
import { DEFAULT_MARKET_PROFILE, marketProfileByLocale } from "@/lib/market/registry";
import { createCommercialNavigationRetryRegistry } from "@/lib/market/navigation-stage2-retry";
import type { ProgrammeLocale } from "@/lib/programme/presentation";
import { isCurrentPublicRoute, leadsToCurrentProgrammePage } from "@/lib/public-shell";
import {
  RESEARCH_ACCESS_CHANGED_EVENT,
  RESEARCH_OPENED_AT_STORAGE_KEY,
  researchAccessOpen,
  researchLinksAreNew,
  researchNavigationShown,
} from "@/lib/research-access";
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

// A cookie raises no event of its own. The Programme announces the one moment it changes without
// a page change: the lesson's completion, on the page the person is looking at.
function subscribeToResearchAccess(onChange: () => void) {
  window.addEventListener(RESEARCH_ACCESS_CHANGED_EVENT, onChange);
  return () => window.removeEventListener(RESEARCH_ACCESS_CHANGED_EVENT, onChange);
}

/**
 * Shows research links to a reader inside the research section or with the lesson flag, and the
 * guide links to everyone else. The layout that renders the menu is not rendered again when the
 * page changes, so the choice is made here, from the current path and the cookie as it is now;
 * `researchAccess` is what the server read from the same cookie, for the first paint.
 */
export function PublicNavigationDoor({
  children,
  door,
  researchAccess,
}: {
  children: ReactNode;
  door: "research" | "guide";
  researchAccess: boolean;
}) {
  const pathname = usePathname();
  const access = useSyncExternalStore(
    subscribeToResearchAccess,
    () => researchAccessOpen(document.cookie),
    () => researchAccess,
  );
  const research = researchNavigationShown(stripPublicMarketPrefix(pathname), access);
  return research === (door === "research") ? <>{children}</> : null;
}

/**
 * For a week after the lesson, the research links in the header and the drawer carry a small
 * mark (Founder, 10 October 2026). The date lives in this browser's storage; nothing is fetched.
 */
export function PublicResearchNewMark() {
  const pathname = usePathname();
  const markerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const header = markerRef.current?.closest<HTMLElement>("[data-public-shell='header']");
    if (!header) return;
    const sync = () => {
      let openedAt: string | null = null;
      try {
        openedAt = window.localStorage.getItem(RESEARCH_OPENED_AT_STORAGE_KEY);
      } catch {
        // Storage can be blocked; the menu simply carries no mark.
      }
      if (researchAccessOpen(document.cookie) && researchLinksAreNew(openedAt, Date.now())) header.dataset.researchNew = "";
      else delete header.dataset.researchNew;
    };
    sync();
    window.addEventListener(RESEARCH_ACCESS_CHANGED_EVENT, sync);
    return () => window.removeEventListener(RESEARCH_ACCESS_CHANGED_EVENT, sync);
  }, [pathname]);

  return <span data-public-research-new-mark hidden ref={markerRef} />;
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
  // A link the page cannot localize goes straight to where the neutral redirect would send this visitor.
  const href = finalPublicHref(programme && !programme.localizePublicLinks
    ? baseHref
    : localizePublicHref(baseHref, pathname, editorialProfile, presentation.locale), presentation.neutralRouteLocale);
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
  hiddenOnDestination = false,
  href,
}: {
  authenticated: boolean;
  children: ReactNode;
  className: string;
  /** Leave the button out on the page it leads to (the header's "Start Programme" on the Programme's own first screens). */
  hiddenOnDestination?: boolean;
  href: string;
}) {
  const pathname = usePathname();
  const isProgrammeHref = href === "/program" || /^\/[a-z]{2}\/program(?:[/?#]|$)/.test(href);
  if (hiddenOnDestination && leadsToCurrentProgrammePage(pathname, href)) return null;
  // The public shell loads this destination ahead of the tap (navigation-prefetch.ts), so the
  // link itself does not prefetch.
  return (
    <Link className={className} data-programme-entry={isProgrammeHref ? "" : undefined} href={href} prefetch={false} onClick={() => {
      if (!authenticated && isProgrammeHref) productAnalyticsClient.startClicked("public_header");
    }}>
      {children}
    </Link>
  );
}

/**
 * The drawer's second account line: Log in for a visitor, Log out for a signed-in person
 * (Founder, 12 October 2026: on a phone there was no way to log out). `authenticated` is the
 * session cookie the document was rendered with; a person the Programme has signed in since then
 * counts as well (lib/auth/signed-in-signal.ts). The sign-out code loads when the line is pressed.
 */
export function PublicMobileAccountLine({
  authenticated,
  className,
  labels,
  login,
  programmeHref,
}: {
  authenticated: boolean;
  className: string;
  labels: Readonly<{ logOut: string; loggingOut: string; logOutRetry: string }>;
  login: ReactNode;
  programmeHref: string;
}) {
  const knownUserId = useSyncExternalStore(subscribeSignedInUser, signedInUser, () => null);
  const [state, setState] = useState<"idle" | "busy" | "failed">("idle");
  if (!authenticated && !knownUserId) return <>{login}</>;
  async function logOut() {
    setState("busy");
    try {
      const { signOutOfB4gamble } = await import("@/lib/auth/sign-out-client");
      await signOutOfB4gamble(knownUserId);
      // The Programme reopens at its start, without a sign-in return left in the address.
      if (window.location.pathname === programmeHref) window.location.assign(programmeHref);
      else window.location.reload();
    } catch {
      setState("failed");
    }
  }
  return (
    <button className={className} data-public-log-out="" disabled={state === "busy"} onClick={logOut} type="button">
      {state === "busy" ? labels.loggingOut : state === "failed" ? labels.logOutRetry : labels.logOut}
    </button>
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
