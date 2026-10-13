"use client";

import { useEffect, useState } from "react";

import styles from "./Innan.module.css";
import type { InnanMessages } from "@/lib/i18n/static-pages/innan";

const RULE_KEY = "b4g_innan_rule";
const OPENS_KEY = "b4g_innan_opens";

type Rule = Readonly<{ amount: string; time: string; person: string }>;

function isoWeek(date: Date) {
  const utc = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  return `${utc.getUTCFullYear()}-W${Math.ceil(((utc.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7)}`;
}

function readRule(): Rule | null {
  try {
    const raw = window.localStorage.getItem(RULE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Rule>;
    return parsed.amount && parsed.time && parsed.person ? { amount: parsed.amount, time: parsed.time, person: parsed.person } : null;
  } catch {
    return null;
  }
}

/** Counts this week's openings in this browser; an opening is one page load with a saved rule. */
function countOpening(): number {
  try {
    const week = isoWeek(new Date());
    const raw = window.localStorage.getItem(OPENS_KEY);
    const parsed = raw ? (JSON.parse(raw) as { week?: string; count?: number }) : {};
    const count = parsed.week === week ? (parsed.count ?? 0) + 1 : 1;
    window.localStorage.setItem(OPENS_KEY, JSON.stringify({ week, count }));
    return count;
  } catch {
    return 0;
  }
}

/**
 * The rule before the app: three lines the person wrote, shown big, with this week's count and a
 * single way out, back. No link leaves this page. Everything stays in this browser's storage.
 */
export function InnanTool({ messages }: { messages: InnanMessages }) {
  const [rule, setRule] = useState<Rule | null>(null);
  const [editing, setEditing] = useState(false);
  const [opens, setOpens] = useState(0);
  const [draft, setDraft] = useState<Rule>({ amount: "", time: "", person: "" });

  useEffect(() => {
    const saved = readRule();
    setRule(saved);
    if (saved) {
      setDraft(saved);
      setOpens(countOpening());
    } else {
      setEditing(true);
    }
  }, []);

  const save = () => {
    const next = { amount: draft.amount.trim(), time: draft.time.trim(), person: draft.person.trim() };
    if (!next.amount || !next.time || !next.person) return;
    try {
      window.localStorage.setItem(RULE_KEY, JSON.stringify(next));
    } catch {
      // Storage can be blocked; the rule still shows for this visit.
    }
    setRule(next);
    setEditing(false);
  };

  if (rule && !editing) return <section className={styles.screen} data-innan-screen data-nav-theme="dark">
    <span className={styles.eyebrow}>{messages.screen.eyebrow}</span>
    <ol className={styles.rule}>
      <li><small>{messages.form.amountLabel}</small><strong>{rule.amount}</strong></li>
      <li><small>{messages.form.timeLabel}</small><strong>{rule.time}</strong></li>
      <li><small>{messages.form.personLabel}</small><strong>{rule.person}</strong></li>
    </ol>
    {opens > 0 ? <p className={styles.count} data-innan-opens={opens}>{messages.screen.weekCount.replace("{n}", String(opens))}</p> : null}
    <p className={styles.nothing}>{messages.screen.nothingHere}</p>
    <div className={styles.actions}>
      <button className={styles.back} onClick={() => window.history.back()} type="button">{messages.screen.back}</button>
      <button className={styles.change} onClick={() => setEditing(true)} type="button">{messages.form.change}</button>
    </div>
  </section>;

  return <section className={styles.form} data-innan-form data-nav-theme="dark">
    <h2>{messages.form.heading}</h2>
    <form onSubmit={(event) => { event.preventDefault(); save(); }}>
      <label htmlFor="innan-amount"><span>{messages.form.amountLabel}</span><input id="innan-amount" maxLength={60} name="amount" onChange={(event) => setDraft({ ...draft, amount: event.target.value })} required type="text" value={draft.amount} /><small>{messages.form.amountHint}</small></label>
      <label htmlFor="innan-time"><span>{messages.form.timeLabel}</span><input id="innan-time" maxLength={60} name="time" onChange={(event) => setDraft({ ...draft, time: event.target.value })} required type="text" value={draft.time} /><small>{messages.form.timeHint}</small></label>
      <label htmlFor="innan-person"><span>{messages.form.personLabel}</span><input id="innan-person" maxLength={60} name="person" onChange={(event) => setDraft({ ...draft, person: event.target.value })} required type="text" value={draft.person} /><small>{messages.form.personHint}</small></label>
      <button className={styles.save} type="submit">{messages.form.save}</button>
    </form>
  </section>;
}
