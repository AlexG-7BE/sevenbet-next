"use client";

import { useMemo, useState } from "react";

import styles from "./BonusesFinal.module.css";
import type { ProductPageMessages } from "@/lib/i18n/product-pages-catalog";

const gameWeights = [
  { label: "slots", percent: "100%", value: 1 },
  { label: "tableGames", percent: "50%", value: 0.5 },
  { label: "roulette", percent: "20%", value: 0.2 },
  { label: "blackjack", percent: "10%", value: 0.1 },
] as const;

function euros(value: number, locale: string) {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0, style: "currency", currency: "EUR" }).format(value);
}

export function BonusCalculator({ messages, locale }: { messages: ProductPageMessages; locale: string }) {
  const [amount, setAmount] = useState(200);
  const [wagering, setWagering] = useState(35);
  const [appliesTo, setAppliesTo] = useState<"bonus" | "deposit-bonus">("bonus");
  const [weight, setWeight] = useState(1);
  const values = useMemo(() => {
    const turnover = amount * wagering * (appliesTo === "deposit-bonus" ? 2 : 1);
    const effectiveTurnover = turnover / weight;
    const expectedCost = effectiveTurnover * 0.04;
    return { turnover, effectiveTurnover, expectedCost, netValue: amount - expectedCost };
  }, [amount, wagering, appliesTo, weight]);

  return <section aria-labelledby="bonus-calculator-title" className={styles.calculator} data-motion-reveal data-nav-theme="dark">
    <div>
      <div className={styles.calculatorControls}>
        <small>{messages.calculator.kicker}</small>
        <h2 id="bonus-calculator-title">{messages.calculator.titleLead} <em>{messages.calculator.titleEmphasis}</em></h2>
        <p>{messages.calculator.copy}</p>

        <label className={styles.amountField}><span>{messages.calculator.amount}, €</span><input aria-label={messages.calculator.amount} inputMode="numeric" min="0" onChange={(event) => setAmount(Math.max(0, Number(event.target.value) || 0))} type="number" value={amount} /></label>
        <label className={styles.wageringField}><span>{messages.calculator.multiplier} — {wagering}x</span><input aria-label={messages.calculator.multiplier} max="60" min="1" onChange={(event) => setWagering(Number(event.target.value))} type="range" value={wagering} /></label>

        <fieldset><legend>{messages.calculator.appliesTo}</legend><div className={styles.segmented}>
          <label className={appliesTo === "bonus" ? styles.selected : ""}><input checked={appliesTo === "bonus"} name="applies-to" onChange={() => setAppliesTo("bonus")} type="radio" />{messages.calculator.bonusOnly}</label>
          <label className={appliesTo === "deposit-bonus" ? styles.selected : ""}><input checked={appliesTo === "deposit-bonus"} name="applies-to" onChange={() => setAppliesTo("deposit-bonus")} type="radio" />{messages.calculator.depositAndBonus}</label>
        </div></fieldset>

        <fieldset><legend>{messages.calculator.gameWeight}</legend><div className={styles.gameWeights}>
          {gameWeights.map((game) => <label className={weight === game.value ? styles.selected : ""} key={game.value}><input checked={weight === game.value} name="game-weight" onChange={() => setWeight(game.value)} type="radio" />{messages.calculator[game.label]} · {game.percent}</label>)}
        </div></fieldset>
      </div>

      <output aria-live="polite" className={styles.calculatorOutput}>
        <small>{messages.calculator.conversion}</small>
        <dl>
          <div><dt>{messages.calculator.requiredTurnover}</dt><dd>{euros(values.turnover, locale)}</dd></div>
          <div><dt>{messages.calculator.effectiveTurnover}</dt><dd>{euros(values.effectiveTurnover, locale)}</dd></div>
          <div><dt>{messages.calculator.expectedCost}</dt><dd className={styles.cost}>≈ {euros(values.expectedCost, locale)}</dd></div>
          <div><dt>{messages.calculator.expectedValue}</dt><dd className={values.netValue < 0 ? styles.negative : styles.positive}>{values.netValue < 0 ? "−" : "+"}{euros(Math.abs(values.netValue), locale)}</dd></div>
        </dl>
        <p>{values.netValue < 0 ? messages.calculator.negative : messages.calculator.positive}</p>
        <span>{messages.calculator.caveat}</span>
      </output>
    </div>
  </section>;
}
