"use client";

import { usePathname } from "next/navigation";

import type { PublicShellMessages } from "@/lib/i18n/public-shell-catalog";
import type { PresentationResolution } from "@/lib/market/presentation-resolver";
import { INITIAL_EUROPEAN_MARKET_PROFILES } from "@/lib/market/registry";
import styles from "./PublicShell.module.css";

function optionLabel(locale: string, marketName: string, activeLocale: string) {
  const language = new Intl.DisplayNames([activeLocale], { type: "language" }).of(locale) ?? locale;
  return `${marketName} — ${language}`;
}

export function MarketLanguageSelector({
  messages,
  presentation,
  variant,
}: {
  messages: PublicShellMessages;
  presentation: PresentationResolution;
  variant: "desktop" | "mobile";
}) {
  const pathname = usePathname();
  const id = `market-language-${variant}`;
  return (
    <form
      action="/api/presentation"
      className={variant === "desktop" ? styles.presentationSelector : styles.mobilePresentationSelector}
      method="post"
    >
      <label htmlFor={id}>
        <span className={variant === "desktop" ? "srOnly" : styles.presentationSelectorLabel}>
          {messages.marketAndLanguage}
        </span>
        <select
          aria-label={messages.changeMarketAndLanguage}
          defaultValue={`${presentation.market.countryCode}|${presentation.locale}`}
          id={id}
          name="choice"
        >
          <option value="automatic">{messages.automaticPresentation}</option>
          {INITIAL_EUROPEAN_MARKET_PROFILES.flatMap((profile) => profile.supportedLocales.map((locale) => (
            <option key={`${profile.countryCode}-${locale}`} value={`${profile.countryCode}|${locale}`}>
              {optionLabel(locale, profile.seoDisplayName, presentation.locale)}
            </option>
          )))}
        </select>
      </label>
      <input name="returnTo" type="hidden" value={pathname} />
      <button type="submit">{messages.applyPreference}</button>
      {variant === "mobile" ? <p>{messages.presentationOnlyNotice}</p> : null}
    </form>
  );
}
