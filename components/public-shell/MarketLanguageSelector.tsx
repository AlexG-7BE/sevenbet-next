"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, type KeyboardEvent as ReactKeyboardEvent } from "react";

import type { PublicShellMessages } from "@/lib/i18n/public-shell-catalog";
import type { PresentationResolution } from "@/lib/market/presentation-resolver";
import type { LanguageRouteProfile } from "@/lib/market/registry";
import styles from "./PublicShell.module.css";

function languageName(locale: string, activeLocale: string) {
  const language = locale.split("-")[0] ?? locale;
  return new Intl.DisplayNames([activeLocale], { type: "language" }).of(language) ?? language;
}

function languageCode(locale: string) {
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
  return (
    <svg aria-hidden="true" className={styles.selectorChevron} focusable="false" viewBox="0 0 16 16">
      <path d="m4 6 4 4 4-4" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" className={styles.selectorCheck} focusable="false" viewBox="0 0 20 20">
      <path d="m4 10 4 4 8-8" />
    </svg>
  );
}

export function MarketLanguageSelector({
  messages,
  presentation,
  selectableLanguages,
  surface = "public",
  variant,
}: {
  messages: PublicShellMessages;
  presentation: PresentationResolution;
  selectableLanguages: readonly LanguageRouteProfile[];
  surface?: "public" | "programme";
  variant: "desktop" | "mobile";
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const returnTo = `${pathname}${searchParams.size ? `?${searchParams}` : ""}`;
  const menuId = `${surface}-language-menu-${variant}`;
  const activeChoice = presentation.language;
  const formRef = useRef<HTMLFormElement>(null);
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
        menuRef.current?.querySelector<HTMLButtonElement>('[role="menuitemradio"][aria-checked="true"]')?.focus();
      });
    };
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (event.target instanceof Node && !formRef.current?.contains(event.target)) disclosure.open = false;
    };
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape" || !disclosure.open) return;
      event.preventDefault();
      event.stopPropagation();
      closeMenu({ restoreFocus: true });
    };
    const form = formRef.current;
    disclosure.addEventListener("toggle", focusCurrentChoice);
    form?.addEventListener("keydown", closeOnEscape);
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    if (disclosure.open) focusCurrentChoice();
    return () => {
      cancelAnimationFrame(frame);
      disclosure.removeEventListener("toggle", focusCurrentChoice);
      form?.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
    };
  }, []);

  function closeMenu({ restoreFocus = false } = {}) {
    if (disclosureRef.current) disclosureRef.current.open = false;
    if (restoreFocus) requestAnimationFrame(() => triggerRef.current?.focus());
  }

  function onMenuKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    const options = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]') ?? []);
    const currentIndex = options.indexOf(document.activeElement as HTMLButtonElement);
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
    <form
      action="/api/presentation"
      className={variant === "desktop" ? styles.presentationSelector : styles.mobilePresentationSelector}
      method="post"
      ref={formRef}
    >
      <span className={variant === "desktop" ? "srOnly" : styles.presentationSelectorLabel}>
        {messages.marketAndLanguage}
      </span>
      <details className={styles.presentationDisclosure} ref={disclosureRef}>
        <summary
          aria-controls={menuId}
          aria-haspopup="menu"
          aria-label={`${messages.changeMarketAndLanguage}: ${languageName(presentation.locale, presentation.locale)}`}
          className={styles.selectorTrigger}
          ref={triggerRef}
          role="button"
        >
          <GlobeIcon />
          <span className={styles.selectorTriggerCode}>{languageCode(presentation.locale)}</span>
          <ChevronIcon />
        </summary>
        <input name="returnTo" type="hidden" value={returnTo} />
        <input name="surface" type="hidden" value={surface} />
        <div
          aria-label={messages.changeMarketAndLanguage}
          className={styles.selectorMenu}
          id={menuId}
          onKeyDown={onMenuKeyDown}
          ref={menuRef}
          role="menu"
        >
          <button
            aria-checked="false"
            className={styles.selectorOption}
            name="choice"
            role="menuitemradio"
            type="submit"
            value="automatic"
          >
            <span aria-hidden="true" className={styles.languageBadge}>AUTO</span>
            <span className={styles.selectorOptionCopy}><strong>{messages.automaticPresentation}</strong></span>
            <span aria-hidden="true" className={styles.selectorCheckSlot} />
          </button>
          {selectableLanguages.map((profile) => {
            const choice = profile.language;
            const selected = choice === activeChoice;
            return (
              <button
                aria-checked={selected}
                className={styles.selectorOption}
                key={choice}
                name="choice"
                role="menuitemradio"
                type="submit"
                value={choice}
              >
                <span aria-hidden="true" className={styles.languageBadge}>{profile.language.toUpperCase()}</span>
                <span className={styles.selectorOptionCopy}>
                  <strong>{languageName(profile.defaultLocale, presentation.locale)}</strong>
                </span>
                <span aria-hidden="true" className={styles.selectorCheckSlot}>{selected ? <CheckIcon /> : null}</span>
              </button>
            );
          })}
          <p className={styles.selectorStatus}>{messages.presentationOnlyNotice} <strong>{presentation.marketDisplayName}</strong></p>
        </div>
      </details>
    </form>
  );
}
