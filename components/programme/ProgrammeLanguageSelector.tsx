"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, type KeyboardEvent as ReactKeyboardEvent } from "react";

import type { PublicShellMessages } from "@/lib/i18n/public-shell-catalog";
import {
  PROGRAMME_ROUTES,
  programmeLocaleHref,
  type ProgrammeLocale,
} from "@/lib/programme/presentation";
import styles from "@/components/public-shell/PublicShell.module.css";

function languageName(locale: ProgrammeLocale, activeLocale: ProgrammeLocale) {
  const language = locale.split("-")[0] ?? locale;
  return new Intl.DisplayNames([activeLocale], { type: "language" }).of(language) ?? language;
}

function regionName(region: string, activeLocale: ProgrammeLocale) {
  return new Intl.DisplayNames([activeLocale], { type: "region" }).of(region) ?? region;
}

function languageCode(locale: ProgrammeLocale) {
  return locale.split("-")[0]?.toUpperCase() ?? locale.toUpperCase();
}

function GlobeIcon() {
  return (
    <svg aria-hidden="true" className={styles.selectorGlobe} focusable="false" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" />
      <path d="M3.5 9h17M3.5 15h17M12 3c2.2 2.4 3.3 5.4 3.3 9S14.2 18.6 12 21M12 3C9.8 5.4 8.7 8.4 8.7 12s1.1 6.6 3.3 9" />
    </svg>
  );
}

function ChevronIcon() {
  return <svg aria-hidden="true" className={styles.selectorChevron} focusable="false" viewBox="0 0 16 16"><path d="m4 6 4 4 4-4" /></svg>;
}

function CheckIcon() {
  return <svg aria-hidden="true" className={styles.selectorCheck} focusable="false" viewBox="0 0 20 20"><path d="m4 10 4 4 8-8" /></svg>;
}

export function ProgrammeLanguageSelector({
  locale,
  messages,
  variant,
}: {
  locale: ProgrammeLocale;
  messages: PublicShellMessages;
  variant: "desktop" | "mobile";
}) {
  const searchParams = useSearchParams();
  const menuId = `programme-language-menu-${variant}`;
  const rootRef = useRef<HTMLDivElement>(null);
  const disclosureRef = useRef<HTMLDetailsElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const disclosure = disclosureRef.current;
    if (!disclosure) return;
    let frame = 0;
    const focusCurrentChoice = () => {
      if (!disclosure.open) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        menuRef.current?.querySelector<HTMLElement>('[role="menuitemradio"][aria-checked="true"]')?.focus();
      });
    };
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) disclosure.open = false;
    };
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape" || !disclosure.open) return;
      event.preventDefault();
      event.stopPropagation();
      disclosure.open = false;
      requestAnimationFrame(() => triggerRef.current?.focus());
    };
    const root = rootRef.current;
    disclosure.addEventListener("toggle", focusCurrentChoice);
    root?.addEventListener("keydown", closeOnEscape);
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    if (disclosure.open) focusCurrentChoice();
    return () => {
      cancelAnimationFrame(frame);
      disclosure.removeEventListener("toggle", focusCurrentChoice);
      root?.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
    };
  }, []);

  function onMenuKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    const options = Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitemradio"]') ?? []);
    const currentIndex = options.indexOf(document.activeElement as HTMLElement);
    let nextIndex: number | null = null;
    if (event.key === "ArrowDown") nextIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0;
    if (event.key === "ArrowUp") nextIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = options.length - 1;
    if (nextIndex !== null) {
      event.preventDefault();
      options[nextIndex]?.focus();
    }
  }

  return (
    <div
      className={variant === "desktop" ? styles.presentationSelector : styles.mobilePresentationSelector}
      data-programme-language-selector
      ref={rootRef}
    >
      <span className={variant === "desktop" ? "srOnly" : styles.presentationSelectorLabel}>{messages.marketAndLanguage}</span>
      <details className={styles.presentationDisclosure} ref={disclosureRef}>
        <summary
          aria-controls={menuId}
          aria-haspopup="menu"
          aria-label={messages.changeMarketAndLanguage}
          className={styles.selectorTrigger}
          ref={triggerRef}
          role="button"
        >
          <GlobeIcon />
          <span className={styles.selectorTriggerCode}>{languageCode(locale)}</span>
          <ChevronIcon />
        </summary>
        <div
          aria-label={messages.changeMarketAndLanguage}
          className={styles.selectorMenu}
          id={menuId}
          onKeyDown={onMenuKeyDown}
          ref={menuRef}
          role="menu"
        >
          {PROGRAMME_ROUTES.map((route) => {
            const selected = route.locale === locale;
            return (
              <a
                aria-checked={selected}
                className={styles.selectorOption}
                href={programmeLocaleHref(route.locale, searchParams)}
                key={route.locale}
                onClick={() => {
                  if (disclosureRef.current) disclosureRef.current.open = false;
                }}
                role="menuitemradio"
              >
                <span aria-hidden="true" className={styles.languageBadge}>{languageCode(route.locale)}</span>
                <span className={styles.selectorOptionCopy}>
                  <strong>{languageName(route.locale, locale)}</strong>
                  <small>{regionName(route.locale.split("-")[1] ?? "", locale)}</small>
                </span>
                <span aria-hidden="true" className={styles.selectorCheckSlot}>{selected ? <CheckIcon /> : null}</span>
              </a>
            );
          })}
        </div>
      </details>
      {variant === "mobile" ? <p>{messages.presentationOnlyNotice}</p> : null}
    </div>
  );
}
