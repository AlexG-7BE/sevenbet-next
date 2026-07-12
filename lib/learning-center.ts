export type LearningDifficulty = "Beginner" | "Intermediate" | "Advanced";

export type LearningCategory = {
  slug: string;
  title: string;
  description: string;
  longDescription: string;
  relatedCategories: string[];
  plannedTopics: string[];
  faq: Array<[string, string]>;
};

export type LearningAuthor = {
  id: string;
  name: string;
  role: string;
  bio: string;
};

export type LearningArticle = {
  slug: string;
  categorySlug: string;
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
  sections: Array<{ title: string; body: string }>;
  examples: string[];
  callout: { title: string; text: string };
  faq: Array<[string, string]>;
  relatedArticles: string[];
  nextReading?: string;
};

export type LearningPath = {
  slug: string;
  title: string;
  description: string;
  difficulty: LearningDifficulty;
  articleSlugs: string[];
};

export const learningTags = [
  "Bonuses",
  "Payments",
  "Crypto",
  "Blackjack",
  "Slots",
  "Poker",
  "RTP",
  "Volatility",
  "Responsible Gambling",
  "Licensing",
  "Security",
  "Reviews",
  "Sports Betting",
  "Glossary",
  "Country Guides",
];

export const learningAuthors: LearningAuthor[] = [
  {
    id: "sevenbet-editorial",
    name: "SevenBet Editorial Team",
    role: "Author",
    bio: "Creates educational guides and casino comparison resources using the SevenBet editorial methodology.",
  },
  {
    id: "sevenbet-review-desk",
    name: "SevenBet Review Desk",
    role: "Editor",
    bio: "Reviews learning content for clarity, internal linking, responsible gambling context, and editorial consistency.",
  },
];

