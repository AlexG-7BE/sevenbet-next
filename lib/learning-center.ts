/**
 * Learning taxonomy and presentation types only. Article publication records
 * are owned exclusively by the PostgreSQL `Article` model and ArticleService.
 */
export type LearningDifficulty = "Beginner" | "Intermediate" | "Advanced";
export type LearningPublicationStatus = "DRAFT" | "PUBLISHED";

export type LearningCategory = {
  slug: string;
  title: string;
  description: string;
  longDescription: string;
  relatedCategories: string[];
  plannedTopics: string[];
  faq: Array<[string, string]>;
};

export type LearningAuthor = { id: string; name: string; role: string; bio: string };
export type LearningArticleBlock =
  | { type: "conversion"; rows: Array<[string, string]> }
  | { type: "comparison-table"; columns: string[]; rows: string[][] }
  | { type: "quote"; text: string }
  | { type: "trap"; title: string; text: string }
  | { type: "checklist"; title: string; items: string[] };
export type LearningArticle = {
  slug: string;
  categorySlug: string;
  status: LearningPublicationStatus;
  publishedAt: string;
  title: string;
  summary: string;
  difficulty: LearningDifficulty;
  readingTime: string;
  tags: string[];
  authorId: string;
  editorId: string;
  lastUpdated: string;
  featured?: boolean;
  popular?: boolean;
  takeaways: string[];
  sections: Array<{ title: string; body: string; after?: string; blocks?: LearningArticleBlock[] }>;
  examples: string[];
  callout: { title: string; text: string };
  faq: Array<[string, string]>;
  relatedArticles: string[];
  nextReading?: string;
  visualPresentation?: {
    accentTitle: string;
    heroLabel: string;
    heroStatus: string;
    intro: string[];
    supportTitle: string;
    supportText: string;
    supportLink: string;
    bridgeKicker: string;
    bridgeTitle: string;
    bridgeAccent: string;
    bridgeText: string;
    relatedCards: Array<{ label: string; title: string; meta: string; href: string }>;
  };
};
export type LearningPath = { slug: string; title: string; description: string; difficulty: LearningDifficulty; articleSlugs: string[] };

export const learningTags = ["Bonuses", "Payments", "Crypto", "Blackjack", "Slots", "Poker", "RTP", "Volatility", "Responsible Gambling", "Licensing", "Security", "Reviews", "Sports Betting", "Glossary", "Country Guides"];

export const learningAuthors: LearningAuthor[] = [
  { id: "b4gamble-editorial", name: "B4GAMBLE Editorial Team", role: "Author", bio: "Creates and maintains B4GAMBLE educational content." },
  { id: "b4gamble-review", name: "B4GAMBLE Review Desk", role: "Editor", bio: "Reviews learning content before publication." },
];

const categories: Array<[string, string, string]> = [
  ["casino-basics", "Casino Basics", "Core casino terminology, account basics and beginner context."],
  ["casino-bonuses", "Casino Bonuses", "Welcome offers, wagering, expiry, free spins and restrictions."],
  ["responsible-gambling", "Responsible Gambling", "Limits, time management, cooling-off and self-exclusion education."],
  ["casino-reviews", "Casino Reviews", "How editorial casino profiles and their limitations should be read."],
  ["casino-safety", "Casino Safety", "Trust signals, account checks, security and safer comparison habits."],
  ["payments", "Payments", "Deposits, withdrawals, verification, fees and payout timing."],
  ["licensing", "Licensing", "Regulators, operator identity, registers and the limits of a licence."],
  ["game-guides", "Game Guides", "Game mechanics, RTP, volatility and bonus contribution basics."],
  ["sports-betting-basics", "Sports Betting Basics", "Non-promotional explanations of odds, markets and terminology."],
  ["crypto-casinos", "Crypto Casinos", "Wallets, payments, volatility, fees and operator restrictions."],
  ["country-guides", "Country Guides", "Jurisdiction-specific availability, licensing and payment context."],
  ["casino-glossary", "Casino Glossary", "Plain-language definitions for gambling and comparison terms."],
  ["industry-news", "Industry News", "How to assess regulatory and operator announcements against sources."],
];

export const learningCategories: LearningCategory[] = categories.map(([slug, title, description], index, all) => ({
  slug,
  title,
  description,
  longDescription: description,
  relatedCategories: [all[(index + 1) % all.length][0], all[(index + 2) % all.length][0]],
  plannedTopics: [],
  faq: [],
}));

// Kept as a presentation type compatibility export; no route reads paths as
// Article content or publication authority.
export const learningPaths: LearningPath[] = [];

export function getLearningCategory(slug: string) {
  return learningCategories.find((category) => category.slug === slug);
}

export function getRelatedCategories(category: LearningCategory) {
  return category.relatedCategories.map(getLearningCategory).filter((item): item is LearningCategory => Boolean(item));
}

export function getAuthor(id: string) {
  return learningAuthors.find((author) => author.id === id) ?? learningAuthors[0];
}

export function getCategoryPath(slug: string) {
  return `/learn/${slug}`;
}

export function getArticlePath(article: { categorySlug: string; slug: string }) {
  return `/learn/${article.categorySlug}/${article.slug}`;
}
