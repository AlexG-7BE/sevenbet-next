"use client";

import { useEffect, useState } from "react";

import styles from "./CasinoDiscovery.module.css";

export function CasinoDiscoveryPending() {
  const [pending, setPending] = useState(false);

  useEffect(() => {
    function isDirectoryUrl(value: string) {
      try {
        const url = new URL(value, window.location.href);
        return url.origin === window.location.origin && url.pathname === "/casinos";
      } catch {
        return false;
      }
    }

    function onSubmit(event: SubmitEvent) {
      const form = event.target instanceof HTMLFormElement ? event.target : null;
      if (form && isDirectoryUrl(form.action)) setPending(true);
    }

    function onClick(event: MouseEvent) {
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (link && isDirectoryUrl(link.href) && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) setPending(true);
    }

    document.addEventListener("submit", onSubmit, true);
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("submit", onSubmit, true);
      document.removeEventListener("click", onClick, true);
    };
  }, []);

  if (!pending) return null;
  return <div aria-busy="true" aria-live="polite" className={`${styles.page} ${styles.pendingOverlay}`}><section className={styles.loadingHero}><div className={styles.shell}><span className={styles.skeletonLine} /><span className={styles.skeletonTitle} /><span className={styles.skeletonTitleShort} /></div></section><section className={styles.loadingDirectory}><div className={styles.shell}><p className={styles.srOnly}>Loading published casino reviews</p><div className={styles.skeletonControls} /><div className={styles.skeletonCards}>{[0, 1, 2].map((item) => <div key={item} />)}</div></div></section></div>;
}
