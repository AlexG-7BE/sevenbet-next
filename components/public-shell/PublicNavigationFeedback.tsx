"use client";

import { useLinkStatus } from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ReactNode } from "react";

import { currentPageSettled, INTENT_PREFETCH_SELECTOR, prefetchTarget, PRIMARY_PREFETCH_SELECTOR } from "./navigation-prefetch";
import { navigationClickTarget } from "./navigation-progress";

type PendingLink = Readonly<{ id: string; label: string }>;
type PendingLinkReporter = (pendingLink: PendingLink, pending: boolean) => void;
type ProgressState = "idle" | "running" | "finishing";

const PendingLinkContext = createContext<PendingLinkReporter | null>(null);

// The public layout's maxDuration: no server answer can still be coming after it.
const PROGRESS_GIVE_UP_MS = 30_000;

export function usePublicNavigationFeedback() {
  return useContext(PendingLinkContext);
}

function anchorFrom(target: EventTarget | null) {
  const anchor = target instanceof Element ? target.closest("a[href]") : null;
  return anchor instanceof HTMLAnchorElement ? anchor : null;
}

/**
 * A bar at the top of the screen starts on the click itself and holds until the next page is in
 * place: its address is showing and its loading frame has given way to the page. The named pill
 * still waits 700ms (Founder decision 25 Sep 2026); the bar names nothing, so it cannot flash.
 */
function useNavigationProgress() {
  const [progress, setProgress] = useState<ProgressState>("idle");

  useEffect(() => {
    let startedFrom: string | null = null;
    let poll = 0;
    let giveUp = 0;
    let fade = 0;
    const clearTimers = () => {
      window.clearInterval(poll);
      window.clearTimeout(giveUp);
      window.clearTimeout(fade);
    };
    const finish = () => {
      if (startedFrom === null) return;
      startedFrom = null;
      clearTimers();
      setProgress("finishing");
      fade = window.setTimeout(() => setProgress("idle"), 240);
    };
    const arrived = () => startedFrom !== null
      && `${window.location.pathname}${window.location.search}` !== startedFrom
      && !document.querySelector("[data-route-loading]");
    const onClick = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = anchorFrom(event.target);
      if (!anchor || anchor.hasAttribute("download") || (anchor.target && anchor.target !== "_self")) return;
      if (!navigationClickTarget(anchor.href, window.location.href)) return;
      clearTimers();
      startedFrom = `${window.location.pathname}${window.location.search}`;
      setProgress("running");
      poll = window.setInterval(() => { if (arrived()) finish(); }, 100);
      giveUp = window.setTimeout(finish, PROGRESS_GIVE_UP_MS);
    };
    // A page restored from the back-forward cache must not come back mid-transition.
    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      startedFrom = null;
      clearTimers();
      setProgress("idle");
    };
    // Capture: the bar starts before a Link or a handoff page takes the click over.
    window.addEventListener("click", onClick, true);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      clearTimers();
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);

  return progress;
}

// A pointer resting this long on a link is a choice, not a pass across it.
const HOVER_INTENT_MS = 50;
// How often a page that is still loading is checked before its primary destinations load.
const SETTLE_POLL_MS = 300;
// Next keeps a prefetched page for five minutes; on a longer stay the next intent fetches it again.
const PREFETCH_AGAIN_AFTER_MS = 240_000;

/**
 * Pages open in 0.1–0.3 s only when they are already in the browser (Founder decision, 4 Oct 2026).
 * Once the current page settles, the primary destinations load in the background; any other
 * eligible link loads on hover, touch or focus, and the mobile drawer loads its links as it opens.
 * Next keeps each fetched page for five minutes (staleTimes.static), and `/r/` still decides every
 * outbound click on the server.
 */
function useInstantNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const requested = new Map<string, number>();
    let settleTimer = 0;
    let idleHandle = 0;
    let hoverTimer = 0;
    let hovered: HTMLAnchorElement | null = null;
    const prefetch = (anchor: HTMLAnchorElement) => {
      if (!currentPageSettled(document)) return;
      const target = prefetchTarget(anchor.href, window.location.href);
      if (!target) return;
      const last = requested.get(target);
      if (last !== undefined && Date.now() - last < PREFETCH_AGAIN_AFTER_MS) return;
      requested.set(target, Date.now());
      router.prefetch(target);
    };
    const prefetchAll = (root: ParentNode, selector: string) => {
      for (const anchor of root.querySelectorAll<HTMLAnchorElement>(selector)) prefetch(anchor);
    };
    const whenSettled = () => {
      if (!currentPageSettled(document)) {
        settleTimer = window.setTimeout(whenSettled, SETTLE_POLL_MS);
        return;
      }
      const run = () => prefetchAll(document, PRIMARY_PREFETCH_SELECTOR);
      // Safari before 18 has no requestIdleCallback.
      if (typeof window.requestIdleCallback === "function") idleHandle = window.requestIdleCallback(run, { timeout: 1_000 });
      else settleTimer = window.setTimeout(run, 200);
    };
    const intentAnchor = (target: EventTarget | null) => {
      const anchor = target instanceof Element ? target.closest(INTENT_PREFETCH_SELECTOR) : null;
      return anchor instanceof HTMLAnchorElement ? anchor : null;
    };
    const onPointerOver = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const anchor = intentAnchor(event.target);
      if (!anchor || anchor === hovered) return;
      window.clearTimeout(hoverTimer);
      hovered = anchor;
      hoverTimer = window.setTimeout(() => prefetch(anchor), HOVER_INTENT_MS);
    };
    const onPointerOut = (event: PointerEvent) => {
      if (!hovered || (event.relatedTarget instanceof Node && hovered.contains(event.relatedTarget))) return;
      window.clearTimeout(hoverTimer);
      hovered = null;
    };
    const onTouchStart = (event: TouchEvent) => {
      const anchor = intentAnchor(event.target);
      if (anchor) prefetch(anchor);
    };
    const onFocusIn = (event: FocusEvent) => {
      const anchor = intentAnchor(event.target);
      if (anchor) prefetch(anchor);
    };
    // `toggle` does not bubble; capture still sees the drawer open.
    const onToggle = (event: Event) => {
      const disclosure = event.target;
      if (disclosure instanceof HTMLDetailsElement && disclosure.open && disclosure.matches("[data-public-mobile-disclosure]")) {
        prefetchAll(disclosure, PRIMARY_PREFETCH_SELECTOR);
      }
    };

    whenSettled();
    document.addEventListener("pointerover", onPointerOver, { passive: true });
    document.addEventListener("pointerout", onPointerOut, { passive: true });
    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("toggle", onToggle, true);
    return () => {
      window.clearTimeout(settleTimer);
      window.clearTimeout(hoverTimer);
      if (idleHandle) window.cancelIdleCallback(idleHandle);
      document.removeEventListener("pointerover", onPointerOver);
      document.removeEventListener("pointerout", onPointerOut);
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("toggle", onToggle, true);
    };
  }, [pathname, router]);
}

export function PublicNavigationFeedback({ children, className, progressClassName }: { children: ReactNode; className: string; progressClassName: string }) {
  const activeLinks = useRef(new Map<string, PendingLink>());
  const [activeLink, setActiveLink] = useState<PendingLink | null>(null);
  const progress = useNavigationProgress();
  useInstantNavigation();
  const report = useCallback<PendingLinkReporter>((pendingLink, pending) => {
    if (pending) {
      activeLinks.current.delete(pendingLink.id);
      activeLinks.current.set(pendingLink.id, pendingLink);
    } else {
      activeLinks.current.delete(pendingLink.id);
    }
    setActiveLink([...activeLinks.current.values()].at(-1) ?? null);
  }, []);

  return (
    <PendingLinkContext.Provider value={report}>
      {children}
      {progress === "idle" ? null : <div aria-hidden="true" className={progressClassName} data-navigation-progress={progress} />}
      {activeLink ? (
        <div
          aria-atomic="true"
          aria-live="polite"
          className={className}
          data-navigation-pending
          data-navigation-pending-destination={activeLink.label}
          role="status"
        >
          <span aria-hidden="true" />
          <strong>{activeLink.label}</strong>
        </div>
      ) : null}
    </PendingLinkContext.Provider>
  );
}

/** Must stay inside the Link whose native transition it reports. */
export function PublicLinkPendingSignal({ label }: { label: string }) {
  const { pending } = useLinkStatus();
  const report = useContext(PendingLinkContext);
  const id = useId();
  const markerRef = useRef<HTMLSpanElement>(null);
  const optimisticRef = useRef(false);
  const nativePendingSeenRef = useRef(false);
  const fallbackTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const marker = markerRef.current;
    const anchor = marker?.closest("a[href]");
    if (!report || !(anchor instanceof HTMLAnchorElement)) return;
    const pendingLink = { id, label };
    const clearFallback = () => {
      if (fallbackTimerRef.current !== null) window.clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    };
    const clearOptimistic = () => {
      optimisticRef.current = false;
      nativePendingSeenRef.current = false;
      clearFallback();
      report(pendingLink, false);
    };
    const onClick = (event: MouseEvent) => {
      if (
        event.button !== 0
        || event.metaKey
        || event.ctrlKey
        || event.shiftKey
        || event.altKey
        || anchor.target === "_blank"
        || anchor.hasAttribute("download")
      ) return;
      const destination = new URL(anchor.href, window.location.href);
      if (
        destination.origin !== window.location.origin
        || (destination.pathname === window.location.pathname
          && destination.search === window.location.search
          && destination.hash)
      ) return;
      optimisticRef.current = true;
      nativePendingSeenRef.current = false;
      report(pendingLink, true);
      clearFallback();
      fallbackTimerRef.current = window.setTimeout(clearOptimistic, 10_000);
      window.setTimeout(() => {
        if (event.defaultPrevented && !nativePendingSeenRef.current) clearOptimistic();
      }, 0);
    };
    anchor.addEventListener("click", onClick);
    return () => {
      anchor.removeEventListener("click", onClick);
      clearOptimistic();
    };
  }, [id, label, report]);

  useEffect(() => {
    if (!report) return;
    const pendingLink = { id, label };
    if (pending) {
      nativePendingSeenRef.current = true;
      report(pendingLink, true);
    } else if (nativePendingSeenRef.current || !optimisticRef.current) {
      optimisticRef.current = false;
      nativePendingSeenRef.current = false;
      if (fallbackTimerRef.current !== null) window.clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
      report(pendingLink, false);
    }
  }, [id, label, pending, report]);

  return <span data-public-link-pending-signal hidden ref={markerRef} />;
}
