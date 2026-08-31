import Link from "next/link";

import {
  getArticlePath,
  type LearningArticle,
  type LearningArticleBlock,
  type LearningAuthor,
  type LearningCategory,
} from "@/lib/learning-center";
import type { LearningMessages } from "@/lib/i18n/learning-center";
import type { SupportedLocale } from "@/lib/market/registry";

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
  locale,
  messages,
  hrefFor,
  programmePath,
}: {
  article: LearningArticle;
  category: LearningCategory;
  author: LearningAuthor;
  editor: LearningAuthor;
  relatedArticles: LearningArticle[];
  locale: SupportedLocale;
  messages: LearningMessages;
  hrefFor: (href: string) => string;
  programmePath: string;
}) {
  const commercialEligible = article.categorySlug !== "responsible-gambling";
  const visual = article.visualPresentation;
  const updated = new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })
    .format(new Date(`${article.lastUpdated}T00:00:00Z`));

  return (
    <article className={`${styles.page} ${visual ? handoffStyles.page : ""}`} data-learning-article data-handoff-article={visual ? "true" : undefined} data-figma-authority="633:4341" data-runtime-renderer="learn-article">
      <header className={`${styles.hero} ${visual ? handoffStyles.hero : ""}`} data-nav-theme="dark">
        <nav className={`${styles.breadcrumbs} ${visual ? handoffStyles.breadcrumbs : ""}`} aria-label={messages.ui.breadcrumb}>
          {visual ? <><Link href={hrefFor("/learn")}>Learn</Link><span aria-hidden="true">→</span><Link href={hrefFor(`/learn/${category.slug}`)}>{visual.heroLabel}</Link></> : <><Link href={hrefFor("/")}>{messages.ui.home}</Link><span aria-hidden="true">/</span><Link href={hrefFor("/learn")}>{messages.ui.learningCenter}</Link><span aria-hidden="true">/</span><Link href={hrefFor(`/learn/${category.slug}`)}>{category.title}</Link></>}
        </nav>
        <div className={`${styles.heroGrid} ${visual ? handoffStyles.heroGrid : ""}`}>
          <div>
            {!visual ? <p className={styles.kicker}>{messages.ui.neutralArticle} · {category.title}</p> : null}
            <h1>{article.title}{visual ? <em>{visual.accentTitle}</em> : null}</h1>
          </div>
          <div className={`${styles.heroSummary} ${visual ? handoffStyles.heroSummary : ""}`}>
            <p>{article.summary}</p>
            <dl>
              {visual ? <><div><dt>By</dt><dd>the B4GAMBLE test team</dd></div><div><dt>Read</dt><dd>{article.readingTime}</dd></div><div><dt>Updated</dt><dd>Aug 2026</dd></div><div><dt>Status</dt><dd>{visual.heroStatus}</dd></div></> : <><div><dt>{messages.ui.author}</dt><dd>{author.name}</dd></div><div><dt>{messages.ui.editor}</dt><dd>{editor.name}</dd></div><div><dt>{messages.ui.updated}</dt><dd>{updated}</dd></div><div><dt>{messages.ui.readingTime}</dt><dd>{article.readingTime}</dd></div></>}
            </dl>
          </div>
        </div>
      </header>

      {article.takeaways.length ? <section className={styles.answer} aria-labelledby="direct-answer-title" data-motion-reveal data-nav-theme="light">
        <p className={styles.kicker}>{messages.ui.directAnswer}</p>
        <h2 id="direct-answer-title">{article.takeaways[0]}</h2>
        <ol>
          {article.takeaways.map((takeaway, index) => <li key={takeaway}><span>{String(index + 1).padStart(2, "0")}</span>{takeaway}</li>)}
        </ol>
      </section> : null}

      <div className={`${styles.readingLayout} ${visual ? handoffStyles.readingLayout : ""}`} data-motion-reveal data-nav-theme="light">
        <aside className={`${styles.toc} ${visual ? handoffStyles.toc : ""}`} aria-label={messages.ui.onThisPage}>
          <p className={styles.kicker}>{messages.ui.onThisPage}</p>
          <ol>
            {article.sections.map((section, index) => <li key={section.title}><a href={`#section-${index + 1}`}>{String(index + 1).padStart(2, "0")} {section.title}</a></li>)}
            {article.examples.length ? <li><a href="#worked-examples">{String(article.sections.length + 1).padStart(2, "0")} {messages.ui.workedExamples}</a></li> : null}
            {!visual ? <li><a href="#source-status">{String(article.sections.length + (article.examples.length ? 2 : 1)).padStart(2, "0")} {messages.ui.sourceStatus}</a></li> : null}
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
            <p className={styles.kicker}>{messages.ui.workedExamples}</p>
            <h2>{messages.ui.putInContext}</h2>
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
              <p className={styles.kicker}>{messages.ui.evidenceState}</p>
              <h2 id="source-status-title">{messages.ui.sourceUnavailable}</h2>
            </div>
            <div>
              <strong>{messages.ui.noClaimSource}</strong>
              <p>{messages.ui.sourceUnavailableCopy}</p>
            </div>
          </section></> : <div className={handoffStyles.articleReview}><span>Reviewed by two editors · sources on request</span><Link href={hrefFor("/methodology")}>How we test →</Link></div>}
        </div>
      </div>

      {article.faq.length ? <section className={styles.faq} aria-labelledby="article-faq-title" data-motion-reveal data-nav-theme="light">
        <header>
          <p className={styles.kicker}>{messages.ui.questions}</p>
          <h2 id="article-faq-title">{messages.ui.readLimits}</h2>
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
          <p className={styles.kicker}>{visual ? "" : messages.ui.relatedReading}</p>
          <h2 id="related-reading-title">{visual ? "READ NEXT" : messages.ui.continueContext}</h2>
        </header>
        <ol>
          {(visual?.relatedCards ?? relatedArticles).map((related, index) => (
            <li key={"href" in related ? related.href : related.slug}>
              <Link href={hrefFor("href" in related ? related.href : getArticlePath(related))}>
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
        <aside className={`${styles.commercial} ${visual ? handoffStyles.commercial : ""}`} aria-label={messages.ui.optionalTransition} data-motion-reveal data-nav-theme="dark">
          <div>
            <p className={styles.kicker}>{visual?.bridgeKicker || messages.ui.afterAnswer}</p>
            <h2>{visual ? <>{visual.bridgeTitle}<em>{visual.bridgeAccent}</em></> : messages.ui.applyChecklist}</h2>
          </div>
          <div>
            <p>{visual?.bridgeText || messages.ui.comparisonCopy}</p>
            {visual
              ? <Link href={programmePath}>Start Programme</Link>
              : <Link href={hrefFor("/casinos")}>{messages.ui.compareCasinos} <span aria-hidden="true">↗</span></Link>}
            {!visual ? <small>{messages.ui.commercialDisclosure}</small> : null}
          </div>
        </aside>
      ) : (
        <aside className={styles.protectedBridge} aria-label={messages.ui.controlSupport} data-motion-reveal data-nav-theme="dark">
          <div>
            <p className={styles.kicker}>{messages.ui.controlSupport}</p>
            <h2>{messages.ui.neutralNextStep}</h2>
          </div>
          <div>
            <p>{messages.ui.responsibleNoTransition}</p>
            <div className={styles.protectedActions}>
              <Link href={hrefFor("/responsible-gambling")}>{messages.ui.exploreResponsible} <span aria-hidden="true">↗</span></Link>
              <Link href={hrefFor("/help")}>{messages.ui.openHelp} <span aria-hidden="true">↗</span></Link>
            </div>
          </div>
        </aside>
      )}
    </article>
  );
}