export const learningCategories: LearningCategory[] = [
  {
    slug: "casino-basics",
    title: "Casino Basics",
    description: "Start here for core casino terminology, account basics, and beginner concepts.",
    longDescription:
      "Casino Basics organizes beginner-friendly explanations for readers who need plain-language context before comparing operators, bonuses, games, or payment methods.",
    relatedCategories: ["casino-glossary", "casino-bonuses", "casino-safety"],
    plannedTopics: ["How online casinos work", "What to check before registering", "Common casino account terms"],
    faq: [
      ["Who is this category for?", "It is for readers who want basic explanations before comparing casinos or bonuses."],
      ["Does this category recommend casinos?", "No. It explains concepts and links to reviews where relevant."],
    ],
  },
  {
    slug: "casino-bonuses",
    title: "Casino Bonuses",
    description: "Learn welcome offers, wagering, expiry windows, free spins, and bonus restrictions.",
    longDescription:
      "Casino Bonuses focuses on understanding offer mechanics before users compare headline amounts or follow operator links.",
    relatedCategories: ["casino-basics", "payments", "responsible-gambling"],
    plannedTopics: ["Welcome bonuses", "No-deposit bonuses", "Free spins", "Wagering examples"],
    faq: [
      ["Is the largest bonus always better?", "No. Wagering, expiry, game contribution, and withdrawal rules matter."],
      ["Can bonus terms change?", "Yes. Users should review current operator terms before accepting an offer."],
    ],
  },
  {
    slug: "responsible-gambling",
    title: "Responsible Gambling",
    description: "Educational guides about limits, time management, cooling-off, and self-exclusion.",
    longDescription:
      "Responsible Gambling collects practical education about planning, limits, and tools without presenting SevenBet as a healthcare provider.",
    relatedCategories: ["casino-bonuses", "casino-safety", "casino-basics"],
    plannedTopics: ["Deposit limits", "Reality checks", "Cooling-off periods", "Self-exclusion"],
    faq: [
      ["Is this medical advice?", "No. SevenBet provides educational information, not diagnosis or treatment."],
      ["Where should I start?", "Start with the 10-Step Program or the Responsible Gambling Hub."],
    ],
  },
  {
    slug: "casino-reviews",
    title: "Casino Reviews",
    description: "Understand how SevenBet reviews casinos, scores profiles, and compares operator information.",
    longDescription:
      "Casino Reviews explains editorial scoring, review limitations, and how review pages should be read alongside methodology and disclosure.",
    relatedCategories: ["casino-safety", "licensing", "casino-basics"],
    plannedTopics: ["Editor's Score", "Review limitations", "Comparison tables"],
    faq: [
      ["Are reviews guarantees?", "No. Reviews are editorial assessments, not guarantees of outcomes or operator conduct."],
      ["Where is the scoring model explained?", "The Methodology page explains the scoring framework."],
    ],
  },
  {
    slug: "casino-safety",
    title: "Casino Safety",
    description: "Learn trust signals, account checks, security basics, and safer comparison habits.",
    longDescription:
      "Casino Safety brings together licensing, security, account verification, responsible gambling tools, and operator transparency.",
    relatedCategories: ["licensing", "payments", "responsible-gambling"],
    plannedTopics: ["Trust signals", "Account verification", "Security basics"],
    faq: [
      ["Does a trust signal remove risk?", "No. It is one factor to review alongside terms, licensing, and limits."],
      ["What should I check first?", "Start with license information, payment rules, and responsible gambling tools."],
    ],
  },
  {
    slug: "payments",
    title: "Payments",
    description: "Deposits, withdrawals, fees, payment methods, verification, and payout timing.",
    longDescription:
      "Payments explains how casino banking information should be reviewed before any deposit or bonus decision.",
    relatedCategories: ["casino-safety", "crypto-casinos", "casino-bonuses"],
    plannedTopics: ["Withdrawal times", "KYC", "Payment fees", "E-wallets"],
    faq: [
      ["Are deposits and withdrawals the same?", "No. Fast deposits do not always mean fast withdrawals."],
      ["Why does verification matter?", "Identity checks can affect withdrawal timing and account access."],
    ],
  },
  {
    slug: "licensing",
    title: "Licensing",
    description: "Understand casino licenses, regulators, operator names, and public register checks.",
    longDescription:
      "Licensing helps readers understand what a license can indicate, what it cannot prove, and what details to verify.",
    relatedCategories: ["casino-safety", "casino-reviews", "country-guides"],
    plannedTopics: ["License numbers", "Regulator registers", "Restricted jurisdictions"],
    faq: [
      ["Does a license guarantee everything?", "No. A license is an important signal, but it does not remove gambling risk."],
      ["What details matter?", "Operator name, license authority, domain, terms, and complaint routes can all matter."],
    ],
  },
  {
    slug: "game-guides",
    title: "Game Guides",
    description: "Slots, blackjack, poker, live casino, RTP, volatility, and game contribution basics.",
    longDescription:
      "Game Guides explains game mechanics and terminology so readers can understand how games relate to bonuses and risk.",
    relatedCategories: ["casino-glossary", "casino-bonuses", "casino-basics"],
    plannedTopics: ["Slots basics", "Blackjack basics", "Poker basics", "RTP and volatility"],
    faq: [
      ["Does SevenBet teach winning systems?", "No. Game guides explain terminology and mechanics, not promised results."],
      ["Why do game types matter?", "Games may contribute differently to wagering requirements."],
    ],
  },
  {
    slug: "sports-betting-basics",
    title: "Sports Betting Basics",
    description: "Introductory sports betting terminology, markets, odds, and responsible betting concepts.",
    longDescription:
      "Sports Betting Basics is a future learning area for users who need non-promotional explanations before comparing sportsbook offers.",
    relatedCategories: ["responsible-gambling", "payments", "casino-glossary"],
    plannedTopics: ["Odds basics", "Bet types", "Betting limits", "Sportsbook terms"],
    faq: [
      ["Is this a picks section?", "No. It is educational, not betting advice."],
      ["Will it cover odds?", "Yes. Odds terminology and market basics are planned."],
    ],
  },
  {
    slug: "crypto-casinos",
    title: "Crypto Casinos",
    description: "Crypto payments, wallet basics, volatility, blockchain terminology, and casino restrictions.",
    longDescription:
      "Crypto Casinos explains crypto-related casino concepts without treating crypto speed or flexibility as a reason to ignore risk.",
    relatedCategories: ["payments", "casino-safety", "licensing"],
    plannedTopics: ["Crypto deposits", "Wallet basics", "Stablecoins", "Blockchain fees"],
    faq: [
      ["Are crypto casinos always faster?", "Not always. Operator review, verification, network conditions, and rules can still affect timing."],
      ["Does crypto remove gambling risk?", "No. It can add payment complexity and volatility."],
    ],
  },
  {
    slug: "country-guides",
    title: "Country Guides",
    description: "Country-specific availability, licensing context, payment notes, and local comparison reminders.",
    longDescription:
      "Country Guides is designed for future jurisdiction-specific education with careful reminders to verify local legality and operator availability.",
    relatedCategories: ["licensing", "payments", "casino-safety"],
    plannedTopics: ["UK casino guide", "Canada casino guide", "Ireland casino guide", "Payment availability by country"],
    faq: [
      ["Does SevenBet provide legal advice?", "No. Country guides are educational and should not replace local legal review."],
      ["Can availability change?", "Yes. Operator availability can change by country and license."],
    ],
  },
  {
    slug: "casino-glossary",
    title: "Casino Glossary",
    description: "Definitions for casino, bonus, review, payment, and responsible gambling terminology.",
    longDescription:
      "Casino Glossary is the dictionary layer of the Learning Center and should support internal links across all guides.",
    relatedCategories: ["casino-basics", "game-guides", "casino-bonuses"],
    plannedTopics: ["Wagering", "RTP", "Volatility", "KYC", "Self-exclusion"],
    faq: [
      ["What is this category for?", "It defines common terms used across SevenBet guides and reviews."],
      ["Will glossary terms link to guides?", "Yes. The architecture supports internal linking from terms to full guides."],
    ],
  },
  {
    slug: "industry-news",
    title: "Industry News",
    description: "Editorial updates about regulation, operator changes, product updates, and industry context.",
    longDescription:
      "Industry News is planned as a careful update feed for factual context, not promotional casino news.",
    relatedCategories: ["licensing", "casino-reviews", "country-guides"],
    plannedTopics: ["Regulatory updates", "License changes", "Payment changes", "Operator announcements"],
    faq: [
      ["Is this a promotional news feed?", "No. It is intended for factual context and editorial updates."],
      ["Will news affect reviews?", "Major operator or licensing changes may trigger review updates."],
    ],
  },
];

