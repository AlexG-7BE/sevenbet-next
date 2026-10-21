"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { productAnalyticsClient } from "@/lib/analytics/product-analytics-client";
import type { OfferCountryView } from "@/lib/public-offer/offer-country";
import { OFFER_COUNTRY_COOKIE, OFFER_COUNTRY_COOKIE_MAX_AGE_SECONDS } from "@/lib/public-offer/offer-country-cookie";

import styles from "./OfferCountrySelect.module.css";

function ChevronIcon() {
  return <svg aria-hidden="true" className={styles.chevron} focusable="false" viewBox="0 0 16 16"><path d="m4 6 4 4 4-4" /></svg>;
}

/**
 * The country filter above an offer list. Country names arrive from the server: the
 * browser's own region names differ from Node's, which would break hydration.
 */
export function OfferCountrySelect({ elsewhereNote, label, selectLabel, surface, view }: {
  elsewhereNote: string;
  label: string;
  selectLabel: string;
  surface: "BONUSES" | "CASINOS" | "BEST_OFFERS";
  view: OfferCountryView;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const choose = (countryCode: string) => {
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    // Picking the country the lists show by default forgets the choice instead of storing it.
    document.cookie = countryCode === view.defaultCountryCode
      ? `${OFFER_COUNTRY_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${secure}`
      : `${OFFER_COUNTRY_COOKIE}=${countryCode}; Path=/; Max-Age=${OFFER_COUNTRY_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
    productAnalyticsClient.commercialViewSelected(`${surface}_COUNTRY_${countryCode}`);
    startTransition(() => router.refresh());
  };

  return <div aria-busy={pending || undefined} className={styles.filter} data-offer-country={view.countryCode} data-pending={pending ? "" : undefined}>
    <label className={styles.chip}>
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>{view.label}</span>
      <ChevronIcon />
      <select aria-label={selectLabel} onChange={(event) => choose(event.currentTarget.value)} value={view.countryCode}>
        {view.options.map((option) => <option key={option.countryCode} value={option.countryCode}>{option.label}</option>)}
      </select>
    </label>
    {view.actionsElsewhere ? <p className={styles.note} role="note">{elsewhereNote}</p> : null}
  </div>;
}
