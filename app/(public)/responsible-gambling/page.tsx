import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/seo/JsonLd";
import { absoluteUrl } from "@/lib/site";
import styles from "./ResponsibleGamblingHub.module.css";

const title = "Responsible Gambling: Education, Tools & Support | B4GAMBLE";
const description =
  "Find practical ways to pause, set limits, build a personal control plan and reach independent, noncommercial gambling support.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: absoluteUrl("/responsible-gambling") },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    title,
    description,
    url: absoluteUrl("/responsible-gambling"),
  },
  twitter: { card: "summary", title, description },
};

const paths = [
  {
    number: "01",
    eyebrow: "Understand",
    title: "Learn how control tools work",
    description: "Read plain-language guides about limits, breaks, self-exclusion and common gambling patterns.",
    href: "/learn?category=responsible-gambling",
    action: "Browse education",
  },
  {
    number: "02",
    eyebrow: "Plan",
    title: "Build a 10-step control plan",
    description: "Work through practical decisions and personal boundaries at your own pace.",
    href: "/10-steps",
    action: "Explore 10 Steps",
  },
  {
    number: "03",
    eyebrow: "Support",
    title: "Pause and open Help",
    description: "Find pause, blocking and independent-support options without casino, bonus or affiliate prompts.",
    href: "/help",
    action: "Open Help",
    help: true,
  },
] as const;

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
    { "@type": "ListItem", position: 2, name: "Responsible Gambling", item: absoluteUrl("/responsible-gambling") },
  ],
};

const webPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: title,
  description,
  url: absoluteUrl("/responsible-gambling"),
  isPartOf: { "@type": "WebSite", name: "B4GAMBLE", url: absoluteUrl("/") },
};

export default function ResponsibleGamblingHubPage() {
  return (
    <article className={styles.page} data-responsible-gambling-hub>
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={webPageSchema} />

      <header className={styles.hero}>
        <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
          <Link href="/">Home</Link><span aria-hidden="true">/</span><span aria-current="page">Responsible Gambling</span>
        </nav>
        <div className={styles.heroGrid}>
          <div>
            <p className={styles.kicker}>Control &amp; support</p>
            <h1>Take back control,<br />at your pace.</h1>
          </div>
          <div className={styles.heroCopy}>
            <p>If gambling is taking more time, money or attention than you want, start with the next useful action. No judgement. No prescribed journey.</p>
            <ul aria-label="Responsible Gambling boundaries">
              <li>Practical actions, not a diagnosis</li>
              <li>No diagnosis or affordability decision</li>
              <li>Help stays free of commercial prompts</li>
            </ul>
          </div>
        </div>
      </header>

      <section className={styles.paths} aria-labelledby="responsible-paths-title">
        <header className={styles.sectionHeader}>
          <p className={styles.kicker}>Choose by need</p>
          <h2 id="responsible-paths-title">Choose what helps now.</h2>
          <p>Learn, make a plan, or go straight to support. Each path stands on its own.</p>
        </header>
        <ol className={styles.pathGrid}>
          {paths.map((path) => (
            <li className={"help" in path && path.help ? styles.helpCard : undefined} key={path.number}>
              <Link href={path.href}>
                <span className={styles.cardTopline}><span>{path.number}</span><span>{path.eyebrow}</span></span>
                <strong>{path.title}</strong>
                <span className={styles.cardDescription}>{path.description}</span>
                <span className={styles.cardAction}>{path.action}<span aria-hidden="true">↗</span></span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <aside className={styles.boundary} aria-labelledby="responsible-boundary-title">
        <p className={styles.kicker}>EVIDENCE &amp; LIMITS</p>
        <h2 id="responsible-boundary-title">Built from evidence.<br />Honest about its limits.</h2>
        <p>Education and practical controls can help you organise information and reflect on your decisions. They do not diagnose a condition, assess what you can afford or guarantee that gambling is safe.</p>
      </aside>
    </article>
  );
}