function articleTemplate({
  slug,
  categorySlug,
  title,
  summary,
  tags,
  difficulty = "Beginner",
  featured = false,
  popular = false,
}: {
  slug: string;
  categorySlug: string;
  title: string;
  summary: string;
  tags: string[];
  difficulty?: LearningDifficulty;
  featured?: boolean;
  popular?: boolean;
}): LearningArticle {
  return {
    slug,
    categorySlug,
    title,
    summary,
    difficulty,
    readingTime: "6 min read",
    tags,
    authorId: "sevenbet-editorial",
    editorId: "sevenbet-review-desk",
    lastUpdated: "2026-07-12",
    featured,
    popular,
    takeaways: [
      "Start with the concept before comparing casino offers.",
      "Use SevenBet methodology and responsible gambling context together.",
      "Review current operator terms before registering or depositing.",
    ],
    sections: [
      {
        title: "What this topic covers",
        body: `${title} explains the core ideas a reader should understand before relying on casino comparisons, bonus pages, or operator information.`,
      },
      {
        title: "Why it matters",
        body: "Casino information can be fragmented or promotional. A structured guide helps readers compare terms, risks, and practical details in a calmer way.",
      },
      {
        title: "How to use it on SevenBet",
        body: "Read the guide, follow related category links, review the methodology, and use the 10-Step Program or self-check when decisions feel unclear.",
      },
    ],
    examples: [
      "A reader checks the glossary term first, then opens a detailed guide and a related casino review.",
      "A reader compares the concept against their own budget, time limit, and local availability before continuing.",
    ],
    callout: {
      title: "Editorial note",
      text: "This article is educational. It does not guarantee outcomes, operator conduct, withdrawals, or dispute results.",
    },
    faq: [
      ["Is this advice?", "No. This is educational information designed to support clearer comparison and decision-making."],
      ["Where should I go next?", "Use the related articles and learning paths at the end of the guide."],
    ],
    relatedArticles: [],
  };
}

