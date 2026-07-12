import Link from "next/link";
import type { LearningArticle, LearningCategory } from "@/lib/responsible-gambling";
import {
  getNextArticle,
  getRelatedArticles,
  learningArticles,
} from "@/lib/responsible-gambling";
import { Badge, Button, Card, CTA, FAQ, Section } from "@/components/ui";
import { PageHero } from "@/components/PageTemplates";

export function LearningCard({ article }: { article: LearningArticle }) {
  return (
    <Card className="guideCard learningCard">
      <div className="badgeCluster">
        <Badge tone="dark">{article.category}</Badge>
        <Badge>{article.readingTime}</Badge>
      </div>
      <h3>{article.title}</h3>
      <p className="muted">{article.summary}</p>
      <Button href={`/responsible-gambling/${article.slug}`} variant="ghost">
        Read guide
      </Button>
    </Card>
  );
}

export function CategoryCard({ category }: { category: LearningCategory }) {
  const matchingArticles = learningArticles.filter((article) => article.category === category.title);

  return (
    <Card className="guideCard categoryCard">
      <Badge tone="green">{matchingArticles.length} guides</Badge>
      <h3>{category.title}</h3>
      <p className="muted">{category.description}</p>
      {matchingArticles[0] && (
        <Button href={`/responsible-gambling/${matchingArticles[0].slug}`} variant="ghost">
          Start here
        </Button>
      )}
    </Card>
  );
}

export function ResourceCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Card className="guideCard resourceCard">
      <h3>{title}</h3>
      <p className="muted">{description}</p>
      <Button href={href} variant="ghost">
        Learn more
      </Button>
    </Card>
  );
}

export function RelatedArticle({ article }: { article: LearningArticle }) {
  return (
    <Link className="relatedArticle" href={`/responsible-gambling/${article.slug}`}>
      <span>{article.category}</span>
      <strong>{article.title}</strong>
      <small>{article.readingTime}</small>
    </Link>
  );
}

export function Breadcrumbs({ article }: { article?: LearningArticle }) {
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <Link href="/">Home</Link>
      <span>/</span>
      <Link href="/responsible-gambling">Responsible Gambling</Link>
      {article && (
        <>
          <span>/</span>
          <span>{article.title}</span>
        </>
      )}
    </nav>
  );
}

export function ArticleLayout({ article }: { article: LearningArticle }) {
  const relatedArticles = getRelatedArticles(article);
  const nextArticle = getNextArticle(article);

  return (
    <>
      <PageHero
        eyebrow={article.category}
        title={article.title}
        intro={article.summary}
        primary={{ href: "#summary", label: "Read Summary" }}
        secondary={{ href: "/program", label: "Start the 10-Step Program" }}
      >
        <Breadcrumbs article={article} />
        <div className="trustStrip">
          <Badge tone="green">Educational guide</Badge>
          <Badge>{article.readingTime}</Badge>
          <Badge tone="dark">Updated July 12, 2026</Badge>
        </div>
      </PageHero>

      <Section eyebrow="Summary" title="What this guide covers." className="articleSection">
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

      <Section eyebrow="Main content" title="Learn the concept step by step.">
        <div className="guideGrid oneCol articleBody">
          {article.sections.map((section) => (
            <Card className="guideCard" key={section.title}>
              <h3>{section.title}</h3>
              <p className="muted">{section.body}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section eyebrow="Examples" title="Practical examples.">
        <div className="guideGrid twoCards">
          {article.examples.map((example) => (
            <Card className="guideCard" key={example}>
              <Badge tone="green">Example</Badge>
              <p className="muted">{example}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section eyebrow="Practical tips" title="How to use this information.">
        <div className="miniTasks articleTips">
          {article.tips.map((tip) => (
            <span key={tip}>{tip}</span>
          ))}
        </div>
      </Section>

      <Section eyebrow="Related articles" title="Continue with related guides.">
        <div className="relatedGrid">
          {relatedArticles.map((item) => (
            <RelatedArticle article={item} key={item.slug} />
          ))}
        </div>
      </Section>

      <Section eyebrow="FAQ" title={`${article.title}: common questions.`}>
        <FAQ items={article.faq} />
      </Section>

      <Section eyebrow="Next recommended reading" title="Keep learning in order.">
        <CTA
          title={nextArticle ? nextArticle.title : "Return to the learning center"}
          intro={nextArticle ? nextArticle.summary : "Explore all responsible gambling guides and tools."}
          primary={{
            href: nextArticle ? `/responsible-gambling/${nextArticle.slug}` : "/responsible-gambling",
            label: nextArticle ? "Read Next Guide" : "Explore All Guides",
          }}
          secondary={{ href: "/self-check", label: "Take Self-Check" }}
        />
      </Section>
    </>
  );
}
