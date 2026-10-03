"use client";

import { useMemo, useState } from "react";

import styles from "./WageringCalculator.module.css";
import type { WageringCalculatorDefaults, WageringCalculatorWidgetMessages } from "@/lib/i18n/static-pages/wagering-calculator";
import { calculateWagering, WAGERING_CONTRIBUTIONS, type WageringBase } from "@/lib/tools/wagering-calculator";

function amountFromInput(value: string) {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export function WageringCalculator({ label, messages, locale, defaults }: { label: string; messages: WageringCalculatorWidgetMessages; locale: string; defaults: WageringCalculatorDefaults }) {
  // Fields keep the visitor's text, so clearing one to retype it does not snap back to 0.
  const [depositText, setDepositText] = useState(String(defaults.deposit));
  const [bonusText, setBonusText] = useState(String(defaults.bonus));
  const [multiplierText, setMultiplierText] = useState(String(defaults.multiplier));
  const [rtpText, setRtpText] = useState("96");
  const [base, setBase] = useState<WageringBase>(defaults.base);
  const [contribution, setContribution] = useState(1);
  const deposit = amountFromInput(depositText);
  const bonus = amountFromInput(bonusText);
  const multiplier = Math.min(200, amountFromInput(multiplierText));
  const rtp = Math.min(100, amountFromInput(rtpText));
  const result = useMemo(() => calculateWagering({ deposit, bonus, multiplier, base, contribution, rtp }), [deposit, bonus, multiplier, base, contribution, rtp]);
  const money = useMemo(() => new Intl.NumberFormat(locale, { maximumFractionDigits: 0, style: "currency", currency: defaults.currency }), [locale, defaults.currency]);
  const formula = base === "deposit-bonus"
    ? `(${money.format(deposit)} + ${money.format(bonus)}) × ${multiplier}`
    : `${money.format(bonus)} × ${multiplier}`;
  const percent = useMemo(() => new Intl.NumberFormat(locale, { maximumFractionDigits: 1, style: "percent" }), [locale]);

  return <section aria-label={label} className={styles.calculator} data-nav-theme="dark" data-wagering-calculator>
    <div>
      <form className={styles.calculatorControls} onSubmit={(event) => event.preventDefault()}>
        <div className={styles.fieldRow}>
          <label className={styles.field}><span>{messages.deposit}</span><input inputMode="decimal" min="0" name="deposit" onChange={(event) => setDepositText(event.target.value)} type="number" value={depositText} /></label>
          <label className={styles.field}><span>{messages.bonus}</span><input inputMode="decimal" min="0" name="bonus" onChange={(event) => setBonusText(event.target.value)} type="number" value={bonusText} /></label>
        </div>
        <div className={styles.fieldRow}>
          <label className={styles.field}><span>{messages.multiplier}</span><input inputMode="decimal" max="200" min="0" name="multiplier" onChange={(event) => setMultiplierText(event.target.value)} type="number" value={multiplierText} /></label>
          <label className={styles.field}><span>{messages.rtp}</span><input inputMode="decimal" max="100" min="0" name="rtp" onChange={(event) => setRtpText(event.target.value)} step="0.1" type="number" value={rtpText} /></label>
        </div>

        <fieldset><legend>{messages.base}</legend><div className={styles.segmented}>
          <label className={base === "bonus" ? styles.selected : ""}><input checked={base === "bonus"} name="wagering-base" onChange={() => setBase("bonus")} type="radio" />{messages.bonusOnly}</label>
          <label className={base === "deposit-bonus" ? styles.selected : ""}><input checked={base === "deposit-bonus"} name="wagering-base" onChange={() => setBase("deposit-bonus")} type="radio" />{messages.depositAndBonus}</label>
        </div></fieldset>

        <fieldset><legend>{messages.contribution}</legend><div className={styles.gameWeights}>
          {WAGERING_CONTRIBUTIONS.map((game) => <label className={contribution === game.value ? styles.selected : ""} key={game.key}><input checked={contribution === game.value} name="game-contribution" onChange={() => setContribution(game.value)} type="radio" />{messages[game.key]}</label>)}
        </div></fieldset>
      </form>

      <output aria-live="polite" className={styles.calculatorOutput}>
        <small>{messages.result}</small>
        <dl>
          <div><dt>{messages.requiredTurnover}<span>{formula}</span></dt><dd>{money.format(result.requiredTurnover)}</dd></div>
          <div><dt>{messages.actualTurnover}<span>÷ {percent.format(contribution)}</span></dt><dd>{money.format(result.actualTurnover)}</dd></div>
          <div><dt>{messages.expectedLoss}<span>RTP {percent.format(rtp / 100)}</span></dt><dd className={styles.cost}>≈ {money.format(result.expectedLoss)}</dd></div>
          <div><dt>{messages.netValue}</dt><dd className={result.netValue < 0 ? styles.negative : styles.positive}>{result.netValue < 0 ? "−" : "+"}{money.format(Math.abs(result.netValue))}</dd></div>
        </dl>
        <p>{result.netValue < 0 ? messages.negative : messages.positive}</p>
        <span>{messages.caveat}</span>
      </output>
    </div>
  </section>;
}
