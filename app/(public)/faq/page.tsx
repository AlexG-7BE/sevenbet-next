import type { Metadata } from "next";
import { Instrument_Serif } from "next/font/google";
import Link from "next/link";

import { absoluteUrl } from "@/lib/site";

import styles from "./FAQPage.module.css";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["italic"],
  variable: "--font-seven-serif",
});

export const metadata: Metadata = {
  title: "SevenBet FAQ | Product, Programme, Privacy and Commercial Boundaries",
  description: "Clear answers about what SevenBet is, how its Programme and private tools work, and how editorial, affiliate, privacy and Protected Help boundaries are kept visible.",
  alternates: { canonical: absoluteUrl("/faq") },
  robots: { index: true, follow: true },
};

const groups = [
  {
    eyebrow: "01 · About the product",
    title: "What SevenBet is — and is not.",
    items: [
      ["What is SevenBet?", "SevenBet is an editorial, educational, comparison and affiliate information service. It is not a gambling operator."],
      ["Is SevenBet an online casino?", "No. SevenBet does not accept wagers or deposits, hold gambling balances, determine outcomes or pay winnings."],
      ["Who are SevenBet’s commercial features for?", "Commercial casino, offer and affiliate features are for adults aged 18 or over, and only where lawful. A visible action is not proof of personal eligibility."],
    ],
  },
  {
    eyebrow: "02 · Programme & private tools",
    title: "Control tools stay separate.",
    items: [
      ["What is the 10-Step Programme?", "It is an educational and control-oriented sequence for reflection, learning and a personal plan. It is not treatment, and it does not reward gambling, deposits or commercial clicks."],
      ["Does Self-Check diagnose gambling addiction?", "No. Self-Check is a private, non-clinical reflection. Its answers stay local to the browser session and do not drive casino or bonus recommendations."],
      ["Does the Personal Gambling Limit Tracker tell me what is safe to spend?", "No. It uses a limit chosen by you. SevenBet does not calculate a safe or affordable gambling amount and does not generate a stop-loss recommendation."],
    ],
  },
  {
    eyebrow: "03 · Casinos, offers & money",
    title: "Commercial without the spin.",
    items: [
      ["How does SevenBet decide which casinos appear?", "SevenBet uses the latest published evidence available to the public service and keeps missing or unverified facts visible. Commercial availability and editorial review remain separate."],
      ["Are the biggest bonuses automatically ranked first?", "No. Headline size does not override eligibility, material terms, evidence quality or the published editorial method."],
      ["Can bonus or operator terms change?", "Yes. Current operator terms control the gambling transaction or promotion. SevenBet should show uncertainty or remove an action when material facts cannot be verified."],
    ],
  },
  {
    eyebrow: "04 · Affiliate & editorial",
    title: "Paid relationships. Visible boundaries.",
    items: [
      ["Does SevenBet earn affiliate commission?", "It may. When an affiliate link leads to a qualifying action, SevenBet may receive commission. Commercial relationships must not alter factual licensing status, material terms, Protected Help or private control data."],
      ["Can commission personalise my ranking after Self-Check?", "No. Self-Check, Programme, pause and Protected Help information must not be used to personalise casino rankings, offers or affiliate targeting."],
      ["What happens when an operator or outbound action is unavailable?", "The action fails closed. SevenBet does not invent a destination, claim a redirect succeeded or substitute another operator, bonus or sponsored offer."],
    ],
  },
  {
    eyebrow: "05 · Privacy & Help",
    title: "Private means non-commercial.",
    items: [
      ["How are Self-Check and Limit Tracker entries stored?", "The current Self-Check and Personal Gambling Limit Tracker process entries locally in the browser. Individual answers and entered amounts are not stored in SevenBet’s application database."],
      ["Where can I get help with gambling?", "Protected Help provides independent support routes and safer-gambling information. It remains separate from casino, bonus and affiliate actions."],
    ],
  },
] as const;

const initiallyOpen = new Set([
  "What is SevenBet?",
  "Does Self-Check diagnose gambling addiction?",
  "Can bonus or operator terms change?",
  "Does SevenBet earn affiliate commission?",
  "Where can I get help with gambling?",
]);

export default function FAQPage() {
  return (
    <div
      className={`${styles.page} ${instrumentSerif.variable}`}
      data-faq-page
      data-figma-desktop="929:3021"
      data-figma-mobile="929:3148"
    >
      <section className={styles.hero} aria-labelledby="faq-title">
        <div className={styles.heroCopy}>
          <p className={styles.heroEyebrow}>SevenBet FAQ · Product / Trust</p>
          <h1 id="faq-title">Questions?</h1>
          <p className={styles.heroSerif}>Clear answers.</p>
          <p className={styles.heroLead}>How SevenBet works, what it does not do, how commercial relationships are handled, and where private control tools stay separate.</p>
        </div>
        <aside className={styles.heroBoundary} aria-label="SevenBet service boundary">
          <p>Start with the boundary</p>
          <strong>SevenBet informs.<br />Operators provide gambling.</strong>
          <span>SevenBet does not accept wagers, deposits or gambling balances.</span>
        </aside>
      </section>

      <div className={styles.questions}>
        {groups.map((group) => (
          <section className={styles.group} key={group.eyebrow}>
            <header>
              <p>{group.eyebrow}</p>
              <h2>{group.title}</h2>
            </header>
            <div className={styles.disclosures}>
              {group.items.map(([question, answer]) => (
                <details key={question} open={initiallyOpen.has(question)}>
                  <summary><span>{question}</span><span aria-hidden="true" className={styles.toggle}>+</span></summary>
                  <p>{answer}</p>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>

      <aside className={styles.helpBoundary} aria-label="Protected Help">
        <div>
          <p>Protected Help</p>
          <h2>Need support, not an offer?</h2>
          <span>Open Protected Help for independent support routes and control information. No casino or bonus recovery belongs in this path.</span>
        </div>
        <Link href="/responsible-gambling">Open Protected Help <span aria-hidden="true">→</span></Link>
      </aside>
    </div>
  );
}
