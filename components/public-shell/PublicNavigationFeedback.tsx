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

  useEffect(() => {
    if (!report) return;
    const pendingLink = { id, label };
    report(pendingLink, pending);
    return () => report(pendingLink, false);
  }, [id, label, pending, report]);

  return null;
}
