import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/seo/JsonLd";
import { absoluteUrl } from "@/lib/site";
import styles from "./ResponsibleGamblingHub.module.css";

const title = "Responsible Gambling: Education, Tools & Support | B4GAMBLE";
const description = "Find practical ways to pause, set limits, build a personal control plan and reach independent, noncommercial gambling support.";
export const metadata: Metadata = { title, description, alternates:{ canonical: absoluteUrl("/responsible-gambling") } };

const paths = [
  ["Start Programme", "Ten private missions: understand your patterns, set boundaries that fit your life, keep a plan you can review.", "/program", "Start Programme"],
  ["Learn", "Plain-language guides on limits, self-exclusion, blocking tools and what actually helps — written without alarm or judgement.", "/learn?category=responsible-gambling", "Read the guides"],
  ["Get support", "A protected space with immediate actions — pause, self-exclude, control access — and people to talk to. No commercial content inside.", "/help", "Open Help"],
] as const;

export default function ResponsibleGamblingHubPage() {
  return <article className={styles.page} data-responsible-gambling-hub>
    <JsonLd data={{"@context":"https://schema.org","@type":"WebPage",name:title,description,url:absoluteUrl("/responsible-gambling")}} />
    <header className={styles.hero}>
      <p>CONTROL &amp; SUPPORT</p>
      <h1>Take back control,<br /><em>at your pace.</em></h1>
      <span>No tests to pass, no labels, no judgement. Three ways forward — pick the one that fits today.</span>
    </header>
    <section className={styles.paths}>
      {paths.map(([titleText, body, href, action]) => <article key={titleText}>
        <h2>{titleText}</h2><p>{body}</p><Link href={href}>{action}</Link>
      </article>)}
    </section>
    <section className={styles.evidence}>
      <div><p>EVIDENCE &amp; LIMITS</p><h2>Built from evidence.<br /><em>Honest about its limits.</em></h2><Link href="/10-steps">See the ten-step outline</Link></div>
      <div><p>B4GAMBLE uses public NHS and NICE guidance to shape recognition language and Programme risk boundaries. The complete Programme has not yet been clinically evaluated.</p>
        <dl><div><dt>NHS</dt><dd>Used to shape the self-recognition language.</dd></div><div><dt>NICE NG248</dt><dd>A source for bounded Programme language and risk controls.</dd></div><div><dt>10-step Programme</dt><dd>One approved path, with Reviews at meaningful checkpoints.</dd></div><div><dt>Clinical status</dt><dd>The complete Programme has not yet been clinically evaluated.</dd></div></dl>
      </div>
    </section>
  </article>;
}
