import Link from "next/link";

import styles from "./PublicShell.module.css";

export function PublicAvailabilityNotice({ state = "unknown" }: { state?: "unknown" | "unavailable" }) {
  const unavailable = state === "unavailable";
  return (
    <aside className={styles.availabilityNotice} data-state={state} aria-label={unavailable ? "Commercial listings unavailable" : "Availability not confirmed"}>
      <div>
        <strong>{unavailable ? "Commercial listings unavailable" : "Availability not confirmed"}</strong>
        <p>{unavailable
          ? "When a market cannot be supported, commercial links remain hidden. Programme, Learn and protected Help remain available."
          : "Offer links stay hidden until market eligibility can be established. Programme, Learn and Help remain available."}</p>
      </div>
      <div className={styles.availabilityActions}>
        <Link className={styles.primaryAction} href={unavailable ? "/10-steps" : "/learn"}>{unavailable ? "Open 10 Steps" : "Continue without offers"}</Link>
        <Link className={styles.availabilityHelp} href="/responsible-gambling">Protected Help</Link>
      </div>
    </aside>
  );
}