export const learningArticles: LearningArticle[] = [
  articleTemplate({
    slug: "online-casino-basics",
    categorySlug: "casino-basics",
    title: "Online Casino Basics",
    summary: "A beginner-friendly overview of accounts, terms, games, payments, and comparison checkpoints.",
    tags: ["Glossary", "Security"],
    featured: true,
    popular: true,
  }),
  articleTemplate({
    slug: "welcome-bonus-terms",
    categorySlug: "casino-bonuses",
    title: "How Welcome Bonus Terms Work",
    summary: "Understand wagering, expiry, game contribution, maximum bet rules, and withdrawal restrictions.",
    tags: ["Bonuses", "RTP", "Responsible Gambling"],
    featured: true,
    popular: true,
  }),
  articleTemplate({
    slug: "responsible-gambling-tools",
    categorySlug: "responsible-gambling",
    title: "Responsible Gambling Tools Explained",
    summary: "Learn how deposit limits, session reminders, cooling-off, and self-exclusion tools may work.",
    tags: ["Responsible Gambling", "Security"],
    featured: true,
    popular: true,
  }),
  articleTemplate({
    slug: "how-casino-reviews-work",
    categorySlug: "casino-reviews",
    title: "How Casino Reviews Work",
    summary: "A guide to editorial scoring, review criteria, limitations, and responsible comparison.",
    tags: ["Reviews", "Licensing", "Security"],
    featured: true,
  }),
  articleTemplate({
    slug: "casino-safety-checklist",
    categorySlug: "casino-safety",
    title: "Casino Safety Checklist",
    summary: "A practical checklist for reviewing licenses, terms, payments, security, and support information.",
    tags: ["Security", "Licensing", "Payments"],
    popular: true,
  }),
  articleTemplate({
    slug: "casino-payment-methods",
    categorySlug: "payments",
    title: "Casino Payment Methods Explained",
    summary: "Compare deposits, withdrawals, verification, processing times, fees, and currencies.",
    tags: ["Payments", "Security"],
    featured: true,
  }),
  articleTemplate({
    slug: "casino-licenses-explained",
    categorySlug: "licensing",
    title: "Casino Licenses Explained",
    summary: "What licenses can indicate, what they cannot prove, and which details users should verify.",
    tags: ["Licensing", "Security", "Country Guides"],
    popular: true,
  }),
  articleTemplate({
    slug: "rtp-and-volatility",
    categorySlug: "game-guides",
    title: "RTP and Volatility Explained",
    summary: "Understand two common game terms and why they should not be read as outcome guarantees.",
    tags: ["RTP", "Volatility", "Slots"],
  }),
  articleTemplate({
    slug: "sports-betting-odds-basics",
    categorySlug: "sports-betting-basics",
    title: "Sports Betting Odds Basics",
    summary: "A non-promotional introduction to odds formats, implied probability, and betting terminology.",
    tags: ["Sports Betting", "Glossary"],
  }),
  articleTemplate({
    slug: "crypto-casino-payments",
    categorySlug: "crypto-casinos",
    title: "Crypto Casino Payments",
    summary: "Understand crypto deposits, withdrawals, wallets, volatility, and operator restrictions.",
    tags: ["Crypto", "Payments", "Security"],
  }),
  articleTemplate({
    slug: "country-guide-structure",
    categorySlug: "country-guides",
    title: "How Country Casino Guides Should Be Read",
    summary: "Learn how to use country-level availability, payment, and licensing context responsibly.",
    tags: ["Country Guides", "Licensing", "Payments"],
  }),
  articleTemplate({
    slug: "casino-glossary-starter",
    categorySlug: "casino-glossary",
    title: "Casino Glossary Starter",
    summary: "A starter guide to common terms such as wagering, KYC, RTP, volatility, and self-exclusion.",
    tags: ["Glossary", "Bonuses", "Security"],
    featured: true,
  }),
  articleTemplate({
    slug: "how-to-read-industry-news",
    categorySlug: "industry-news",
    title: "How to Read Casino Industry News",
    summary: "Understand regulatory updates, operator announcements, and why news should be checked against sources.",
    tags: ["Licensing", "Reviews", "Country Guides"],
  }),
].map((article, _index, allArticles) => ({
  ...article,
  relatedArticles: allArticles
    .filter((item) => item.slug !== article.slug && item.categorySlug !== article.categorySlug)
    .slice(0, 3)
    .map((item) => item.slug),
  nextReading: allArticles.find((item) => item.slug !== article.slug)?.slug,
}));

