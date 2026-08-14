import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/seo/JsonLd";
import { absoluteUrl } from "@/lib/site";
import { SelfCheckFlow } from "./SelfCheckFlow";
import styles from "./SelfCheckPage.module.css";

const title = "Private Gambling Self-Check | B4GAMBLE";
const description = "A private, non-diagnostic reflection on recent gambling habits with neutral control and support next steps.";
const url = absoluteUrl("/self-check");

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: absoluteUrl("/self-check") },
  robots: { index: true, follow: true },
  openGraph: { type: "website", title, description, url },
  twitter: { card: "summary", title, description },
};

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: "Self-Check", item: url },
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description,
    url,
  },
];

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
      <JsonLd data={structuredData} />
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
            <p>The reflection works locally in your browser. Your answers are not posted to B4GAMBLE. Protected Help remains available without the interactive flow.</p>
            <div className={styles.noJsLinks}>
              <Link href="/help">Open Protected Help</Link>
              <Link href="/program">Review the 10-Step Programme</Link>
            </div>
            <p>B4GAMBLE&apos;s gambling comparison features are for adults aged 18+. If you are under 18 and gambling is affecting you or someone close to you, you can still open Help.</p>
          </div>
        </section>
      </noscript>

      <aside className={styles.ageBoundary}>
        <div className={styles.shell}>
          <p><strong>18+ commercial boundary.</strong> B4GAMBLE&apos;s gambling comparison features are for adults aged 18+.</p>
          <p>If you are under 18 and gambling is affecting you or someone close to you, you can still <Link href="/help">open Help</Link>.</p>
        </div>
      </aside>
    </article>
  );
}
