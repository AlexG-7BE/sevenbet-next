"use client";

import { useEffect, useState, type FormEvent } from "react";

import styles from "./PausePlan.module.css";
import type { PausePlanReminderMessages } from "@/lib/i18n/static-pages/pause-plan";
import { carriedPauseDateCookie, type CarriedPauseRegister } from "@/lib/tools/pause-date-carry";

/**
 * What the tool keeps, and only while the pause letters are switched on (Founder decisions,
 * 13 October 2026; docs/07_Decisions/PAUSE-LETTERS-2026-10-14.md):
 *
 * - When the person presses the Programme button on this page after choosing their dates, the
 *   register and the last pause day stay in a one-hour first-party cookie, so the account they
 *   create can be written to the evening before the pause ends and the morning it is over.
 * - A person without an account can leave an address under the result. The one line above the
 *   button says what is sent and when; nothing else asks again.
 *
 * Both are for the timing of those letters and for nothing else. An open-ended pause has no end
 * day, so it carries nothing and shows no field.
 */
export function PausePlanLetters({ endsOn, locale, messages, register, touched }: {
  /** The last day the pause covers, or null for an open-ended pause or an unreadable date. */
  endsOn: string | null;
  locale: string;
  messages: PausePlanReminderMessages;
  register: CarriedPauseRegister;
  /** True once the person has changed a date, a period or the register. */
  touched: boolean;
}) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  useEffect(() => {
    const carry = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest("a[data-pause-plan-start]") : null;
      // Dates the person never touched are the tool's defaults, not their pause.
      if (!target || !touched) return;
      document.cookie = carriedPauseDateCookie(endsOn ? { register, endsOn } : null, window.location.protocol === "https:");
    };
    document.addEventListener("click", carry, true);
    return () => document.removeEventListener("click", carry, true);
  }, [endsOn, register, touched]);

  // A new date is a new request.
  useEffect(() => { setState("idle"); }, [endsOn, register]);

  if (!endsOn) return null;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (state === "sending") return;
    setState("sending");
    try {
      const response = await fetch("/api/public/pause-reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, register, endsOn, locale }),
      });
      setState(response.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  };

  return <form className={styles.reminder} data-pause-plan-reminder onSubmit={submit}>
    <label className={styles.field} htmlFor="pause-reminder-email"><span>{messages.label}</span>
      <input autoComplete="email" disabled={state === "done"} id="pause-reminder-email" inputMode="email" maxLength={320} name="email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
    </label>
    <p className={styles.note}>{messages.consent}</p>
    <button className={styles.calendar} disabled={state === "sending" || state === "done"} type="submit">{messages.submit}</button>
    <p aria-live="polite" className={styles.note} role="status">{state === "done" ? messages.done : state === "error" ? messages.error : ""}</p>
  </form>;
}
