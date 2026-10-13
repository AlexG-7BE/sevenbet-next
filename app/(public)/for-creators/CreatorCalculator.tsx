"use client";

import { useMemo, useState } from "react";

import styles from "./ForCreators.module.css";
import type { ForCreatorsMessages } from "@/lib/i18n/static-pages/for-creators";
import { CREATOR_SHARE_MAX, CREATOR_SHARE_MIN, creatorEstimate } from "@/lib/tools/creator-terms";

function numberFromInput(value: string) {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

/** The public calculator over the open agreement. Every field is an assumption the creator can change. */
export function CreatorCalculator({ currency, locale, messages }: { currency: string; locale: string; messages: ForCreatorsMessages["calculator"] }) {
  const [viewers, setViewers] = useState("20000");
  const [startRate, setStartRate] = useState("2");
  const [completeRate, setCompleteRate] = useState("25");
  const [convertRate, setConvertRate] = useState("10");
  const [commission, setCommission] = useState("1500");
  const [share, setShare] = useState("45");
  const estimate = useMemo(() => creatorEstimate({
    viewers: numberFromInput(viewers),
    startRate: numberFromInput(startRate) / 100,
    completeRate: numberFromInput(completeRate) / 100,
    convertRate: numberFromInput(convertRate) / 100,
    commission: numberFromInput(commission),
    share: numberFromInput(share) / 100,
  }), [viewers, startRate, completeRate, convertRate, commission, share]);
  const money = useMemo(() => new Intl.NumberFormat(locale, { maximumFractionDigits: 0, style: "currency", currency }), [locale, currency]);
  const count = useMemo(() => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }), [locale]);

  const field = (id: string, label: string, value: string, set: (value: string) => void, extra: Readonly<Record<string, string | number>> = {}) =>
    <label className={styles.field} htmlFor={id}><span>{label}</span><input id={id} inputMode="decimal" min="0" name={id} onChange={(event) => set(event.target.value)} type="number" value={value} {...extra} /></label>;

  return <section className={styles.calculator} data-creator-calculator data-nav-theme="dark">
    <div>
      <h2>{messages.heading}</h2>
      <p>{messages.intro}</p>
      <form onSubmit={(event) => event.preventDefault()}>
        {field("creator-viewers", messages.viewers, viewers, setViewers, { step: 100 })}
        {field("creator-start", `${messages.startRate} (%)`, startRate, setStartRate, { max: 100, step: 0.5 })}
        {field("creator-complete", `${messages.completeRate} (%)`, completeRate, setCompleteRate, { max: 100, step: 1 })}
        {field("creator-convert", `${messages.convertRate} (%)`, convertRate, setConvertRate, { max: 100, step: 1 })}
        {field("creator-commission", `${messages.commission} (${currency})`, commission, setCommission, { step: 50 })}
        <small>{messages.commissionHint}</small>
        {field("creator-share", `${messages.share} (%)`, share, setShare, { min: CREATOR_SHARE_MIN * 100, max: CREATOR_SHARE_MAX * 100, step: 1 })}
      </form>
    </div>
    <dl className={styles.output}>
      <div><dt>{messages.starts}</dt><dd data-creator-starts={estimate.starts}>{count.format(estimate.starts)}</dd></div>
      <div><dt>{messages.completions}</dt><dd>{count.format(estimate.completions)}</dd></div>
      <div><dt>{messages.conversions}</dt><dd>{count.format(estimate.conversions)}</dd></div>
      <div><dt>{messages.payout}</dt><dd className={styles.payout} data-creator-payout={estimate.payout}>{money.format(estimate.payout)}</dd></div>
      <p>{messages.note}</p>
    </dl>
  </section>;
}
