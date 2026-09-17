"use client";

import { useLinkStatus } from "next/link";
import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ReactNode } from "react";

type PendingLink = Readonly<{ id: string; label: string }>;
type PendingLinkReporter = (pendingLink: PendingLink, pending: boolean) => void;

const PendingLinkContext = createContext<PendingLinkReporter | null>(null);

export function usePublicNavigationFeedback() {
  return useContext(PendingLinkContext);
}

export function PublicNavigationFeedback({ children, className }: { children: ReactNode; className: string }) {
  const activeLinks = useRef(new Map<string, PendingLink>());
  const [activeLink, setActiveLink] = useState<PendingLink | null>(null);
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
