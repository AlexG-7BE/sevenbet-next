"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  contactOptions,
  knowledgeCategories,
  knowledgeQuestions,
  knowledgeSections,
  type KnowledgeQuestion,
} from "@/lib/knowledge-center";
import { Badge, Button, Card, CTA, Section } from "@/components/ui";

function FAQAccordion({ items }: { items: KnowledgeQuestion[] }) {
  return (
    <div className="faqGrid">
      {items.map((item) => (
        <details className="faqItem faqAccordion" key={`${item.category}-${item.question}`}>
          <summary>{item.question}</summary>
          <p className="muted">{item.answer}</p>
          {item.href && (
            <Button href={item.href} variant="ghost">
              Related article
            </Button>
          )}
        </details>
      ))}
    </div>
  );
}

function CategoryCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link className="relatedArticle categoryKnowledgeCard" href={href}>
      <span>Category</span>
      <strong>{title}</strong>
      <small>{description}</small>
    </Link>
  );
}

function PopularQuestionCard({ item }: { item: KnowledgeQuestion }) {
  return (
    <Card className="guideCard">
      <Badge tone="green">{item.category}</Badge>
      <h3>{item.question}</h3>
      <p className="muted">{item.answer}</p>
      {item.href && (
        <Button href={item.href} variant="ghost">
          Read related page
        </Button>
      )}
    </Card>
  );
}

export function KnowledgeSearch() {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();

  const results = useMemo(() => {
    if (!normalizedQuery) return [];

    return knowledgeQuestions.filter((item) => {
      const searchable = `${item.question} ${item.answer} ${item.category}`.toLowerCase();
      return searchable.includes(normalizedQuery);
    });
  }, [normalizedQuery]);

  return (
    <Section
      eyebrow="Search"
      title="Search the Knowledge Center."
      intro="Type a topic, phrase, or question to filter SevenBet answers instantly."
    >
      <Card className="searchPanel" tone="soft">
        <label htmlFor="knowledge-search">Search articles and FAQs</label>
        <input
          id="knowledge-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search articles and FAQs..."
          type="search"
        />
        {normalizedQuery && (
          <p className="muted">
            {results.length} result{results.length === 1 ? "" : "s"} for "{query}"
          </p>
        )}
      </Card>

      {normalizedQuery && (
        <div className="guideGrid searchResults">
          {results.map((item) => (
            <PopularQuestionCard item={item} key={`${item.category}-${item.question}`} />
          ))}
          {results.length === 0 && (
            <Card className="guideCard" tone="warning">
              <h3>No matching answers yet.</h3>
              <p className="muted">Try searching for bonus, wagering, affiliate, review, limits, or program.</p>
            </Card>
          )}
        </div>
      )}
    </Section>
  );
}

export function KnowledgeCenterContent() {
  const popularQuestions = knowledgeQuestions.filter((item) => item.popular);

  return (
    <>
      <KnowledgeSearch />

      <Section
        eyebrow="Categories"
        title="Browse categories."
        intro="Jump into the area that matches your question."
      >
        <div id="categories" className="relatedGrid">
          {knowledgeCategories.map((category) => (
            <CategoryCard
              title={category.title}
              description={category.description}
              href={category.href}
              key={category.title}
            />
          ))}
        </div>
      </Section>

      <Section
        eyebrow="Popular questions"
        title="Most common SevenBet questions."
        intro="Quick answers to the questions users are most likely to ask first."
      >
        <div className="guideGrid">
          {popularQuestions.map((item) => (
            <PopularQuestionCard item={item} key={item.question} />
          ))}
        </div>
      </Section>

      {knowledgeSections.map((section) => (
        <Section eyebrow="Knowledge base" title={section.title} key={section.id}>
          <div id={section.id}>
            <FAQAccordion items={knowledgeQuestions.filter((item) => item.category === section.category)} />
          </div>
        </Section>
      ))}

      <Section
        eyebrow="Related articles"
        title="Continue through SevenBet's core resources."
        intro="These pages provide context for most Knowledge Center answers."
      >
        <div className="relatedGrid">
          {[
            ["10-Step Program", "/program"],
            ["Self Check", "/self-check"],
            ["Casino Reviews", "/casinos"],
            ["Casino Bonuses", "/bonuses"],
            ["Responsible Gambling Hub", "/responsible-gambling"],
            ["Methodology", "/methodology"],
            ["Affiliate Disclosure", "/affiliate-disclosure"],
            ["About SevenBet", "/about"],
          ].map(([title, href]) => (
            <Link className="relatedArticle" href={href} key={href}>
              <span>SevenBet resource</span>
              <strong>{title}</strong>
              <small>Open page</small>
            </Link>
          ))}
        </div>
      </Section>

      <Section
        eyebrow="Contact"
        title="If you cannot find an answer."
        intro="Use these routes to understand the project, report possible inaccuracies, or suggest future educational topics."
      >
        <div className="guideGrid">
          {contactOptions.map((option) => (
            <Card className="guideCard" key={option.title}>
              <h3>{option.title}</h3>
              <p className="muted">{option.text}</p>
              <Button href={option.href} variant="ghost">
                Open page
              </Button>
            </Card>
          ))}
        </div>
      </Section>

      <Section eyebrow="Continue learning" title="Continue Learning">
        <CTA
          title="Keep learning with responsible gambling guides or browse casino reviews with the methodology in mind."
          primary={{ href: "/responsible-gambling", label: "Responsible Gambling Hub" }}
          secondary={{ href: "/casinos", label: "Browse Casino Reviews" }}
        />
      </Section>
    </>
  );
}
