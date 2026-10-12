"use client";

import { useEffect, useMemo, useState } from "react";

import styles from "./PausePlan.module.css";
import type { PausePlanDay, PausePlanRegisterMessages, PausePlanToolMessages } from "@/lib/i18n/static-pages/pause-plan";
import { PAUSE_UNTIL_COOKIE, RESEARCH_ACCESS_CHANGED_EVENT, pauseUntil } from "@/lib/research-access";
import { PAUSE_PERIODS, dayAfter, parseIsoDate, pauseEndDate, pausePeriod, planDates, toIsoDate, type PauseRegister } from "@/lib/tools/pause-plan";

const PAUSE_COOKIE_MAX_AGE_SECONDS = 400 * 24 * 60 * 60;

type Registers = Readonly<Partial<Record<PauseRegister, PausePlanRegisterMessages>>>;

function writePauseCookie(until: string | null) {
  const secure = window.location.protocol === "https:" ? "; secure" : "";
  document.cookie = until
    ? `${PAUSE_UNTIL_COOKIE}=${until}; path=/; max-age=${PAUSE_COOKIE_MAX_AGE_SECONDS}; samesite=lax${secure}`
    : `${PAUSE_UNTIL_COOKIE}=; path=/; max-age=0; samesite=lax${secure}`;
  window.dispatchEvent(new Event(RESEARCH_ACCESS_CHANGED_EVENT));
}

/**
 * The visitor names the day the pause started and its length; the tool shows the last day of
 * the pause, the day after, and the ten plan days with their dates. "Show my plan" writes the
 * pause's last day into a plain cookie that only the menu door reads (lib/research-access.ts),
 * so no casino link appears for this browser until the day after. Nothing is sent to a server.
 */
export function PausePlanTool({ days, locale, messages, register, registers }: {
  days: readonly PausePlanDay[];
  locale: string;
  messages: PausePlanToolMessages;
  register: PauseRegister | "both";
  registers: Registers;
}) {
  const available = (Object.keys(registers) as PauseRegister[]).filter((key) => registers[key]);
  const [chosenRegister, setChosenRegister] = useState<PauseRegister>(register === "both" ? available[0] ?? "spelpaus" : register);
  const periods = PAUSE_PERIODS[chosenRegister];
  const [periodId, setPeriodId] = useState(periods[0]?.id ?? "");
  const [startText, setStartText] = useState("");
  const [saved, setSaved] = useState<string | null>(null);

  // The date input starts at today and the cookie's own date is shown back after a reload.
  useEffect(() => {
    setStartText((current) => current || toIsoDate(new Date()));
    setSaved(pauseUntil(document.cookie));
  }, []);

  const period = pausePeriod(chosenRegister, periodId) ?? periods[0];
  const start = parseIsoDate(startText);
  const result = useMemo(() => {
    if (!start || !period) return null;
    const end = pauseEndDate(start, period);
    return { end, after: dayAfter(end), plan: planDates(start) };
  }, [start, period]);
  const longDate = useMemo(() => new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric" }), [locale]);
  const shortDate = useMemo(() => new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }), [locale]);
  const registerMessages = registers[chosenRegister];

  const choosePeriodsFor = (next: PauseRegister) => {
    setChosenRegister(next);
    setPeriodId(PAUSE_PERIODS[next][0]?.id ?? "");
  };

  return <section aria-label={messages.heading} className={styles.tool} data-nav-theme="dark" data-pause-plan-tool>
    <div>
      <form className={styles.form} onSubmit={(event) => {
        event.preventDefault();
        if (!result) return;
        const until = toIsoDate(result.end);
        writePauseCookie(until);
        setSaved(until);
      }}>
        <h2>{messages.heading}</h2>
        {register === "both" && available.length > 1
          ? <fieldset><legend>{messages.registerLabel}</legend><div className={styles.segmented}>
            {available.map((key) => <label className={key === chosenRegister ? styles.selected : ""} key={key}>
              <input checked={key === chosenRegister} name="pause-register" onChange={() => choosePeriodsFor(key)} type="radio" value={key} />
              {registers[key]?.name}
            </label>)}
          </div></fieldset>
          : null}
        <label className={styles.field} htmlFor="pause-start"><span>{messages.startLabel}</span>
          <input id="pause-start" max="2099-12-31" min="2019-01-01" name="pause-start" onChange={(event) => setStartText(event.target.value)} required type="date" value={startText} />
          <small>{messages.startHint}</small>
        </label>
        <label className={styles.field} htmlFor="pause-period"><span>{messages.periodLabel}</span>
          <select id="pause-period" name="pause-period" onChange={(event) => setPeriodId(event.target.value)} value={periodId}>
            {periods.map((option) => <option key={option.id} value={option.id}>{registerMessages?.periods[option.id] ?? option.id}</option>)}
          </select>
        </label>
        {period?.openEnded ? <p className={styles.note}>{messages.openEndedNote}</p> : null}
        <button className={styles.submit} disabled={!result} type="submit">{messages.submit}</button>
        <p className={styles.note}>{messages.noOffers}</p>
        {saved
          ? <p className={styles.saved} data-pause-plan-saved={saved}>
            {messages.saved}{" "}
            <button className={styles.reset} onClick={() => { writePauseCookie(null); setSaved(null); }} type="button">{messages.reset}</button>
          </p>
          : null}
      </form>

      <div className={styles.result}>
        <dl>
          <div><dt>{messages.endsLabel}</dt><dd data-pause-plan-end={result ? toIsoDate(result.end) : ""}>{result ? longDate.format(result.end) : "—"}</dd></div>
          <div><dt>{messages.dayAfterLabel}</dt><dd className={styles.after} data-pause-plan-after={result ? toIsoDate(result.after) : ""}>{result ? longDate.format(result.after) : "—"}</dd></div>
        </dl>
        {registerMessages ? <p className={styles.note}>{registerMessages.whatHappens}</p> : null}
      </div>
    </div>

    <div className={styles.plan}>
      <h2>{messages.planHeading}</h2>
      <p>{messages.planIntro}</p>
      <ol className={styles.days}>
        {days.map((day, index) => <li key={day.title}>
          <span className={styles.dayBadge}>{messages.dayLabel} {index + 1}</span>
          <span className={styles.dayDate}>{result ? shortDate.format(result.plan[index]) : `${messages.stepLabel} ${index + 1}`}</span>
          <strong>{day.title}</strong>
          <p>{day.move}</p>
        </li>)}
      </ol>
    </div>
  </section>;
}
