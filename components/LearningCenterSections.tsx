import Link from "next/link";
import type { ReactNode } from "react";
import {
  getArticlePath,
  getArticlesByCategory,
  getAuthor,
  getCategoryPath,
  getLearningCategory,
  getRelatedArticles,
  getRelatedCategories,
  learningArticles,
  learningCategories,
  learningPaths,
  type LearningArticle,
  type LearningCategory,
  type LearningPath as LearningPathType,
} from "@/lib/learning-center";
import { Badge, Button, Card, Container, CTA, FAQ, Section } from "@/components/ui";

export function LearningBreadcrumbs({
  category,
  article,
}: {
  category?: LearningCategory;
  article?: LearningArticle;
}) {
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <Link href="/">Home</Link>
      <span>/</span>
      <Link href="/learn">Learning Center</Link>
      {category && (
        <>
          <span>/</span>
          <Link href={getCategoryPath(category.slug)}>{category.title}</Link>
        </>
      )}
      {article && (
        <>
          <span>/</span>
          <span>{article.title}</span>
        </>
      )}
    </nav>
  );
}

export function CategoryHero({ category }: { category: LearningCategory }) {
  return (
    <section className="pageShell">
      <Container>
        <p className="eyebrow">Learning category</p>
        <h1>{category.title}</h1>
        <p className="lead">{category.longDescription}</p>
        <div className="heroActions">
          <Button href="#featured-guides" variant="primary">View Featured Guides</Button>
          <Button href="/learn" variant="ghost">All Categories</Button>
        </div>
        <LearningBreadcrumbs category={category} />
        <div className="trustStrip">
          <Badge tone="green">Educational category</Badge>
          <Badge>{getArticlesByCategory(category.slug).length} seed guides</Badge>
          <Badge tone="dark">Scalable content model</Badge>
        </div>
      </Container>
    </section>
  );
}

