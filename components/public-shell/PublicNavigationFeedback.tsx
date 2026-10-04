"use client";

import { useLinkStatus } from "next/link";
import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ReactNode } from "react";

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

export function PublicNavigationFeedback({ children, className, progressClassName }: { children: ReactNode; className: string; progressClassName: string }) {
  const activeLinks = useRef(new Map<string, PendingLink>());
  const [activeLink, setActiveLink] = useState<PendingLink | null>(null);
  const progress = useNavigationProgress();
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
