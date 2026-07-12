"use client";

import { useMemo, useState } from "react";
import {
  getArticlePath,
  getLearningCategory,
  learningArticles,
  learningCategories,
  learningTags,
  type LearningDifficulty,
} from "@/lib/learning-center";
import { Badge, Button, Card, Section } from "@/components/ui";

const difficulties: Array<LearningDifficulty | "All"> = ["All", "Beginner", "Intermediate", "Advanced"];

export function LearningSearch() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [tag, setTag] = useState("All");
  const [difficulty, setDifficulty] = useState<LearningDifficulty | "All">("All");

  const filteredArticles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return learningArticles.filter((article) => {
      const categoryTitle = getLearningCategory(article.categorySlug)?.title || "";
      const text = `${article.title} ${article.summary} ${categoryTitle} ${article.tags.join(" ")}`.toLowerCase();
      const matchesQuery = !normalizedQuery || text.includes(normalizedQuery);
      const matchesCategory = category === "All" || article.categorySlug === category;
      const matchesTag = tag === "All" || article.tags.includes(tag);
      const matchesDifficulty = difficulty === "All" || article.difficulty === difficulty;

      return matchesQuery && matchesCategory && matchesTag && matchesDifficulty;
    });
  }, [category, difficulty, query, tag]);

  return (
    <Section
      eyebrow="Search"
      title="Search and filter the Learning Center."
      intro="This search model is designed to scale as hundreds of guides are added."
    >
      <Card className="searchPanel learningSearchPanel" tone="soft">
        <label htmlFor="learning-search">Search</label>
        <input
          id="learning-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search articles, tags, categories..."
          type="search"
        />
        <div className="learningFilters">
          <label>
            Category
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="All">All categories</option>
              {learningCategories.map((item) => (
                <option value={item.slug} key={item.slug}>{item.title}</option>
              ))}
            </select>
          </label>
          <label>
            Tag
            <select value={tag} onChange={(event) => setTag(event.target.value)}>
              <option value="All">All tags</option>
              {learningTags.map((item) => (
                <option value={item} key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            Difficulty
            <select value={difficulty} onChange={(event) => setDifficulty(event.target.value as LearningDifficulty | "All")}>
              {difficulties.map((item) => (
                <option value={item} key={item}>{item}</option>
              ))}
            </select>
          </label>
        </div>
        <p className="muted">{filteredArticles.length} guide{filteredArticles.length === 1 ? "" : "s"} match the current filters.</p>
      </Card>

      <div className="guideGrid searchResults">
        {filteredArticles.map((article) => {
          const articleCategory = getLearningCategory(article.categorySlug);
          return (
            <Card className="guideCard" key={article.slug}>
              <div className="badgeCluster">
                {articleCategory && <Badge tone="dark">{articleCategory.title}</Badge>}
                <Badge>{article.readingTime}</Badge>
                <Badge tone="green">{article.difficulty}</Badge>
              </div>
              <h3>{article.title}</h3>
              <p className="muted">{article.summary}</p>
              <Button href={getArticlePath(article)} variant="ghost">Read guide</Button>
            </Card>
          );
        })}
      </div>
    </Section>
  );
}
