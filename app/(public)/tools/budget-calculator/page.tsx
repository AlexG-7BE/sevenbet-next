"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatMoney } from "@/lib/data";

export default function BudgetCalculatorPage() {
  const [budget, setBudget] = useState(300);
  const [sessions, setSessions] = useState(4);
  const [ratio, setRatio] = useState(0.2);
  const result = useMemo(() => {
    const monthlyCap = Math.floor(Math.max(0, budget) * ratio);
    const stopLoss = Math.floor(monthlyCap / Math.max(1, sessions));
    return { monthlyCap, stopLoss };
  }, [budget, sessions, ratio]);

  return (
    <section className="pageShell">
      <div className="container twoCol">
        <div>
          <p className="eyebrow">Budget calculator</p>
          <h1>Set the limit before depositing, not after losing.</h1>
          <p className="lead">If there is debt, borrowed money or loss of control, the safer gambling limit for today is zero.</p>
          <div className="formPanel">
            <label>Monthly entertainment budget</label>
            <input value={budget} min={0} onChange={(event) => setBudget(Number(event.target.value))} type="number" />
            <label>Maximum gambling sessions per month</label>
            <input value={sessions} min={1} onChange={(event) => setSessions(Number(event.target.value))} type="number" />
            <label>Conservativeness</label>
            <select value={ratio} onChange={(event) => setRatio(Number(event.target.value))}>
              <option value={0.1}>Very cautious: 10%</option>
              <option value={0.2}>Cautious: 20%</option>
              <option value={0.3}>Maximum: 30%</option>
            </select>
          </div>
        </div>
        <aside className="resultPanel">
          <span className="safeBadge">Recommended</span>
          <h2>{formatMoney(result.stopLoss)} per session</h2>
          <div className="resultRows">
            <div><span>Monthly cap</span><strong>{formatMoney(result.monthlyCap)}</strong></div>
            <div><span>Stop-loss</span><strong>{formatMoney(result.stopLoss)}</strong></div>
            <div><span>Time cap</span><strong>45 min</strong></div>
          </div>
          <Link className="button gold" href="/bonuses">Review offers</Link>
        </aside>
      </div>
    </section>
  );
}
