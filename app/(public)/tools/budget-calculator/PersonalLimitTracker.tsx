"use client";

import Link from "next/link";
import { useRef, useState } from "react";

import { ActionButton, ActionLink } from "@/components/design-system/Action";
import styles from "./PersonalLimitTracker.module.css";

type AmountField = "cap" | "used" | "planned";
type Period = "today" | "7-days" | "30-days";
type Errors = Partial<Record<AmountField, string>>;

type Calculation = {
  cap: number;
  used: number;
  planned: number;
  remaining: number;
  usedPercentage: number;
  projectedTotal: number;
  projectedRemaining: number;
  overBy: number;
  period: Period;
};

const money = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2, maximumFractionDigits: 2 });

function parseAmount(value: string, field: AmountField): { value?: number; error?: string } {
  if (!value.trim()) {
    if (field === "planned") return { value: 0 };
    return { error: "Enter an amount." };
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return { error: "Enter a valid number." };
  if (parsed < 0) return { error: "Enter zero or a positive amount." };
  if (parsed > Number.MAX_SAFE_INTEGER) return { error: "Enter a smaller amount." };
  if (field === "cap" && parsed === 0) return { error: "Enter a limit greater than £0." };
  return { value: parsed };
}

export function PersonalLimitTracker() {
  const [values, setValues] = useState<Record<AmountField, string>>({ cap: "", used: "", planned: "" });
  const [period, setPeriod] = useState<Period>("today");
  const [errors, setErrors] = useState<Errors>({});
  const [calculation, setCalculation] = useState<Calculation | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const plannedRef = useRef<HTMLInputElement>(null);

  function update(field: AmountField, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function calculate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cap = parseAmount(values.cap, "cap");
    const used = parseAmount(values.used, "used");
    const planned = parseAmount(values.planned, "planned");
    const nextErrors: Errors = { cap: cap.error, used: used.error, planned: planned.error };
    setErrors(nextErrors);
    if (cap.error || used.error || planned.error || cap.value === undefined || used.value === undefined || planned.value === undefined) {
      setCalculation(null);
      return;
    }
    const remaining = Math.max(cap.value - used.value, 0);
    const usedPercentage = cap.value > 0 ? (used.value / cap.value) * 100 : 0;
    const projectedTotal = used.value + planned.value;
    const projectedRemaining = cap.value - projectedTotal;
    const overBy = Math.max(projectedTotal - cap.value, 0);
    setCalculation({ cap: cap.value, used: used.value, planned: planned.value, remaining, usedPercentage, projectedTotal, projectedRemaining, overBy, period });
    requestAnimationFrame(() => resultRef.current?.focus());
  }

  function reset() {
    setValues({ cap: "", used: "", planned: "" });
    setPeriod("today");
    setErrors({});
    setCalculation(null);
  }

  function editPlanned() {
    setCalculation(null);
    requestAnimationFrame(() => plannedRef.current?.focus());
  }

  if (calculation) {
    const atOrOver = calculation.used >= calculation.cap;
    const plannedOver = !atOrOver && calculation.projectedTotal > calculation.cap;
    return (
      <section className={styles.resultArea} data-limit-tracker-state={atOrOver ? "at-over" : plannedOver ? "planned-over" : "below"}>
        <div className={`${styles.resultCard} ${atOrOver || plannedOver ? styles.cautionCard : ""}`} ref={resultRef} tabIndex={-1} role="status" aria-live="polite" data-period={calculation.period}>
          {atOrOver ? <><p className={styles.resultLabel}>At / over your limit</p><h2>You have reached or exceeded the limit you set.</h2><p>SevenBet does not recommend increasing it in response to losses or continued play.</p></> : plannedOver ? <><p className={styles.resultLabel}>Planned amount exceeds your limit</p><h2>Your entries are {money.format(calculation.overBy)} above the limit you set.</h2><p>Consider not adding further gambling spend during this period.</p><p>SevenBet does not recommend increasing your limit to make the planned amount fit.</p></> : <><p className={styles.resultLabel}>Your own limit</p><h2>Remaining under the limit you entered: {money.format(calculation.remaining)}.</h2><p>You have used {Math.round(calculation.usedPercentage)}% of your own limit.</p><p>This is your limit, not a SevenBet recommendation about what is safe to gamble.</p></>}
        </div>
        <div className={styles.resultActions}>
          {atOrOver ? <ActionLink className={styles.primaryAction} href="/responsible-gambling">Protected Help / Pause options</ActionLink> : <ActionButton className={styles.primaryAction} type="button" onClick={plannedOver ? editPlanned : () => setCalculation(null)}>{plannedOver ? "Reduce planned amount" : "Adjust entries"}</ActionButton>}
          <button className={styles.secondaryAction} type="button" onClick={reset}>Reset</button>
          {!atOrOver ? <Link className={styles.helpLink} href="/responsible-gambling">Protected Help</Link> : <button className={styles.helpLink} type="button" onClick={() => setCalculation(null)}>Adjust entries</button>}
        </div>
      </section>
    );
  }

  return (
    <form className={styles.form} onSubmit={calculate} noValidate data-limit-tracker-state="form">
      <AmountInput id="limit-cap" label="Your gambling limit for this period (£)" field="cap" value={values.cap} error={errors.cap} onChange={update} />
      <AmountInput id="limit-used" label="Amount already used (£)" field="used" value={values.used} error={errors.used} onChange={update} />
      <AmountInput id="limit-planned" label="Amount you are considering next (£) · optional" field="planned" value={values.planned} error={errors.planned} onChange={update} inputRef={plannedRef} />
      <fieldset className={styles.period}>
        <legend>Period</legend>
        {([{ value: "today", label: "Today" }, { value: "7-days", label: "7 days" }, { value: "30-days", label: "30 days" }] as const).map((option) => <label key={option.value}><input type="radio" name="period" value={option.value} checked={period === option.value} onChange={() => setPeriod(option.value)} /><span>{option.label}</span></label>)}
      </fieldset>
      <ActionButton className={styles.primaryAction} type="submit">Check my limit</ActionButton>
    </form>
  );
}

function AmountInput({ id, label, field, value, error, onChange, inputRef }: { id: string; label: string; field: AmountField; value: string; error?: string; onChange: (field: AmountField, value: string) => void; inputRef?: React.RefObject<HTMLInputElement | null> }) {
  const errorId = `${id}-error`;
  return <div className={styles.field}><label htmlFor={id}>{label}</label><input ref={inputRef} id={id} name={field} type="number" min="0" step="0.01" inputMode="decimal" value={value} onChange={(event) => onChange(field, event.target.value)} aria-invalid={Boolean(error)} aria-describedby={error ? errorId : undefined} />{error ? <p className={styles.error} id={errorId}>{error}</p> : null}</div>;
}
