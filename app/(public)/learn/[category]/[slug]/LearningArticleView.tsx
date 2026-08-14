import Link from "next/link";
import { CommercialAnalyticsLink } from "@/components/commercial-decision/CommercialAnalytics";

import {
  getArticlePath,
  type LearningArticle,
  type LearningAuthor,
  type LearningCategory,
} from "@/lib/learning-center";

import styles from "./article.module.css";

export function LearningArticleView({
  article,
  category,
  author,
  editor,
  relatedArticles,
}: {
  article: LearningArticle;
  category: LearningCategory;
  author: LearningAuthor;
  editor: LearningAuthor;
  relatedArticles: LearningArticle[];
}) {
  const intent = articleIntent(article.categorySlug);
  const updated = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })
    .format(new Date(`${article.lastUpdated}T00:00:00Z`));

  return (
    <article className={styles.page} data-learning-article data-figma-authority="633:4341">
      <header className={styles.hero}>
        <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
          <Link href="/">Home</Link><span aria-hidden="true">/</span>
          <Link href="/learn">Learning Center</Link><span aria-hidden="true">/</span>
          <Link href={`/learn/${category.slug}`}>{category.title}</Link>
        </nav>
        <div className={styles.heroGrid}>
          <div>
            <p className={styles.kicker}>Neutral learning article · {category.title}</p>
            <h1>{article.title}</h1>
          </div>
          <div className={styles.heroSummary}>
            <p>{article.summary}</p>
            <dl>
              <div><dt>Author</dt><dd>{author.name}</dd></div>
              <div><dt>Editor</dt><dd>{editor.name}</dd></div>
              <div><dt>Updated</dt><dd>{updated}</dd></div>
              <div><dt>Reading time</dt><dd>{article.readingTime}</dd></div>
            </dl>
          </div>
        </div>
      </header>

      <section className={styles.answer} aria-labelledby="direct-answer-title">
        <p className={styles.kicker}>Direct answer</p>
        <h2 id="direct-answer-title">{article.takeaways[0]}</h2>
        <ol>
          {article.takeaways.map((takeaway, index) => <li key={takeaway}><span>{String(index + 1).padStart(2, "0")}</span>{takeaway}</li>)}
        </ol>
      </section>

      <div className={styles.readingLayout}>
        <aside className={styles.toc} aria-label="On this page">
          <p className={styles.kicker}>On this page</p>
          <ol>
            {article.sections.map((section, index) => <li key={section.title}><a href={`#section-${index + 1}`}>{String(index + 1).padStart(2, "0")} {section.title}</a></li>)}
            <li><a href="#worked-examples">{String(article.sections.length + 1).padStart(2, "0")} Worked examples</a></li>
            <li><a href="#source-status">{String(article.sections.length + 2).padStart(2, "0")} Source status</a></li>
          </ol>
        </aside>

        <div className={styles.articleBody}>
          {article.sections.map((section, index) => (
            <section id={`section-${index + 1}`} key={section.title}>
              <span className={styles.chapter}>{String(index + 1).padStart(2, "0")}</span>
              <h2>{section.title}</h2>
              <p>{section.body}</p>
            </section>
          ))}

          <section id="worked-examples" className={styles.examples}>
            <p className={styles.kicker}>Worked examples</p>
            <h2>PUT THE IDEA INTO CONTEXT.</h2>
            <ol>
              {article.examples.map((example, index) => <li key={example}><span>{String(index + 1).padStart(2, "0")}</span><p>{example}</p></li>)}
            </ol>
          </section>

          <aside className={styles.callout}>
            <p className={styles.kicker}>{article.callout.title}</p>
            <p>{article.callout.text}</p>
          </aside>

          <section id="source-status" className={styles.evidence} aria-labelledby="source-status-title">
            <div>
              <p className={styles.kicker}>Evidence state</p>
              <h2 id="source-status-title">SOURCE STATUS: UNAVAILABLE.</h2>
            </div>
            <div>
              <strong>No claim-level source record is included.</strong>
              <p>The current Learning article model does not provide source links, a source owner, a review-due date or a compliance-review status. This page therefore makes no “verified” or compliance-reviewed claim.</p>
            </div>
          </section>
        </div>
      </div>

      <section className={styles.faq} aria-labelledby="article-faq-title">
        <header>
          <p className={styles.kicker}>Questions</p>
          <h2 id="article-faq-title">READ THE LIMITS TOO.</h2>
        </header>
        <div>
          {article.faq.map(([question, answer]) => (
            <details key={question}>
              <summary>{question}<span aria-hidden="true">+</span></summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className={styles.related} aria-labelledby="related-reading-title">
        <header>
          <p className={styles.kicker}>Related reading</p>
          <h2 id="related-reading-title">CONTINUE WITH CONTEXT.</h2>
        </header>
        <ol>
          {relatedArticles.map((related, index) => (
            <li key={related.slug}>
              <Link href={getArticlePath(related)}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{related.title}</strong>
                <span>{related.summary}</span>
                <i aria-hidden="true">↗</i>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      {intent !== "protected" ? (
        <aside className={styles.commercial} aria-label="Optional comparison transition">
          <div>
            <p className={styles.kicker}>After the educational answer</p>
            <h2>READY TO APPLY THE CHECKLIST?</h2>
          </div>
          <div>
            <p>{intent === "bonuses" ? "Move from the explanation to the terms-first Top Offers shortlist." : intent === "casinos" ? "Move from the explanation to three public editorial picks. The ranking is the same for everyone." : "Continue with another neutral learning route; this reference article does not force a commercial transition."}</p>
            {intent === "bonuses" ? <CommercialAnalyticsLink action={{ event: "all_results", destinationRoute: "bonuses" }} href="/bonuses#top-offers" sourceRoute="learn">See Top Offers <span aria-hidden="true">↗</span></CommercialAnalyticsLink> : intent === "casinos" ? <CommercialAnalyticsLink action={{ event: "all_results", destinationRoute: "best_casinos" }} href="/best-casinos" sourceRoute="learn">See B4GAMBLE Picks <span aria-hidden="true">↗</span></CommercialAnalyticsLink> : <Link href="/learn">Continue learning <span aria-hidden="true">↗</span></Link>}
            <small>Commercial disclosure: B4GAMBLE may receive compensation from some outbound links reached later. Rankings remain editorial.</small>
          </div>
        </aside>
      ) : (
        <aside className={styles.protectedBridge} aria-label="Control and support">
          <div>
            <p className={styles.kicker}>Control and support</p>
            <h2>KEEP THE NEXT STEP NEUTRAL.</h2>
          </div>
          <div>
            <p>This responsible-gambling learning article does not transition into casino, bonus or comparison content.</p>
            <div className={styles.protectedActions}>
              <Link href="/responsible-gambling">Explore Responsible Gambling <span aria-hidden="true">↗</span></Link>
              <Link href="/help">Open protected Help <span aria-hidden="true">↗</span></Link>
            </div>
          </div>
        </aside>
      )}
    </article>
  );
}

function articleIntent(categorySlug: string): "casinos" | "bonuses" | "protected" | "neutral" {
  if (categorySlug === "responsible-gambling") return "protected";
  if (categorySlug === "casino-bonuses") return "bonuses";
  if (["casino-basics", "casino-reviews", "casino-safety", "payments", "licensing", "crypto-casinos"].includes(categorySlug)) return "casinos";
  return "neutral";
}
