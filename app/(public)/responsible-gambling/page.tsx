import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/seo/JsonLd";
import { absoluteUrl } from "@/lib/site";
import styles from "./ResponsibleGamblingHub.module.css";

const title = "Responsible Gambling: Education, Tools & Support | B4GAMBLE";
const description =
  "Explore responsible gambling education, a private Self-Check, your own limit tracker, the 10-step control plan and noncommercial Help.";

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
    href: "/learn/responsible-gambling",
    action: "Browse education",
  },
  {
    number: "02",
    eyebrow: "Reflect",
    title: "Take a private Self-Check",
    description: "Review recent situations without an account. Answers stay in the current browser session.",
    href: "/self-check",
    action: "Open Self-Check",
  },
  {
    number: "03",
    eyebrow: "Track",
    title: "Check your own limit",
    description: "Compare amounts with a gambling limit you choose. B4GAMBLE does not calculate a safe or affordable amount.",
    href: "/tools/budget-calculator",
    action: "Open limit tracker",
  },
  {
    number: "04",
    eyebrow: "Plan",
    title: "Build a 10-step control plan",
    description: "Work through practical decisions and personal boundaries at your own pace.",
    href: "/10-steps",
    action: "Explore 10 Steps",
  },
  {
    number: "05",
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
            <h1>Know your options before you decide.</h1>
          </div>
          <div className={styles.heroCopy}>
            <p>Choose the next step that fits what you need now. Reading, reflecting, tracking, planning and asking for help are separate options—not a score or a prescribed journey.</p>
            <ul aria-label="Responsible Gambling boundaries">
              <li>Private tools stay browser-local</li>
              <li>No diagnosis or affordability decision</li>
              <li>Help stays free of commercial prompts</li>
            </ul>
          </div>
        </div>
      </header>

      <section className={styles.paths} aria-labelledby="responsible-paths-title">
        <header className={styles.sectionHeader}>
          <p className={styles.kicker}>Choose by need</p>
          <h2 id="responsible-paths-title">Five clear paths.</h2>
          <p>Each path stands on its own. You can leave, return or choose another without completing the others.</p>
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
        <p className={styles.kicker}>A boundary worth keeping</p>
        <h2 id="responsible-boundary-title">You choose the limit. B4GAMBLE does not label an amount safe.</h2>
        <p>Tools and education can help you organise information and reflect on your own decisions. They do not diagnose a condition, assess what you can afford or guarantee that gambling is safe.</p>
      </aside>
    </article>
  );
}
