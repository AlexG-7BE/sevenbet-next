import type { Metadata } from "next";
import Link from "next/link";

import { absoluteUrl } from "@/lib/site";
import { SelfCheckFlow } from "./SelfCheckFlow";
import styles from "./SelfCheckPage.module.css";

export const metadata: Metadata = {
  title: "Private Gambling Self-Check | SevenBet",
  description: "A private, non-diagnostic reflection on recent gambling habits with neutral control and support next steps.",
  alternates: { canonical: absoluteUrl("/self-check") },
};

export default function SelfCheckPage() {
  return (
    <article
      className={styles.page}
      data-self-check-page
      data-figma-family="924:3238"
      data-figma-intro="924:3240"
      data-figma-question="924:3268"
      data-figma-results="924:3300,924:3329,924:3358"
    >
      <section className={styles.intro} data-self-check-intro aria-labelledby="self-check-title">
        <div className={styles.shell}>
          <p className={styles.eyebrow}>Private by default</p>
          <h1 id="self-check-title">Self-Check:<br />A private gambling reflection</h1>
          <p className={styles.lead}>A short private reflection on recent gambling habits. It is not a diagnosis and does not decide whether gambling is safe for you.</p>
          <aside className={styles.privacyPanel} aria-label="Self-Check privacy boundary">
            <strong>Answers stay in this browser session.</strong>
            <span>They are not added to your casino profile.</span>
            <span>They are not used to rank operators or personalise offers.</span>
          </aside>
          <SelfCheckFlow />
        </div>
      </section>

      <noscript>
        <section className={styles.noJs} data-self-check-nojs aria-labelledby="self-check-nojs-title">
          <div className={styles.shell}>
            <p className={styles.eyebrow}>Private by default</p>
            <h2 id="self-check-nojs-title">Self-Check needs JavaScript.</h2>
            <p>The reflection works locally in your browser. Your answers are not posted to SevenBet. Protected Help remains available without the interactive flow.</p>
            <div className={styles.noJsLinks}>
              <Link href="/responsible-gambling">Open Protected Help</Link>
              <Link href="/program">Review the 10-Step Programme</Link>
            </div>
            <p>SevenBet&apos;s gambling comparison features are for adults aged 18+. If you are under 18 and gambling is affecting you or someone close to you, you can still open Help.</p>
          </div>
        </section>
      </noscript>

      <aside className={styles.ageBoundary}>
        <div className={styles.shell}>
          <p><strong>18+ commercial boundary.</strong> SevenBet&apos;s gambling comparison features are for adults aged 18+.</p>
          <p>If you are under 18 and gambling is affecting you or someone close to you, you can still <Link href="/responsible-gambling">open Help</Link>.</p>
        </div>
      </aside>
    </article>
  );
}
