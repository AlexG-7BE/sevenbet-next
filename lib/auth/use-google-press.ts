"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  GOOGLE_PREPARATION_CHECK_EVERY_MS,
  GOOGLE_PRESS_NOT_LEFT_AFTER_MS,
  createGooglePreparation,
  type GooglePressClaim,
} from "@/lib/auth/google-press";

type GooglePressOptions = {
  /** The screen with the Google button is on, for a person who can use it. */
  enabled: boolean;
  /** Another action is in flight; nothing new is prepared beside it. */
  paused: boolean;
  /** The sign-in request with the redirect switched off; null when there is nothing to ask with. */
  prepareAddress: () => Promise<unknown>;
  /** The pending claim the Google return needs, or null when it needs none. */
  claim: () => GooglePressClaim | null;
  /**
   * The page is still here after a press: the navigation did not start, or the
   * browser brought the page back from its page cache. The button is restored.
   */
  onStayed: (reason: "not-left" | "restored") => void;
};

/**
 * Founder decision, 12 Oct 2026: a press on "Continue with Google" leaves at
 * once. This wires the preparation to the screen: it runs while the screen is
 * on and the tab is visible, renews on a timer and when the tab is shown again,
 * and stops when the screen is left. The address lives in memory only.
 */
export function useGooglePress(options: GooglePressOptions) {
  const latest = useRef(options);
  useEffect(() => { latest.current = options; });
  const [preparation] = useState(() => createGooglePreparation({
    prepareAddress: () => latest.current.prepareAddress(),
    claim: () => latest.current.claim(),
  }));
  const notLeftTimer = useRef<number | null>(null);
  const { enabled, paused } = options;

  useEffect(() => { preparation.hold(paused); }, [paused, preparation]);

  useEffect(() => {
    if (!enabled) return;
    let timer: number | null = null;
    const tabVisible = () => document.visibilityState === "visible";
    const startTimer = () => {
      if (timer === null) timer = window.setInterval(preparation.check, GOOGLE_PREPARATION_CHECK_EVERY_MS);
    };
    const stopTimer = () => {
      if (timer !== null) window.clearInterval(timer);
      timer = null;
    };
    const clearNotLeft = () => {
      if (notLeftTimer.current !== null) window.clearTimeout(notLeftTimer.current);
      notLeftTimer.current = null;
    };
    // No timer runs in a hidden tab. A tab shown again asks for a new address at once.
    const onVisibility = () => {
      if (tabVisible()) { preparation.resume(); startTimer(); } else { preparation.hide(); stopTimer(); }
    };
    const onActivity = () => preparation.touch();
    // The page is leaving for Google: the "still here" check must not fire on a page kept in the cache.
    const onPageHide = () => clearNotLeft();
    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      clearNotLeft();
      preparation.release();
      preparation.resume();
      latest.current.onStayed("restored");
    };
    preparation.start(tabVisible());
    if (tabVisible()) startTimer();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pointerdown", onActivity, { passive: true });
    window.addEventListener("keydown", onActivity, { passive: true });
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      stopTimer();
      clearNotLeft();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointerdown", onActivity);
      window.removeEventListener("keydown", onActivity);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("pageshow", onPageShow);
      preparation.stop();
    };
  }, [enabled, preparation]);

  return useMemo(() => ({
    /** A press: the prepared address if the page can leave now, without waiting for anything. */
    press: preparation.press,
    /** Waits for background work in flight; the prepared address if it is ready by then. */
    settled: preparation.settled,
    /** The press failed: the button is back and the preparation goes on. */
    release: preparation.release,
    /**
     * Leaves for the prepared address, or (without one) notes that the sign-in
     * request is taking the page away. If the page is still here later, the
     * button is restored through `onStayed`.
     */
    leave(url?: string) {
      if (url) window.location.assign(url);
      if (notLeftTimer.current !== null) window.clearTimeout(notLeftTimer.current);
      notLeftTimer.current = window.setTimeout(() => {
        notLeftTimer.current = null;
        preparation.release();
        latest.current.onStayed("not-left");
      }, GOOGLE_PRESS_NOT_LEFT_AFTER_MS);
    },
  }), [preparation]);
}
