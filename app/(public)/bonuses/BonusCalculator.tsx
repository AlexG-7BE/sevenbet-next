"use client";

import { useMemo, useState } from "react";

import styles from "./BonusesFinal.module.css";

const gameWeights = [
  { label: "Slots · 100%", value: 1 },
  { label: "Table · 50%", value: 0.5 },
  { label: "Roulette · 20%", value: 0.2 },
  { label: "Blackjack · 10%", value: 0.1 },
];

function euros(value: number) {
  return new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0, style: "currency", currency: "EUR" }).format(value).replace("€", "€");
}

export function BonusCalculator() {
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
        <small>What a bonus really costs</small>
        <h2 id="bonus-calculator-title">Run the numbers <em>before you claim.</em></h2>
        <p>Enter the offer as advertised. We convert it into required turnover and the statistically expected cost of clearing it.</p>

        <label className={styles.amountField}><span>Bonus amount, €</span><input aria-label="Bonus amount" inputMode="numeric" min="0" onChange={(event) => setAmount(Math.max(0, Number(event.target.value) || 0))} type="number" value={amount} /></label>
        <label className={styles.wageringField}><span>Wagering — {wagering}x</span><input aria-label="Wagering multiplier" max="60" min="1" onChange={(event) => setWagering(Number(event.target.value))} type="range" value={wagering} /></label>

        <fieldset><legend>Wagering applies to</legend><div className={styles.segmented}>
          <label className={appliesTo === "bonus" ? styles.selected : ""}><input checked={appliesTo === "bonus"} name="applies-to" onChange={() => setAppliesTo("bonus")} type="radio" />Bonus only</label>
          <label className={appliesTo === "deposit-bonus" ? styles.selected : ""}><input checked={appliesTo === "deposit-bonus"} name="applies-to" onChange={() => setAppliesTo("deposit-bonus")} type="radio" />Deposit + bonus</label>
        </div></fieldset>

        <fieldset><legend>Your game counts at</legend><div className={styles.gameWeights}>
          {gameWeights.map((game) => <label className={weight === game.value ? styles.selected : ""} key={game.value}><input checked={weight === game.value} name="game-weight" onChange={() => setWeight(game.value)} type="radio" />{game.label}</label>)}
        </div></fieldset>
      </div>

      <output aria-live="polite" className={styles.calculatorOutput}>
        <small>The conversion</small>
        <dl>
          <div><dt>Required turnover</dt><dd>{euros(values.turnover)}</dd></div>
          <div><dt>Effective at your weighting</dt><dd>{euros(values.effectiveTurnover)}</dd></div>
          <div><dt>Expected cost of clearing <span>at 96% RTP slots</span></dt><dd className={styles.cost}>≈ {euros(values.expectedCost)}</dd></div>
          <div><dt>Expected net value</dt><dd className={values.netValue < 0 ? styles.negative : styles.positive}>{values.netValue < 0 ? "−" : "+"}{euros(Math.abs(values.netValue))}</dd></div>
        </dl>
        <p>{values.netValue < 0 ? "Clearing this offer is expected to cost more than the bonus is worth. The deposit you keep beats the bonus you chase." : "On these inputs, the headline bonus is larger than the statistically expected clearing cost."}</p>
        <span>Statistical expectation, not a prediction. Variance is large; the house edge is not.</span>
      </output>
    </div>
  </section>;
}