export const learningPaths: LearningPath[] = [
  {
    slug: "beginner",
    title: "Beginner",
    description: "Start with casino basics, glossary terms, responsible gambling tools, and safety checks.",
    difficulty: "Beginner",
    articleSlugs: ["online-casino-basics", "casino-glossary-starter", "responsible-gambling-tools"],
  },
  {
    slug: "casino-bonuses",
    title: "Casino Bonuses",
    description: "Learn how bonus terms, wagering, and payment restrictions affect offer comparison.",
    difficulty: "Beginner",
    articleSlugs: ["welcome-bonus-terms", "casino-payment-methods", "responsible-gambling-tools"],
  },
  {
    slug: "responsible-gambling",
    title: "Responsible Gambling",
    description: "Review limits, tools, self-checking, and safer comparison habits.",
    difficulty: "Beginner",
    articleSlugs: ["responsible-gambling-tools", "online-casino-basics", "casino-safety-checklist"],
  },
  {
    slug: "choosing-casinos",
    title: "Choosing Casinos",
    description: "Understand reviews, licensing, safety checks, and payment information before comparing operators.",
    difficulty: "Intermediate",
    articleSlugs: ["how-casino-reviews-work", "casino-licenses-explained", "casino-safety-checklist"],
  },
  {
    slug: "payments",
    title: "Payments",
    description: "Compare banking methods, verification, crypto notes, and withdrawal conditions.",
    difficulty: "Intermediate",
    articleSlugs: ["casino-payment-methods", "crypto-casino-payments", "casino-safety-checklist"],
  },
  {
    slug: "crypto",
    title: "Crypto",
    description: "Learn crypto casino payment basics, safety context, and licensing considerations.",
    difficulty: "Intermediate",
    articleSlugs: ["crypto-casino-payments", "casino-payment-methods", "casino-licenses-explained"],
  },
];

export function getLearningCategory(slug: string) {
  return learningCategories.find((category) => category.slug === slug);
}

export function getLearningArticle(categorySlug: string, articleSlug: string) {
  return learningArticles.find((article) => article.categorySlug === categorySlug && article.slug === articleSlug);
}

export function getArticleBySlug(slug: string) {
  return learningArticles.find((article) => article.slug === slug);
}

export function getArticlesByCategory(categorySlug: string) {
  return learningArticles.filter((article) => article.categorySlug === categorySlug);
}

export function getRelatedArticles(article: LearningArticle) {
  return article.relatedArticles
    .map((slug) => getArticleBySlug(slug))
    .filter((item): item is LearningArticle => Boolean(item));
}

export function getRelatedCategories(category: LearningCategory) {
  return category.relatedCategories
    .map((slug) => getLearningCategory(slug))
    .filter((item): item is LearningCategory => Boolean(item));
}

export function getAuthor(id: string) {
  return learningAuthors.find((author) => author.id === id) || learningAuthors[0];
}

export function getCategoryPath(slug: string) {
  return `/learn/${slug}`;
}

export function getArticlePath(article: LearningArticle) {
  return `/learn/${article.categorySlug}/${article.slug}`;
}
