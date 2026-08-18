import Link from "next/link";

import {
  getArticlePath,
  type LearningArticle,
  type LearningArticleBlock,
  type LearningAuthor,
  type LearningCategory,
} from "@/lib/learning-center";

import styles from "./article.module.css";
import handoffStyles from "./article-handoff.module.css";

function ArticleBlockView({ block }: { block: LearningArticleBlock }) {
  if (block.type === "conversion") return <dl className={handoffStyles.conversion}>{block.rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>;
  if (block.type === "comparison-table") return <div aria-label="Illustrative bonus-cost comparison" className={handoffStyles.articleTable} role="region" tabIndex={0}>
    <div>{block.columns.map((column) => <b key={column}>{column}</b>)}</div>
    {block.rows.map((row) => <div key={row.join("|")}>{row.map((cell, index) => index === row.length - 1 ? <strong key={cell}>{cell}</strong> : <span key={cell}>{cell}</span>)}</div>)}
  </div>;
  if (block.type === "quote") return <blockquote>{block.text}</blockquote>;
  if (block.type === "trap") return <aside className={handoffStyles.trap}><strong>{block.title}</strong><p>{block.text}</p></aside>;
  return <div className={handoffStyles.checklist}><strong>{block.title}</strong><ul>{block.items.map((item) => <li key={item}>{item}</li>)}</ul></div>;
}

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
  const commercialEligible = article.categorySlug !== "responsible-gambling";
  const visual = article.visualPresentation;
  const updated = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })
    .format(new Date(`${article.lastUpdated}T00:00:00Z`));

  return (
    <article className={`${styles.page} ${visual ? handoffStyles.page : ""}`} data-learning-article data-handoff-article={visual ? "true" : undefined} data-figma-authority="633:4341" data-runtime-renderer="learn-article">
      <header className={`${styles.hero} ${visual ? handoffStyles.hero : ""}`} data-nav-theme="dark">
        <nav className={`${styles.breadcrumbs} ${visual ? handoffStyles.breadcrumbs : ""}`} aria-label="Breadcrumb">
          {visual ? <><Link href="/learn">Learn</Link><span aria-hidden="true">→</span><Link href={`/learn/${category.slug}`}>{visual.heroLabel}</Link></> : <><Link href="/">Home</Link><span aria-hidden="true">/</span><Link href="/learn">Learning Center</Link><span aria-hidden="true">/</span><Link href={`/learn/${category.slug}`}>{category.title}</Link></>}
        </nav>
        <div className={`${styles.heroGrid} ${visual ? handoffStyles.heroGrid : ""}`}>
          <div>
            {!visual ? <p className={styles.kicker}>Neutral learning article · {category.title}</p> : null}
            <h1>{article.title}{visual ? <em>{visual.accentTitle}</em> : null}</h1>
          </div>
          <div className={`${styles.heroSummary} ${visual ? handoffStyles.heroSummary : ""}`}>
            <p>{article.summary}</p>
            <dl>
              {visual ? <><div><dt>By</dt><dd>the B4GAMBLE test team</dd></div><div><dt>Read</dt><dd>{article.readingTime}</dd></div><div><dt>Updated</dt><dd>Aug 2026</dd></div><div><dt>Status</dt><dd>{visual.heroStatus}</dd></div></> : <><div><dt>Author</dt><dd>{author.name}</dd></div><div><dt>Editor</dt><dd>{editor.name}</dd></div><div><dt>Updated</dt><dd>{updated}</dd></div><div><dt>Reading time</dt><dd>{article.readingTime}</dd></div></>}
            </dl>
          </div>
        </div>
      </header>

      {article.takeaways.length ? <section className={styles.answer} aria-labelledby="direct-answer-title" data-motion-reveal data-nav-theme="light">
        <p className={styles.kicker}>Direct answer</p>
        <h2 id="direct-answer-title">{article.takeaways[0]}</h2>
        <ol>
          {article.takeaways.map((takeaway, index) => <li key={takeaway}><span>{String(index + 1).padStart(2, "0")}</span>{takeaway}</li>)}
        </ol>
      </section> : null}

      <div className={`${styles.readingLayout} ${visual ? handoffStyles.readingLayout : ""}`} data-motion-reveal data-nav-theme="light">
        <aside className={`${styles.toc} ${visual ? handoffStyles.toc : ""}`} aria-label="On this page">
          <p className={styles.kicker}>On this page</p>
          <ol>
            {article.sections.map((section, index) => <li key={section.title}><a href={`#section-${index + 1}`}>{String(index + 1).padStart(2, "0")} {section.title}</a></li>)}
            {article.examples.length ? <li><a href="#worked-examples">{String(article.sections.length + 1).padStart(2, "0")} Worked examples</a></li> : null}
            {!visual ? <li><a href="#source-status">{String(article.sections.length + (article.examples.length ? 2 : 1)).padStart(2, "0")} Source status</a></li> : null}
          </ol>
          {visual ? <div className={handoffStyles.supportCard}><strong>{visual.supportTitle}</strong><p>{visual.supportText}</p><Link href="/help">{visual.supportLink}</Link></div> : null}
        </aside>

        <div className={`${styles.articleBody} ${visual ? handoffStyles.articleBody : ""}`}>
          {visual ? <div className={handoffStyles.articleIntro}>{visual.intro.map((paragraph, index) => <p className={index === 0 ? handoffStyles.lead : undefined} key={paragraph}>{paragraph}</p>)}</div> : null}
          {article.sections.map((section, index) => (
            <section id={`section-${index + 1}`} key={section.title}>
              <span className={styles.chapter}>{String(index + 1).padStart(2, "0")}</span>
              <h2>{section.title}</h2>
              <p>{section.body}</p>
              {section.blocks?.filter((block) => block.type !== "quote").map((block, blockIndex) => <ArticleBlockView block={block} key={`${section.title}-${block.type}-${blockIndex}`} />)}
              {section.after ? <p>{section.after}</p> : null}
              {section.blocks?.filter((block) => block.type === "quote").map((block, blockIndex) => <ArticleBlockView block={block} key={`${section.title}-${block.type}-${blockIndex}`} />)}
            </section>
          ))}

          {article.examples.length ? <section id="worked-examples" className={styles.examples}>
            <p className={styles.kicker}>Worked examples</p>
            <h2>PUT THE IDEA INTO CONTEXT.</h2>
            <ol>
              {article.examples.map((example, index) => <li key={example}><span>{String(index + 1).padStart(2, "0")}</span><p>{example}</p></li>)}
            </ol>
          </section> : null}

          {!visual ? <><aside className={styles.callout}>
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
          </section></> : <div className={handoffStyles.articleReview}><span>Reviewed by two editors · sources on request</span><Link href="/methodology">How we test →</Link></div>}
        </div>
      </div>

      {article.faq.length ? <section className={styles.faq} aria-labelledby="article-faq-title" data-motion-reveal data-nav-theme="light">
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
      </section> : null}

      <section className={`${styles.related} ${visual ? handoffStyles.related : ""}`} aria-labelledby="related-reading-title" data-motion-reveal data-nav-theme="cream">
        <header>
          <p className={styles.kicker}>{visual ? "" : "Related reading"}</p>
          <h2 id="related-reading-title">{visual ? "READ NEXT" : "CONTINUE WITH CONTEXT."}</h2>
        </header>
        <ol>
          {(visual?.relatedCards ?? relatedArticles).map((related, index) => (
            <li key={"href" in related ? related.href : related.slug}>
              <Link href={"href" in related ? related.href : getArticlePath(related)}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                {"label" in related ? <span>{related.label}</span> : null}
                <strong>{related.title}</strong>
                <span>{"meta" in related ? related.meta : related.summary}</span>
                <i aria-hidden="true">↗</i>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      {commercialEligible ? (
        <aside className={`${styles.commercial} ${visual ? handoffStyles.commercial : ""}`} aria-label="Optional comparison transition" data-motion-reveal data-nav-theme="dark">
          <div>
            <p className={styles.kicker}>{visual?.bridgeKicker || "After the educational answer"}</p>
            <h2>{visual ? <>{visual.bridgeTitle}<em>{visual.bridgeAccent}</em></> : "READY TO APPLY THE CHECKLIST?"}</h2>
          </div>
          <div>
            <p>{visual?.bridgeText || "Compare current B4GAMBLE records only when the educational context is clear. This is an internal navigation link, not a personalised recommendation."}</p>
            {visual
              ? <Link href="/program">Start Programme</Link>
              : <Link href="/casinos">Compare casinos <span aria-hidden="true">↗</span></Link>}
            {!visual ? <small>Commercial disclosure: B4GAMBLE may receive compensation from some outbound links reached later. Rankings remain editorial.</small> : null}
          </div>
        </aside>
      ) : (
        <aside className={styles.protectedBridge} aria-label="Control and support" data-motion-reveal data-nav-theme="dark">
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
