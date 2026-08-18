"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { LearningArticle, LearningCategory, LearningDifficulty } from "@/lib/learning-center";
import { getArticlePath } from "@/lib/learning-center";

import styles from "./LearningSearchAndFilter.module.css";

type SearchCategory = Pick<LearningCategory, "slug" | "title">;

export function LearningSearchAndFilter({
  articles,
  categories,
  tags,
  difficulties,
  initialCategory = "",
}: {
  articles: LearningArticle[];
  categories: SearchCategory[];
  tags: string[];
  difficulties: LearningDifficulty[];
  initialCategory?: string;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(initialCategory);
  const [tag, setTag] = useState("");
  const [difficulty, setDifficulty] = useState("");

  const categoryTitles = useMemo(
    () => new Map(categories.map((item) => [item.slug, item.title])),
    [categories],
  );

  const filteredArticles = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();

    return articles.filter((article) => {
      const categoryTitle = categoryTitles.get(article.categorySlug) ?? "";
      const searchableText = [article.title, article.summary, categoryTitle, ...article.tags]
        .join(" ")
        .toLocaleLowerCase();

      return (
        (!normalizedQuery || searchableText.includes(normalizedQuery)) &&
        (!category || article.categorySlug === category) &&
        (!tag || article.tags.includes(tag)) &&
        (!difficulty || article.difficulty === difficulty)
      );
    });
  }, [articles, category, categoryTitles, difficulty, query, tag]);

  const hasFilters = Boolean(query || category || tag || difficulty);

  function clearFilters() {
    setQuery("");
    setCategory("");
    setTag("");
    setDifficulty("");
  }

  return (
    <section className={styles.section} aria-labelledby="learning-search-title" data-learning-search id="learning-search">
      <div className={styles.headingBlock}>
        <p className={styles.kicker}>Guides &amp; insights</p>
        <h2 id="learning-search-title">All guides</h2>
        <p>Search the current library or filter it by topic.</p>
      </div>

      <div className={styles.controls}>
        <label className={styles.searchField}>
          <span>Search guides</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Wagering, payouts, RTP…"
          />
        </label>
        <div className={styles.selectGrid}>
          <label>
            <span>Category</span>
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="">All categories</option>
              {categories.map((item) => <option value={item.slug} key={item.slug}>{item.title}</option>)}
            </select>
          </label>
          <label>
            <span>Tag</span>
            <select value={tag} onChange={(event) => setTag(event.target.value)}>
              <option value="">All tags</option>
              {tags.map((item) => <option value={item} key={item}>{item}</option>)}
            </select>
          </label>
          <label>
            <span>Difficulty</span>
            <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>
              <option value="">All levels</option>
              {difficulties.map((item) => <option value={item} key={item}>{item}</option>)}
            </select>
          </label>
        </div>
      </div>

      <div className={styles.resultBar}>
        <p aria-live="polite"><strong>{filteredArticles.length}</strong> guide{filteredArticles.length === 1 ? "" : "s"} on this shelf</p>
        {hasFilters && filteredArticles.length > 0 && <button type="button" onClick={clearFilters}>Clear filters</button>}
      </div>

      {filteredArticles.length > 0 ? (
        <ol className={styles.results}>
          {filteredArticles.map((article, index) => {
            const categoryTitle = categoryTitles.get(article.categorySlug) ?? article.categorySlug;
            const editorialLabel = article.featured ? "Featured" : article.popular ? "Popular" : categoryTitle;

            return (
              <li key={article.slug}>
                <Link href={getArticlePath(article)} className={styles.resultLink}>
                  <span className={styles.resultNumber}>{String(index + 1).padStart(2, "0")}</span>
                  <span className={styles.resultCopy}>
                    <span className={styles.resultMeta}>{editorialLabel} · {article.readingTime} · {article.difficulty}</span>
                    <strong>{article.title}</strong>
                    <span>{article.summary}</span>
                  </span>
                  <span className={styles.arrow} aria-hidden="true">↗</span>
                </Link>
              </li>
            );
          })}
        </ol>
      ) : (
        <div className={styles.empty} role="status">
          <p className={styles.kicker}>No guides found</p>
          <h3>THE SHELF IS QUIET.</h3>
          <p>No current article matches that combination. Clear the filters or browse the existing categories.</p>
          <div className={styles.emptyActions}>
            <button type="button" onClick={clearFilters}>Clear filters</button>
            <Link href="#learning-categories">Browse categories</Link>
          </div>
        </div>
      )}
    </section>
  );
}
