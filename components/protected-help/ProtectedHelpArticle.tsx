import Link from "next/link";

import type { ProtectedHelpArticle } from "@/lib/responsible-gambling";

import styles from "./ProtectedHelp.module.css";

const articlePresentation: Record<string, { title: string; answer: string; note: string }> = {
  "self-exclusion": {
    title: "Self-exclusion: what it changes.",
    answer: "It creates a barrier between you and gambling accounts.",
    note: "Confirm the current official terms, scope and commitment before registering.",
  },
  "deposit-limits": {
    title: "Deposit limits: choose before play.",
    answer: "A deposit limit caps how much can be added over a chosen period.",
    note: "Availability and change rules depend on the operator and jurisdiction. Check current official terms.",
  },
  "cooling-off": {
    title: "Cooling-off: make space.",
    answer: "It creates a temporary break before another gambling decision.",
    note: "Availability, duration and cancellation rules vary. Use only current official instructions for your location.",
  },
  "reality-checks": {
    title: "Reality checks: notice the session.",
    answer: "A reminder interrupts continuous play so you can compare the session with your plan.",
    note: "The information shown and whether play is blocked depend on the specific operator tool.",
  },
};

const coolingSections = [
  ["Notice the moment", "Use a break when a decision feels rushed, emotional or automatic."],
  ["Check official terms", "Confirm current availability and rules with the operator or regulator before relying on a tool."],
  ["Use the pause", "Review your plan, budget, time and triggers before deciding what happens next."],
] as const;

function SourceCard({ article }: { article: ProtectedHelpArticle }) {
  if (article.slug === "self-exclusion") {
    return (
      <aside className={styles.articleSource} aria-label="Official self-exclusion source">
        <div>
          <p className={styles.articleStatus}>Verified source</p>
          <h2>GAMSTOP Online</h2>
          <p>Official Great Britain online self-exclusion information. This link leaves B4GAMBLE and opens the provider&apos;s own site and privacy practices.</p>
        </div>
        <a href="https://www.gamstop.co.uk/" rel="noopener noreferrer" target="_blank">
          Review official terms <span aria-hidden="true">↗</span>
          <span className={styles.srOnly}> (opens an external site in a new tab)</span>
        </a>
      </aside>
    );
  }

  if (article.slug === "cooling-off") {
    return (
      <aside className={styles.articleSource} aria-label="Cooling-off guidance status">
        <div>
          <p className={styles.articleStatus}>Content review required</p>
          <h2>Official cooling-off guidance</h2>
          <p>Local availability claims and tool instructions remain blocked until source, location and review metadata are approved.</p>
          <dl className={styles.articleStateMatrix}>
            <div><dt>Terms unavailable</dt><dd>No verified local duration or cancellation rule is shown.</dd></div>
            <div><dt>Content blocked</dt><dd>Unsupported activation instructions remain hidden.</dd></div>
          </dl>
        </div>
        <Link href="/help">Return to Help home</Link>
      </aside>
    );
  }

  return null;
}

export function ProtectedHelpArticle({ article }: { article: ProtectedHelpArticle }) {
  const presentation = articlePresentation[article.slug] ?? {
    title: article.title,
    answer: article.takeaways[0] ?? article.summary,
    note: article.summary,
  };
  const sections = article.slug === "cooling-off"
    ? coolingSections.map(([title, body]) => ({ title, body }))
    : article.sections;

  return (
    <article
      className={styles.article}
      data-protected-help-article={article.slug}
      data-figma-desktop="599:3972"
      data-figma-mobile="600:1792"
    >
      <header className={styles.articleHero}>
        <nav aria-label="Breadcrumb" className={styles.articleBreadcrumb}>
          <Link href="/help">Help home</Link><span aria-hidden="true">/</span><span>{article.title}</span>
        </nav>
        <p className={styles.articleBadge}>Protected control article</p>
        <h1>{presentation.title}</h1>
        <p className={styles.articleIntro}>{article.summary}</p>
      </header>

      <section className={styles.directAnswer} aria-labelledby="direct-answer-title">
        <p className={styles.articleEyebrow}>Direct answer</p>
        <h2 id="direct-answer-title">{presentation.answer}</h2>
        <p>{presentation.note}</p>
      </section>

      <section className={styles.articleBody} aria-label={`${article.title} guidance`}>
        <ol className={styles.articleSections}>
          {sections.map((section, index) => (
            <li key={section.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h2>{section.title}</h2>
              <p>{section.body}</p>
            </li>
          ))}
          <li>
            <span>{String(sections.length + 1).padStart(2, "0")}</span>
            <h2>B4GAMBLE boundary</h2>
            <p>Information only. B4GAMBLE does not diagnose, provide treatment, confirm a local tool or replace current official instructions.</p>
          </li>
        </ol>
        <SourceCard article={article} />
      </section>
    </article>
  );
}

export function ProtectedHelpArticleUnavailable() {
  return (
    <section className={styles.articleUnavailable} data-protected-help-recovery="article-unavailable">
      <p className={styles.articleBadge}>Protected Help · Article unavailable</p>
      <h1>This Help article is not available.</h1>
      <p>The link may be outdated or the article may be under review. No commercial alternative is shown in this protected area.</p>
      <div>
        <Link className={styles.primaryAction} href="/help">Return to Help home</Link>
      </div>
    </section>
  );
}
