"use client";

import { useEffect, useMemo, useState } from "react";

import { PausePlanLetters } from "./PausePlanLetters";
import styles from "./PausePlan.module.css";
import type { PausePlanDay, PausePlanMessages, PausePlanRegisterMessages, PausePlanToolMessages } from "@/lib/i18n/static-pages/pause-plan";
import { PAUSE_PERIODS, dayAfter, parseIsoDate, pauseEndDate, pausePeriod, planDates, toIsoDate, type PauseRegister } from "@/lib/tools/pause-plan";

type Registers = Readonly<Partial<Record<PauseRegister, PausePlanRegisterMessages>>>;

/** A one-day all-day event for the day after, as a file the person keeps; nothing is sent. */
function calendarFile(date: Date, title: string, description: string) {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const day = toIsoDate(date).replace(/-/g, "");
  const escape = (value: string) => value.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//B4GAMBLE//pause-plan//EN",
    "BEGIN:VEVENT",
    `UID:${day}-pause-plan@b4gamble.com`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${day}`,
    `SUMMARY:${escape(title)}`,
    `DESCRIPTION:${escape(description)}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

/**
 * The visitor names the day the pause started and its length; the tool shows the last day of
 * the pause, the day after, and the ten plan days with their dates, as they type. The tool
 * itself keeps nothing: no cookie, no storage, no request (Founder, 13 October 2026: an ordinary
 * landing page). The one button saves the day after as a calendar file on the person's own
 * device.
 *
 * While the pause letters are switched on (`letters`), `PausePlanLetters` adds the two things
 * this page keeps, both for the timing of letters only: the pause date carried to the account
 * when the Programme button is pressed, and the email field under the result.
 */
export function PausePlanTool({ days, ics, letters = false, locale, messages, register, registers }: {
  days: readonly PausePlanDay[];
  ics: PausePlanMessages["ics"];
  /** The pause-letter switch, read on the server. */
  letters?: boolean;
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
  const [touched, setTouched] = useState(false);

  // The date input starts at today; the server cannot know the visitor's day.
  useEffect(() => {
    setStartText((current) => current || toIsoDate(new Date()));
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
    setTouched(true);
    setChosenRegister(next);
    setPeriodId(PAUSE_PERIODS[next][0]?.id ?? "");
  };

  const downloadCalendar = () => {
    if (!result) return;
    const blob = new Blob([calendarFile(result.after, ics.title, ics.description)], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `b4gamble-${toIsoDate(result.after)}.ics`;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return <section aria-label={messages.heading} className={styles.tool} data-nav-theme="dark" data-pause-plan-tool>
    <div>
      <form className={styles.form} onSubmit={(event) => event.preventDefault()}>
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
          <input id="pause-start" max="2099-12-31" min="2019-01-01" name="pause-start" onChange={(event) => { setTouched(true); setStartText(event.target.value); }} required type="date" value={startText} />
          <small>{messages.startHint}</small>
        </label>
        <label className={styles.field} htmlFor="pause-period"><span>{messages.periodLabel}</span>
          <select id="pause-period" name="pause-period" onChange={(event) => { setTouched(true); setPeriodId(event.target.value); }} value={periodId}>
            {periods.map((option) => <option key={option.id} value={option.id}>{registerMessages?.periods[option.id] ?? option.id}</option>)}
          </select>
        </label>
        {period?.openEnded ? <p className={styles.note}>{messages.openEndedNote}</p> : null}
        <button className={styles.calendar} disabled={!result} onClick={downloadCalendar} type="button">{ics.download}</button>
      </form>

      <div className={styles.result}>
        <dl>
          <div><dt>{messages.endsLabel}</dt><dd data-pause-plan-end={result ? toIsoDate(result.end) : ""}>{result ? longDate.format(result.end) : "—"}</dd></div>
          <div><dt>{messages.dayAfterLabel}</dt><dd className={styles.after} data-pause-plan-after={result ? toIsoDate(result.after) : ""}>{result ? longDate.format(result.after) : "—"}</dd></div>
        </dl>
        {registerMessages ? <p className={styles.note}>{registerMessages.whatHappens}</p> : null}
        {letters ? <PausePlanLetters endsOn={result && !period?.openEnded ? toIsoDate(result.end) : null} locale={locale} messages={messages.reminder} register={chosenRegister} touched={touched} /> : null}
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
