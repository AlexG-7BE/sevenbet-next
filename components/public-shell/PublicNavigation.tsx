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
import type { PublicShellMessages } from "@/lib/i18n/public-shell-catalog";
import type { PresentationResolution } from "@/lib/market/presentation-resolver";
import { localizePublicHref, stripPublicMarketPrefix } from "@/lib/market/routing";
import { publicMarketPath } from "@/lib/market/registry";
import { MarketLanguageSelector } from "./MarketLanguageSelector";
import styles from "./PublicShell.module.css";

function MenuIcon() {
  return (
    <svg aria-hidden="true" className={styles.navigationIcon} focusable="false" viewBox="0 0 24 24">
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" className={styles.navigationIcon} focusable="false" viewBox="0 0 24 24">
      <path d="M5 5l14 14M19 5L5 19" />
    </svg>
  );
}

export function PublicNavigation({
  account,
  authenticated,
  messages,
  presentation,
}: {
  account: PublicAccountNavigation;
  authenticated: boolean;
  messages: PublicShellMessages;
  presentation: PresentationResolution;
}) {
  const pathname = usePathname();
  const unprefixedPathname = stripPublicMarketPrefix(pathname);
  const homeHref = presentation.source === "EXPLICIT_ROUTE"
    ? publicMarketPath(presentation.market, presentation.locale)
    : "/";
  const navigationLabels: Record<string, string> = {
    "/best-offers": messages.bestOffers,
    "/casinos": messages.casinos,
    "/bonuses": messages.bonuses,
    "/learn": messages.learn,
  };
  const navigationLabel = (href: string) => navigationLabels[href] ?? href;
  const accountLabel = authenticated ? messages.myProgramme : messages.logIn;
  const primaryLabel = authenticated ? messages.myProgramme : messages.startProgramme;
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
        <nav className={styles.primaryNavigation} aria-label={messages.primaryNavigation}>
          {PUBLIC_NAVIGATION.map((item) => (
            <Link
              className={"safety" in item && item.safety ? styles.helpLink : undefined}
              href={localizePublicHref(item.href, pathname, presentation.market, presentation.locale)}
              key={item.href}
              aria-current={isCurrentPublicRoute(unprefixedPathname, item.href) ? "page" : undefined}
            >
              {navigationLabel(item.href)}
            </Link>
          ))}
        </nav>
        <div className={styles.accountNavigation}>
          <MarketLanguageSelector messages={messages} presentation={presentation} variant="desktop" />
          {account.xpLabel ? <span className={styles.xpPill}>{account.xpLabel}</span> : null}
          {!authenticated ? <Link className={styles.accountLink} href={account.accountHref}>{accountLabel}</Link> : null}
          <Link className={styles.primaryAction} href={account.primaryHref} onClick={() => {
            if (!authenticated && account.primaryHref.startsWith("/program")) productAnalyticsClient.startClicked("public_header");
          }}>{primaryLabel}</Link>
        </div>
      </div>

      <div className={styles.mobileNavigation}>
        {account.xpLabel ? <span className={styles.xpPill}>{account.xpLabel}</span> : null}
        <Link className={styles.mobilePrimaryAction} href={account.primaryHref} onClick={() => {
          if (!authenticated && account.primaryHref.startsWith("/program")) productAnalyticsClient.startClicked("public_header");
        }}>{primaryLabel}</Link>
        <button
          aria-controls="public-mobile-navigation"
          aria-expanded={menuOpen}
          aria-label={messages.openNavigation}
          className={styles.menuButton}
          onClick={openMenu}
          ref={triggerRef}
          type="button"
        >
          <MenuIcon />
        </button>
        <dialog
          aria-label={messages.siteNavigation}
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
            <Link className={styles.dialogBrand} href={homeHref} onClick={() => closeMenu({ restoreFocus: false })} translate="no">B4GAMBLE</Link>
            <button aria-label={messages.closeNavigation} className={styles.menuButton} onClick={() => closeMenu()} ref={closeRef} type="button"><CloseIcon /></button>
          </div>
          <nav className={styles.mobileRouteList} aria-label={messages.mobilePrimaryNavigation}>
            {PUBLIC_NAVIGATION.filter((item) => !("safety" in item && item.safety)).map((item) => (
              <Link
                href={localizePublicHref(item.href, pathname, presentation.market, presentation.locale)}
                key={item.href}
                onClick={() => closeMenu({ restoreFocus: false })}
                aria-current={isCurrentPublicRoute(unprefixedPathname, item.href) ? "page" : undefined}
              >
                <span>{navigationLabel(item.href)}</span><small>{messages.view}</small>
              </Link>
            ))}
          </nav>
          <MarketLanguageSelector messages={messages} presentation={presentation} variant="mobile" />
          <div className={styles.mobileHelp}>
            <span>{messages.controlAndSupport}</span>
            <Link href="/help" onClick={() => closeMenu({ restoreFocus: false })}>{messages.openHelp}</Link>
          </div>
          <div className={styles.mobileAccount}>
            {!authenticated ? <Link href={account.accountHref} onClick={() => closeMenu({ restoreFocus: false })}>{accountLabel}</Link> : null}
            <Link className={styles.primaryAction} href={account.primaryHref} onClick={() => {
              if (!authenticated && account.primaryHref.startsWith("/program")) productAnalyticsClient.startClicked("public_header");
              closeMenu({ restoreFocus: false });
            }}>
              {authenticated ? messages.openProgramme : primaryLabel}
            </Link>
          </div>
          <p className={styles.dialogLegal}>{messages.adultServiceNotice}</p>
        </dialog>
      </div>
    </>
  );
}
