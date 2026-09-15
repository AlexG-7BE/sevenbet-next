import Link from "next/link";

import { articlePath, type AdminArticle, type ArticleBlock, type PublicArticle } from "@/lib/articles/article-types";
import type { LearningMessages } from "@/lib/i18n/learning-center";

import styles from "./article.module.css";
import handoffStyles from "./article-handoff.module.css";

function headingId(block: Extract<ArticleBlock, { type: "heading" }>) {
  return `${block.id}-${block.text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}`;
}

function isExternal(url: string) {
  return /^https?:\/\//i.test(url);
}

function ArticleBlockView({ block }: { block: ArticleBlock }) {
  if (block.type === "paragraph") return <p>{block.text}</p>;
  if (block.type === "heading") {
    const id = headingId(block);
    return block.level === 3 ? <h3 id={id}>{block.text}</h3> : <h2 id={id}>{block.text}</h2>;
  }
  if (block.type === "list") {
    const items = block.items.map((item, index) => <li key={`${index}-${item}`}>{item}</li>);
    return block.style === "numbered" ? <ol>{items}</ol> : <ul>{items}</ul>;
  }
  if (block.type === "quote") return <blockquote><p>{block.text}</p>{block.citation && <cite>{block.citation}</cite>}</blockquote>;
  if (block.type === "callout") return <aside className={styles.callout}>{block.title && <strong>{block.title}</strong>}<p>{block.text}</p></aside>;
  if (block.type === "image") return <figure className={styles.articleImage}><img alt={block.alt} height={900} loading="lazy" src={block.url} width={1600} />{block.caption && <figcaption>{block.caption}</figcaption>}</figure>;
  return <aside className={styles.resourceLink}><strong>{block.label}</strong>{block.description && <p>{block.description}</p>}<a href={block.url} {...(isExternal(block.url) ? { rel: "noopener noreferrer", target: "_blank" } : {})}>{block.label} <span aria-hidden="true">↗</span></a></aside>;
}

export function LearningArticleView({ article, categoryTitle, relatedArticles, messages, hrefFor, programmePath, preview = false }: {
  article: AdminArticle;
  categoryTitle: string;
  relatedArticles: PublicArticle[];
  messages: LearningMessages;
  hrefFor: (href: string) => string;
  programmePath: string;
  preview?: boolean;
}) {
  const headings = article.bodyBlocks.filter((block): block is Extract<ArticleBlock, { type: "heading" }> => block.type === "heading");
  const published = article.publishedAt ? new Intl.DateTimeFormat(article.locale, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(article.publishedAt)) : "Not published";
  const reviewed = article.lastReviewedAt ? new Intl.DateTimeFormat(article.locale, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(article.lastReviewedAt)) : null;
  const protectedCategory = article.category === "responsible-gambling";

  return <article className={`${styles.page} ${handoffStyles.page}`} data-learning-article data-figma-authority="633:4341" data-runtime-renderer="postgresql-learn-article">
    <header className={`${styles.hero} ${handoffStyles.hero} ${article.heroImageUrl ? styles.heroWithImage : ""}`} data-nav-theme="dark">
      {article.heroImageUrl && <img alt={article.heroImageAlt || ""} className={styles.heroImage} height={900} src={article.heroImageUrl} width={1600} />}
      <div className={styles.heroContent}>
        <nav className={`${styles.breadcrumbs} ${handoffStyles.breadcrumbs}`} aria-label={messages.ui.breadcrumb}><Link href={hrefFor("/learn")}>{messages.ui.learn}</Link><span aria-hidden="true">→</span><Link href={hrefFor(`/learn/${article.category}`)}>{categoryTitle}</Link></nav>
        <div className={`${styles.heroGrid} ${handoffStyles.heroGrid}`}><div><p className={styles.kicker}>{preview ? "Authenticated draft preview" : categoryTitle}</p><h1>{article.title}</h1></div><div className={`${styles.heroSummary} ${handoffStyles.heroSummary}`}><p>{article.excerpt}</p><dl><div><dt>Published</dt><dd>{published}</dd></div>{reviewed && <div><dt>Reviewed</dt><dd>{reviewed}</dd></div>}{article.readingTime && <div><dt>{messages.ui.readingTime}</dt><dd>{article.readingTime}</dd></div>}{article.difficulty && <div><dt>Level</dt><dd>{article.difficulty}</dd></div>}</dl></div></div>
      </div>
    </header>
    <div className={`${styles.readingLayout} ${handoffStyles.readingLayout}`} data-nav-theme="light">
      <aside className={`${styles.toc} ${handoffStyles.toc}`} aria-label={messages.ui.onThisPage}><p className={styles.kicker}>{messages.ui.onThisPage}</p>{headings.length ? <ol>{headings.map((heading, index) => <li key={heading.id}><a href={`#${headingId(heading)}`}>{String(index + 1).padStart(2, "0")} {heading.text}</a></li>)}</ol> : <p>Structured guide</p>}{protectedCategory && <div className={handoffStyles.supportCard}><strong>Control & support</strong><p>Need a neutral next step away from gambling content?</p><Link href={hrefFor("/help")}>Open protected Help →</Link></div>}</aside>
      <div className={`${styles.articleBody} ${handoffStyles.articleBody}`}>{article.bodyBlocks.map((block) => <ArticleBlockView block={block} key={block.id} />)}<div className={handoffStyles.articleReview}><span>Published {published}{reviewed ? ` · reviewed ${reviewed}` : ""}</span><Link href={hrefFor("/methodology")}>Editorial methodology →</Link></div></div>
    </div>
    {relatedArticles.length > 0 && <section className={`${styles.related} ${handoffStyles.related}`} aria-labelledby="related-reading-title" data-nav-theme="cream"><header><p className={styles.kicker}>{messages.ui.relatedReading}</p><h2 id="related-reading-title">READ NEXT</h2></header><ol>{relatedArticles.map((related, index) => <li key={related.id}><Link href={hrefFor(articlePath(related))}><span>{String(index + 1).padStart(2, "0")}</span><span>{related.category.replaceAll("-", " ")}</span><strong>{related.title}</strong><span>{related.excerpt}</span><i aria-hidden="true">↗</i></Link></li>)}</ol></section>}
    {protectedCategory ? <aside className={styles.protectedBridge} aria-label={messages.ui.controlSupport} data-nav-theme="dark"><div><p className={styles.kicker}>{messages.ui.controlSupport}</p><h2>{messages.ui.neutralNextStep}</h2></div><div><p>{messages.ui.responsibleNoTransition}</p><div className={styles.protectedActions}><Link href={hrefFor("/responsible-gambling")}>{messages.ui.exploreResponsible} <span aria-hidden="true">↗</span></Link><Link href={hrefFor("/help")}>{messages.ui.openHelp} <span aria-hidden="true">↗</span></Link></div></div></aside> : <aside className={`${styles.commercial} ${handoffStyles.commercial}`} aria-label={messages.ui.optionalTransition} data-nav-theme="dark"><div><p className={styles.kicker}>{messages.ui.afterAnswer}</p><h2>KNOWLEDGE IS HALF OF IT.<em>The plan is the other half.</em></h2></div><div><p>Turn what you have read into boundaries you can use.</p><Link href={programmePath}>Start Programme</Link></div></aside>}
  </article>;
}