export function LearningCard({ article }: { article: LearningArticle }) {
  const category = getLearningCategory(article.categorySlug);

  return (
    <Card className="guideCard learningCard">
      <div className="badgeCluster">
        {category && <Badge tone="dark">{category.title}</Badge>}
        <Badge>{article.readingTime}</Badge>
        <Badge tone="green">{article.difficulty}</Badge>
      </div>
      <h3>{article.title}</h3>
      <p className="muted">{article.summary}</p>
      <div className="miniTasks">
        {article.tags.slice(0, 4).map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
      <Button href={getArticlePath(article)} variant="ghost">Read guide</Button>
    </Card>
  );
}

export function LearningGrid({ articles }: { articles: LearningArticle[] }) {
  return (
    <div className="guideGrid">
      {articles.map((article) => (
        <LearningCard article={article} key={article.slug} />
      ))}
    </div>
  );
}

export function CategoryNavigation() {
  return (
    <div className="relatedGrid">
      {learningCategories.map((category) => (
        <Link className="relatedArticle" href={getCategoryPath(category.slug)} key={category.slug}>
          <span>Learning category</span>
          <strong>{category.title}</strong>
          <small>{category.description}</small>
        </Link>
      ))}
    </div>
  );
}

export function LearningPath({ path }: { path: LearningPathType }) {
  const articles = path.articleSlugs
    .map((slug) => learningArticles.find((article) => article.slug === slug))
    .filter((article): article is LearningArticle => Boolean(article));

  return (
    <Card className="guideCard learningPath">
      <div className="badgeCluster">
        <Badge tone="green">Learning path</Badge>
        <Badge>{path.difficulty}</Badge>
      </div>
      <h3>{path.title}</h3>
      <p className="muted">{path.description}</p>
      <div className="pathLinks">
        {articles.map((article) => (
          <Button href={getArticlePath(article)} variant="ghost" key={article.slug}>
            {article.title}
          </Button>
        ))}
      </div>
    </Card>
  );
}

export function RelatedArticles({ article }: { article: LearningArticle }) {
  const related = getRelatedArticles(article);

  return (
    <div className="relatedGrid">
      {related.map((item) => (
        <Link className="relatedArticle" href={getArticlePath(item)} key={item.slug}>
          <span>{getLearningCategory(item.categorySlug)?.title || "Learning guide"}</span>
          <strong>{item.title}</strong>
          <small>{item.readingTime} · {item.difficulty}</small>
        </Link>
      ))}
    </div>
  );
}

export function AuthorCard({ article }: { article: LearningArticle }) {
  const author = getAuthor(article.authorId);
  const editor = getAuthor(article.editorId);

  return (
    <Card className="guideCard authorCard" tone="soft">
      <Badge tone="green">Author system</Badge>
      <h3>{author.name}</h3>
      <p className="muted">{author.bio}</p>
      <div className="resultRows">
        <div><span>Author</span><strong>{author.name}</strong></div>
        <div><span>Editor</span><strong>{editor.name}</strong></div>
        <div><span>Last Updated</span><strong>{article.lastUpdated}</strong></div>
        <div><span>Reading Time</span><strong>{article.readingTime}</strong></div>
      </div>
    </Card>
  );
}

export function GlossaryCard({ term, definition }: { term: string; definition: string }) {
  return (
    <Card className="guideCard glossaryCard">
      <Badge tone="dark">Glossary</Badge>
      <h3>{term}</h3>
      <p className="muted">{definition}</p>
    </Card>
  );
}

export function FAQBlock({ items }: { items: Array<[string, string]> }) {
  return <FAQ items={items} />;
}

export function LearningHero() {
  return (
    <section className="pageShell">
      <Container>
        <p className="eyebrow">SevenBet Learning Center</p>
        <h1>Learn Casino Terms, Bonuses, Safety, and Responsible Gambling</h1>
        <p className="lead">
          A scalable educational knowledge base for casino basics, bonuses, reviews, payments, licensing, game guides,
          country guides, crypto casinos, and responsible gambling concepts.
        </p>
        <div className="heroActions">
          <Button href="#learning-search" variant="primary">Search Learning Center</Button>
          <Button href="#categories" variant="ghost">Browse Categories</Button>
        </div>
        <LearningBreadcrumbs />
        <div className="trustStrip">
          <Badge tone="green">SEO content architecture</Badge>
          <Badge>13 main categories</Badge>
          <Badge tone="dark">Reusable article template</Badge>
          <Badge tone="warning">Responsible gambling context</Badge>
        </div>
      </Container>
    </section>
  );
}

export function ArticleLayout({ article }: { article: LearningArticle }) {
  const category = getLearningCategory(article.categorySlug);
  const nextReading = article.nextReading
    ? learningArticles.find((item) => item.slug === article.nextReading)
    : undefined;

  return (
    <>
      <section className="pageShell">
        <Container>
          <p className="eyebrow">{category?.title || "Learning guide"}</p>
          <h1>{article.title}</h1>
          <p className="lead">{article.summary}</p>
          <div className="heroActions">
            <Button href="#summary" variant="primary">Read Summary</Button>
            {category && <Button href={getCategoryPath(category.slug)} variant="ghost">Back to Category</Button>}
          </div>
          <LearningBreadcrumbs category={category} article={article} />
          <div className="trustStrip">
            <Badge tone="green">{article.difficulty}</Badge>
            <Badge>{article.readingTime}</Badge>
            <Badge tone="dark">Last updated {article.lastUpdated}</Badge>
          </div>
        </Container>
      </section>

      <Section eyebrow="Summary" title="What this article covers.">
        <div id="summary" className="articleGrid">
          <Card className="articleSummary" tone="soft">
            <h3>Summary</h3>
            <p>{article.summary}</p>
          </Card>
          <Card className="articleSummary">
            <h3>Key Takeaways</h3>
            <ul className="cleanList">
              {article.takeaways.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Card>
        </div>
      </Section>

      <Section eyebrow="Main content" title="Learn the topic step by step.">
        <div className="guideGrid oneCol articleBody">
          {article.sections.map((section) => (
            <Card className="guideCard" key={section.title}>
              <h3>{section.title}</h3>
              <p className="muted">{section.body}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section eyebrow="Examples" title="Examples and usage scenarios.">
        <div className="guideGrid twoCards">
          {article.examples.map((example) => (
            <Card className="guideCard" key={example}>
              <Badge tone="green">Example</Badge>
              <p className="muted">{example}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section eyebrow="Visual callout" title={article.callout.title}>
        <Card className="ctaBlock" tone="warning">
          <div>
            <h2>{article.callout.title}</h2>
            <p className="muted">{article.callout.text}</p>
          </div>
          <div className="heroActions">
            <Button href="/methodology" variant="ghost">Review Methodology</Button>
          </div>
        </Card>
      </Section>

      <Section eyebrow="FAQ" title={`${article.title}: frequently asked questions.`}>
        <FAQBlock items={article.faq} />
      </Section>

      <Section eyebrow="Related articles" title="Continue with related guides.">
        <RelatedArticles article={article} />
      </Section>

      <Section eyebrow="Next reading" title="Suggested next guide.">
        <CTA
          title={nextReading ? nextReading.title : "Return to the Learning Center"}
          intro={nextReading ? nextReading.summary : "Browse categories, tags, and learning paths."}
          primary={{
            href: nextReading ? getArticlePath(nextReading) : "/learn",
            label: nextReading ? "Read Next Guide" : "Open Learning Center",
          }}
          secondary={{ href: "/responsible-gambling", label: "Responsible Gambling Hub" }}
        />
      </Section>

      <Section eyebrow="Author" title="Editorial information.">
        <AuthorCard article={article} />
      </Section>
    </>
  );
}

export function CategoryPageContent({ category }: { category: LearningCategory }) {
  const articles = getArticlesByCategory(category.slug);
  const relatedCategories = getRelatedCategories(category);
  const popular = [...learningArticles].filter((article) => article.popular).slice(0, 3);
  const featured = [...new Map<string, LearningArticle>(
    articles
      .filter((article) => article.featured)
      .concat(articles)
      .map((article) => [article.slug, article] as const),
  ).values()].slice(0, 3);

  return (
    <>
      <Section eyebrow="Category description" title={category.title} intro={category.description} />

      <Section eyebrow="Featured guides" title="Start with these guides.">
        <div id="featured-guides">
          <LearningGrid articles={featured} />
        </div>
      </Section>

      <Section eyebrow="Latest guides" title="Latest seed guides in this category.">
        <LearningGrid articles={articles.slice(0, 6)} />
      </Section>

      <Section eyebrow="Popular guides" title="Popular guides across the Learning Center.">
        <LearningGrid articles={popular} />
      </Section>

      <Section eyebrow="Planned coverage" title="Topics this category can expand into.">
        <div className="guideGrid">
          {category.plannedTopics.map((topic) => (
            <GlossaryCard term={topic} definition="Planned topic in the scalable Learning Center content model." key={topic} />
          ))}
        </div>
      </Section>

      <Section eyebrow="Related categories" title="Continue into connected topics.">
        <div className="relatedGrid">
          {relatedCategories.map((item) => (
            <Link className="relatedArticle" href={getCategoryPath(item.slug)} key={item.slug}>
              <span>Related category</span>
              <strong>{item.title}</strong>
              <small>{item.description}</small>
            </Link>
          ))}
        </div>
      </Section>

      <Section eyebrow="FAQ" title={`${category.title}: category questions.`}>
        <FAQBlock items={category.faq} />
      </Section>
    </>
  );
}

export function LearningPathGrid() {
  return (
    <div className="guideGrid">
      {learningPaths.map((path) => (
        <LearningPath path={path} key={path.slug} />
      ))}
    </div>
  );
}

export function LearningShell({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
