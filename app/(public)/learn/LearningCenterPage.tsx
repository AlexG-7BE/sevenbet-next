import Image from "next/image";
import Link from "next/link";

import { LearningSearchAndFilter } from "@/components/learning/LearningSearchAndFilter";
import {
  getArticleBySlug,
  getArticlePath,
  getCategoryPath,
  getLearningCategory,
  type LearningArticle,
  type LearningCategory,
  type LearningDifficulty,
  type LearningPath,
} from "@/lib/learning-center";

import styles from "./learn.module.css";

export function LearningCenterPage({
  articles,
  categories,
  tags,
  paths,
}: {
  articles: LearningArticle[];
  categories: LearningCategory[];
  tags: string[];
  paths: LearningPath[];
}) {
  const feature = articles.find((article) => article.slug === "welcome-bonus-terms") ?? articles[0];
  const shelfArticles = articles.filter((article) => article.slug !== feature.slug).slice(0, 5);
  const difficulties = Array.from(new Set(articles.map((article) => article.difficulty))) as LearningDifficulty[];

  return (
    <div className={styles.page} data-learning-center data-figma-authority="835:6356">
      <section className={styles.hero} aria-labelledby="learn-title">
        <Image
          className={styles.heroImage}
          src="/learn/magazine-shelf-charles-postiaux.jpg"
          alt="A person browsing a wall of magazines"
          fill
          priority
          sizes="100vw"
        />
        <div className={styles.heroShade} />
        <div className={styles.heroCopy}>
          <p>SevenBet Learning Center · Current editorial library</p>
          <h1 id="learn-title">THE MAGAZINE SHELF.</h1>
          <span>Clear guides for reading casino terms, reviews and risks before comparing.</span>
        </div>
        <div className={styles.collage} aria-hidden="true">
          <div className={styles.photoCropOne}><Image src="/learn/magazine-shelf-charles-postiaux.jpg" alt="" fill sizes="380px" /></div>
          <div className={styles.photoCropTwo}><Image src="/learn/magazine-shelf-charles-postiaux.jpg" alt="" fill sizes="280px" /></div>
        </div>
        <div className={styles.issueNote}>
          <span>ISSUE 01</span>
          <strong>READ FIRST.<br />COMPARE SECOND.</strong>
        </div>
      </section>

      <section className={styles.manifesto} aria-labelledby="weight-title">
        <div>
          <p className={styles.kicker}>Editorial order</p>
          <h2 id="weight-title">NOT EVERY GUIDE HAS THE SAME WEIGHT.</h2>
        </div>
        <div className={styles.coverWrap}>
          <Image src="/learn/welcome-bonus-feature-cover.png" alt="Editorial cover for the welcome bonus terms guide" fill sizes="(max-width: 700px) 88vw, 520px" />
        </div>
        <div className={styles.manifestoCopy}>
          <p>Start with the article that answers the decision in front of you. Featured and popular labels appear only where the current article record supports them.</p>
          <Link href={getArticlePath(feature)}>Read the featured guide <span aria-hidden="true">↗</span></Link>
        </div>
      </section>

      <section className={styles.transition}>
        <p>A SHELF WITH AN</p>
        <strong>EDITORIAL ORDER.</strong>
      </section>

      <nav className={styles.categories} id="learning-categories" aria-labelledby="category-nav-title">
        <div className={styles.categoriesHeading}>
          <p className={styles.kicker}>Browse the taxonomy</p>
          <h2 id="category-nav-title">13 CURRENT CATEGORIES.</h2>
        </div>
        <ol>
          {categories.map((category, index) => (
            <li key={category.slug}>
              <Link href={getCategoryPath(category.slug)}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{category.title}</strong>
                <span aria-hidden="true">↗</span>
              </Link>
            </li>
          ))}
        </ol>
      </nav>

      <section className={styles.catalogue} aria-labelledby="catalogue-title">
        <header>
          <p className={styles.kicker}>Current catalogue</p>
          <h2 id="catalogue-title">START WHERE THE QUESTION IS.</h2>
          <p>The complete catalogue remains available in search below. This opening edit gives the largest visual weight only to current feature and popularity flags.</p>
        </header>
        <Link className={styles.dominantStory} href={getArticlePath(feature)}>
          <span className={styles.storyLabel}>Featured · {feature.readingTime}</span>
          <strong>{feature.title}</strong>
          <span>{feature.summary}</span>
          <i aria-hidden="true">↗</i>
        </Link>
        <div className={styles.storyList}>
          {shelfArticles.map((article, index) => {
            const category = getLearningCategory(article.categorySlug);
            const label = article.featured ? "Featured" : article.popular ? "Popular" : category?.title;
            return (
              <Link className={styles.story} href={getArticlePath(article)} key={article.slug}>
                <span className={styles.storyIndex}>{String(index + 2).padStart(2, "0")}</span>
                <span className={styles.storyText}>
                  <span className={styles.storyLabel}>{label} · {article.readingTime}</span>
                  <strong>{article.title}</strong>
                  <span>{article.summary}</span>
                </span>
                <i aria-hidden="true">↗</i>
              </Link>
            );
          })}
        </div>
      </section>

      <LearningSearchAndFilter
        articles={articles}
        categories={categories.map(({ slug, title }) => ({ slug, title }))}
        tags={tags}
        difficulties={difficulties}
      />

      <section className={styles.paths} aria-labelledby="paths-title">
        <header>
          <p className={styles.kicker}>Optional reading order</p>
          <h2 id="paths-title">SIX WAYS THROUGH THE SHELF.</h2>
          <p>These paths use the current Learning relationships. They do not represent Programme progress, missions or rewards.</p>
        </header>
        <ol>
          {paths.map((path, index) => {
            const firstArticle = path.articleSlugs.map(getArticleBySlug).find(Boolean);
            return (
              <li key={path.slug}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{path.title}</strong>
                <p>{path.description}</p>
                {firstArticle && <Link href={getArticlePath(firstArticle)}>Begin with {firstArticle.title} <span aria-hidden="true">↗</span></Link>}
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
