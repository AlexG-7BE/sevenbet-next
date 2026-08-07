import Link from "next/link";

import {
  getArticlePath,
  getCategoryPath,
  type LearningArticle,
  type LearningCategory,
} from "@/lib/learning-center";

import styles from "./category.module.css";

export function LearningCategoryView({
  category,
  articles,
  relatedCategories,
}: {
  category: LearningCategory;
  articles: LearningArticle[];
  relatedCategories: LearningCategory[];
}) {
  return (
    <div className={styles.page} data-learning-category data-figma-authority="632:4360">
      <section className={styles.hero}>
        <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
          <Link href="/">Home</Link><span aria-hidden="true">/</span>
          <Link href="/learn">Learning Center</Link><span aria-hidden="true">/</span>
          <span aria-current="page">{category.title}</span>
        </nav>
        <p className={styles.kicker}>Learning category</p>
        <h1>{category.title}</h1>
        <p className={styles.lead}>{category.longDescription}</p>
        <div className={styles.categoryMeta}>
          <span>{articles.length} published guide{articles.length === 1 ? "" : "s"}</span>
          <span>Current library only</span>
        </div>
      </section>

      <section className={styles.library} aria-labelledby="category-guides-title">
        <header>
          <p className={styles.kicker}>Published now</p>
          <h2 id="category-guides-title">GUIDES ON THIS SHELF.</h2>
          <p>{category.description}</p>
        </header>

        {articles.length > 0 ? (
          <ol className={styles.articleList}>
            {articles.map((article, index) => (
              <li key={article.slug}>
                <Link href={getArticlePath(article)}>
                  <span className={styles.number}>{String(index + 1).padStart(2, "0")}</span>
                  <span className={styles.articleCopy}>
                    <span>{article.featured ? "Featured" : article.popular ? "Popular" : article.difficulty} · {article.readingTime}</span>
                    <strong>{article.title}</strong>
                    <span>{article.summary}</span>
                  </span>
                  <span className={styles.arrow} aria-hidden="true">↗</span>
                </Link>
              </li>
            ))}
          </ol>
        ) : (
          <div className={styles.empty} role="status">
            <p className={styles.kicker}>Under editorial review</p>
            <h3>NO PUBLISHED GUIDES YET.</h3>
            <p>This category is part of the current taxonomy, but it has no current article record. Browse another category instead.</p>
            <Link href="/learn#learning-categories">Browse categories</Link>
          </div>
        )}
      </section>

      <section className={styles.faq} aria-labelledby="category-faq-title">
        <header>
          <p className={styles.kicker}>Category notes</p>
          <h2 id="category-faq-title">BEFORE YOU READ.</h2>
        </header>
        <div className={styles.faqList}>
          {category.faq.map(([question, answer]) => (
            <details key={question}>
              <summary>{question}<span aria-hidden="true">+</span></summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <nav className={styles.related} aria-labelledby="related-categories-title">
        <p className={styles.kicker}>Keep browsing</p>
        <h2 id="related-categories-title">RELATED CATEGORIES.</h2>
        <div>
          {relatedCategories.map((item) => (
            <Link href={getCategoryPath(item.slug)} key={item.slug}>{item.title}<span aria-hidden="true">↗</span></Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
