import { currentProgrammeCopy, tenStepsTranslation } from "@/lib/i18n/static-pages/ten-steps";
import type { ProgrammeLocale } from "@/lib/programme/presentation";

import styles from "./ProgrammeStepsOverview.module.css";

// Positions in TEN_STEPS_SOURCE_COPY (lib/i18n/static-pages/ten-steps.ts).
const HEADING = 0;
const NEVER_USED_FOR_OFFERS = 43;
const NEVER_ASKS_TO_PLAY = 45;

/**
 * What the ten steps are, under the Programme entry screen (Founder, 2 Oct 2026). The
 * Programme renders its loading screen on the server, so search engines saw almost no text
 * on `/program` (Semrush: low word count). The copy is the 10 Steps page's own, already
 * translated in every Programme language. Shown only on the entry screens, never inside a
 * Mission or the signed-in home.
 */
export function ProgrammeStepsOverview({ locale }: { locale: ProgrammeLocale }) {
  const { text } = tenStepsTranslation(locale);
  const { overview, missions } = currentProgrammeCopy(locale);
  return (
    <section aria-labelledby="programme-steps-overview" className={styles.overview} data-nav-theme="dark" data-programme-steps-overview="">
      <div className={styles.inner}>
        <h2 id="programme-steps-overview">{text[HEADING]}</h2>
        <p className={styles.lead}>{overview}</p>
        <ol className={styles.steps}>
          {missions.map((mission, index) => (
            <li key={mission.title}>
              <span aria-hidden="true" className={styles.number}>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h3>{mission.title}</h3>
                <p>{mission.description}</p>
              </div>
            </li>
          ))}
        </ol>
        <ul className={styles.promises}>
          <li>{text[NEVER_USED_FOR_OFFERS]}</li>
          <li>{text[NEVER_ASKS_TO_PLAY]}</li>
        </ul>
      </div>
    </section>
  );
}
