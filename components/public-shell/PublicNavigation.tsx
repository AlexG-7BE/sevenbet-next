"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
  PUBLIC_NAVIGATION,
  isCurrentPublicRoute,
  type PublicAccountNavigation,
} from "@/lib/public-shell";
import { productAnalyticsClient } from "@/lib/analytics/product-analytics-client";
import styles from "./PublicShell.module.css";

export function PublicNavigation({
  account,
  authenticated,
}: {
  account: PublicAccountNavigation;
  authenticated: boolean;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  function closeMenu({ restoreFocus = true } = {}) {
    const dialog = dialogRef.current;
    if (dialog?.open) dialog.close();
    setMenuOpen(false);
    if (restoreFocus) requestAnimationFrame(() => triggerRef.current?.focus());
  }

  function openMenu() {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    dialog.showModal();
    setMenuOpen(true);
    requestAnimationFrame(() => closeRef.current?.focus());
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && dialogRef.current?.open) {
        event.preventDefault();
        closeMenu();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => { document.documentElement.style.overflow = previousOverflow; };
  }, [menuOpen]);

  return (
    <>
      <div className={styles.desktopNavigation}>
        <nav className={styles.primaryNavigation} aria-label="Primary navigation">
          {PUBLIC_NAVIGATION.map((item) => (
            <Link
              className={"safety" in item && item.safety ? styles.helpLink : undefined}
              href={item.href}
              key={item.href}
              aria-current={isCurrentPublicRoute(pathname, item.href) ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className={styles.accountNavigation}>
          {account.xpLabel ? <span className={styles.xpPill}>{account.xpLabel}</span> : null}
          {!authenticated ? <Link className={styles.accountLink} href={account.accountHref}>{account.accountLabel}</Link> : null}
          <Link className={styles.primaryAction} href={account.primaryHref} onClick={() => {
            if (!authenticated && account.primaryHref.startsWith("/program")) productAnalyticsClient.startClicked("public_header");
          }}>{account.primaryLabel}</Link>
        </div>
      </div>

      <div className={styles.mobileNavigation}>
        {account.xpLabel ? <span className={styles.xpPill}>{account.xpLabel}</span> : null}
        <button
          aria-controls="public-mobile-navigation"
          aria-expanded={menuOpen}
          aria-label="Open navigation"
          className={styles.menuButton}
          onClick={openMenu}
          ref={triggerRef}
          type="button"
        >
          Menu
        </button>
        <dialog
          aria-label="Site navigation"
          className={styles.mobileDialog}
          id="public-mobile-navigation"
          onCancel={(event) => {
            event.preventDefault();
            closeMenu();
          }}
          onClose={() => setMenuOpen(false)}
          ref={dialogRef}
        >
          <div className={styles.dialogTopbar}>
            <Link className={styles.dialogBrand} href="/" onClick={() => closeMenu({ restoreFocus: false })} translate="no">B4GAMBLE</Link>
            <button aria-label="Close navigation" className={styles.menuButton} onClick={() => closeMenu()} ref={closeRef} type="button">Close</button>
          </div>
          <nav className={styles.mobileRouteList} aria-label="Mobile primary navigation">
            {PUBLIC_NAVIGATION.filter((item) => !("safety" in item && item.safety)).map((item) => (
              <Link
                href={item.href}
                key={item.href}
                onClick={() => closeMenu({ restoreFocus: false })}
                aria-current={isCurrentPublicRoute(pathname, item.href) ? "page" : undefined}
              >
                <span>{item.label}</span><small>VIEW</small>
              </Link>
            ))}
          </nav>
          <div className={styles.mobileHelp}>
            <span>CONTROL &amp; SUPPORT</span>
            <Link href="/help" onClick={() => closeMenu({ restoreFocus: false })}>Open Help</Link>
          </div>
          <div className={styles.mobileAccount}>
            {!authenticated ? <Link href={account.accountHref} onClick={() => closeMenu({ restoreFocus: false })}>{account.accountLabel}</Link> : null}
            <Link className={styles.primaryAction} href={account.primaryHref} onClick={() => {
              if (!authenticated && account.primaryHref.startsWith("/program")) productAnalyticsClient.startClicked("public_header");
              closeMenu({ restoreFocus: false });
            }}>
              {authenticated ? "Open My Programme" : account.primaryLabel}
            </Link>
          </div>
          <p className={styles.dialogLegal}>18+ · Information and comparison service · Help stays separate from commercial discovery.</p>
        </dialog>
      </div>
    </>
  );
}
