"use client";

import { useEffect, useMemo, useState } from "react";

import styles from "./PausePlan.module.css";
import type { PausePlanDay, PausePlanMessages, PausePlanRegisterMessages, PausePlanToolMessages } from "@/lib/i18n/static-pages/pause-plan";
import {
  CLEAN_ROUTE_COOKIE,
  CLEAN_ROUTE_OPEN,
  PAUSE_UNTIL_COOKIE,
  RESEARCH_ACCESS_CHANGED_EVENT,
  cleanRouteDeclared,
  pauseUntil,
} from "@/lib/research-access";
import { PAUSE_PERIODS, dayAfter, parseIsoDate, pauseEndDate, pausePeriod, planDates, toIsoDate, type PauseRegister } from "@/lib/tools/pause-plan";

const COOKIE_MAX_AGE_SECONDS = 400 * 24 * 60 * 60;

type Registers = Readonly<Partial<Record<PauseRegister, PausePlanRegisterMessages>>>;

function writeCookie(name: string, value: string | null) {
  const secure = window.location.protocol === "https:" ? "; secure" : "";
  document.cookie = value === null
    ? `${name}=; path=/; max-age=0; samesite=lax${secure}`
    : `${name}=${value}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; samesite=lax${secure}`;
}

function announceDoor() {
  window.dispatchEvent(new Event(RESEARCH_ACCESS_CHANGED_EVENT));
}

/** A one-day all-day event for the day after, as a file the person keeps; nothing is sent. */
function calendarFile(date: Date, title: string, description: string) {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const day = toIsoDate(date).replace(/-/g, "");
  const escape = (value: string) => value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
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
 * the pause, the day after, and the ten plan days with their dates. "Show my plan" writes the
 * pause's last day into a plain cookie that only the menu door reads (lib/research-access.ts):
 * no casino link appears for this browser while the cookie exists. Nothing opens by itself on
 * day 11 (the clean route, 13 October 2026): after the last day the page offers one button that
 * opens the door, and removing a running pause leaves the door shut. Nothing is sent anywhere.
 */
export function PausePlanTool({ days, door, ics, locale, messages, register, registers }: {
  days: readonly PausePlanDay[];
  door: PausePlanMessages["door"];
  ics: PausePlanMessages["ics"];
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
  const [routeClosed, setRouteClosed] = useState(false);
  const [doorNote, setDoorNote] = useState<string | null>(null);
  const [today, setToday] = useState("");

  // The date input starts at today, and the cookies' own state is shown back after a reload.
  useEffect(() => {
    const now = toIsoDate(new Date());
    setToday(now);
    setStartText((current) => current || now);
    setSaved(pauseUntil(document.cookie));
    setRouteClosed(cleanRouteDeclared(document.cookie));
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
  const pauseOver = saved !== null && today !== "" && today > saved;

  const choosePeriodsFor = (next: PauseRegister) => {
    setChosenRegister(next);
    setPeriodId(PAUSE_PERIODS[next][0]?.id ?? "");
  };

  const declarePause = () => {
    if (!result) return;
    const until = toIsoDate(result.end);
    writeCookie(PAUSE_UNTIL_COOKIE, until);
    announceDoor();
    setSaved(until);
    setDoorNote(null);
  };

  // Removing a running pause is the person's choice about their own data; the door stays shut.
  const removePause = () => {
    writeCookie(PAUSE_UNTIL_COOKIE, null);
    writeCookie(CLEAN_ROUTE_COOKIE, CLEAN_ROUTE_OPEN);
    announceDoor();
    setSaved(null);
    setRouteClosed(true);
    setDoorNote(door.removeNote);
  };

  // The one action that opens the door: offered after the pause's last day, or when no pause is declared.
  const openDoor = () => {
    writeCookie(PAUSE_UNTIL_COOKIE, null);
    writeCookie(CLEAN_ROUTE_COOKIE, null);
    announceDoor();
    setSaved(null);
    setRouteClosed(false);
    setDoorNote(door.opened);
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
      <form className={styles.form} onSubmit={(event) => { event.preventDefault(); declarePause(); }}>
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
        <div className={styles.buttons}>
          <button className={styles.submit} disabled={!result} type="submit">{messages.submit}</button>
          <button className={styles.secondary} disabled={!result} onClick={downloadCalendar} type="button">{ics.download}</button>
        </div>
        <p className={styles.note}>{messages.noOffers}</p>
        {saved && !pauseOver
          ? <p className={styles.saved} data-pause-plan-saved={saved}>
            {messages.saved}{" "}
            <button className={styles.reset} onClick={removePause} type="button">{messages.reset}</button>
          </p>
          : null}
        {doorNote ? <p className={styles.saved} data-pause-plan-door-note>{doorNote}</p> : null}
      </form>

      <div className={styles.result}>
        <dl>
          <div><dt>{messages.endsLabel}</dt><dd data-pause-plan-end={result ? toIsoDate(result.end) : ""}>{result ? longDate.format(result.end) : "—"}</dd></div>
          <div><dt>{messages.dayAfterLabel}</dt><dd className={styles.after} data-pause-plan-after={result ? toIsoDate(result.after) : ""}>{result ? longDate.format(result.after) : "—"}</dd></div>
        </dl>
        {registerMessages ? <p className={styles.note}>{registerMessages.whatHappens}</p> : null}
        {pauseOver
          ? <div className={styles.doorBlock} data-pause-plan-door="after">
            <h3>{door.afterHeading}</h3>
            <p>{door.afterBody}</p>
            <button className={styles.submit} onClick={openDoor} type="button">{door.open}</button>
          </div>
          : null}
        {!saved && routeClosed && !doorNote
          ? <div className={styles.doorBlock} data-pause-plan-door="route">
            <p>{door.closedNote}</p>
            <button className={styles.secondary} onClick={openDoor} type="button">{door.open}</button>
          </div>
          : null}
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
