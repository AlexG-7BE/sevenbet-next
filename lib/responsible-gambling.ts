export type ProtectedHelpArticle = {
  slug: string;
  title: string;
  summary: string;
  category: "Responsible Gambling Tools" | "Time Management";
  readingTime: string;
  takeaways: string[];
  sections: Array<{ title: string; body: string }>;
};

export type LegacyResponsibleGamblingClassification = "HELP" | "EDUCATION" | "RETIRED";

export type LegacyResponsibleGamblingRoute = {
  classification: LegacyResponsibleGamblingClassification;
  destination: string;
  reason: string;
};

/**
 * Explicit authority for every former /responsible-gambling/<slug> article.
 * Destinations are fixed same-origin paths; request input never selects a host.
 */
export const LEGACY_RESPONSIBLE_GAMBLING_ROUTES = {
  budgeting: {
    classification: "EDUCATION",
    destination: "/learn/responsible-gambling/responsible-gambling-tools",
    reason: "Budget planning is educational context, not an immediate Help action or access control.",
  },
  "time-management": {
    classification: "EDUCATION",
    destination: "/learn/responsible-gambling/responsible-gambling-tools",
    reason: "Session planning is educational context; the canonical Learn guide covers reminders and time controls.",
  },
  "bonus-terms": {
    classification: "EDUCATION",
    destination: "/learn/casino-bonuses/welcome-bonus-terms",
    reason: "Bonus mechanics belong to the published Learn bonus guide, not Protected Help.",
  },
  "self-exclusion": {
    classification: "HELP",
    destination: "/help/self-exclusion",
    reason: "Self-exclusion is a direct access-control action with an official support destination.",
  },
  "deposit-limits": {
    classification: "HELP",
    destination: "/help/deposit-limits",
    reason: "A deposit limit is a direct account control that can cap access to funds.",
  },
  "cooling-off": {
    classification: "HELP",
    destination: "/help/cooling-off",
    reason: "Cooling-off is a direct temporary pause control and remains fail-closed where local terms are unverified.",
  },
  "reality-checks": {
    classification: "HELP",
    destination: "/help/reality-checks",
    reason: "Reality checks are direct in-session controls that interrupt continuous play.",
  },
  "casino-licenses": {
    classification: "EDUCATION",
    destination: "/learn/licensing/casino-licenses-explained",
    reason: "Licence interpretation is educational trust context owned by Learn.",
  },
  "payment-safety": {
    classification: "EDUCATION",
    destination: "/learn/payments/casino-payment-methods",
    reason: "Payment and withdrawal mechanics are educational comparison context owned by Learn.",
  },
  faq: {
    classification: "EDUCATION",
    destination: "/learn/responsible-gambling",
    reason: "The mixed FAQ is redundant with the canonical Responsible Gambling Learn category and its published guide.",
  },
} as const satisfies Record<string, LegacyResponsibleGamblingRoute>;

export type LegacyResponsibleGamblingSlug = keyof typeof LEGACY_RESPONSIBLE_GAMBLING_ROUTES;

export const protectedHelpArticles: ProtectedHelpArticle[] = [
  {
    slug: "self-exclusion",
    title: "Understanding Self-Exclusion",
    summary: "Learn what self-exclusion means, how it differs from short pauses and what to check before using it.",
    category: "Responsible Gambling Tools",
    readingTime: "5 min read",
    takeaways: [
      "Self-exclusion is a longer access restriction offered by many operators or jurisdictions.",
      "It is different from a short cooling-off period.",
      "Users should review scope, duration and account implications before activating it.",
    ],
    sections: [
      {
        title: "What self-exclusion does",
        body: "Self-exclusion is designed to block access to gambling services for a chosen or required period. The details depend on the operator, regulator and local tools available.",
      },
      {
        title: "Scope and duration",
        body: "Some self-exclusion tools apply to one operator, while others may apply across licensed operators in a jurisdiction. Always check how broad the restriction is.",
      },
      {
        title: "When to consider it",
        body: "Self-exclusion may be useful when ordinary planning tools are not enough to maintain control. B4GAMBLE presents this as education, not medical advice.",
      },
    ],
  },
  {
    slug: "deposit-limits",
    title: "Deposit Limits Explained",
    summary: "Learn how deposit limits work and how they can support a pre-planned gambling budget.",
    category: "Responsible Gambling Tools",
    readingTime: "4 min read",
    takeaways: [
      "Deposit limits set a maximum amount that can be deposited over a period.",
      "Limits are most useful when chosen before gambling starts.",
      "Increasing a limit during emotional moments can weaken the original plan.",
    ],
    sections: [
      {
        title: "What deposit limits do",
        body: "Deposit limits restrict how much money can be added to an account during a defined period, such as a day, week or month.",
      },
      {
        title: "Choose the period carefully",
        body: "Daily limits can help with short sessions, while weekly or monthly limits may better match an entertainment budget.",
      },
      {
        title: "Avoid reactive changes",
        body: "A limit chosen before play is more useful than a limit changed after losses, frustration or bonus pressure.",
      },
    ],
  },
  {
    slug: "cooling-off",
    title: "Cooling-Off Periods Explained",
    summary: "Understand temporary pauses and how they can help slow decisions during emotional or automatic play.",
    category: "Responsible Gambling Tools",
    readingTime: "4 min read",
    takeaways: [
      "Cooling-off is a temporary break from gambling access.",
      "It can be useful when decisions feel rushed or emotional.",
      "It is not the same as a long-term self-exclusion tool.",
    ],
    sections: [
      {
        title: "What cooling-off means",
        body: "A cooling-off period is a temporary pause that limits access for a set time. The purpose is to create space before making another gambling decision.",
      },
      {
        title: "When it may be useful",
        body: "Cooling-off can be useful after a frustrating session, when chasing losses feels tempting or when a bonus deadline creates pressure.",
      },
      {
        title: "What to do during the pause",
        body: "Use the pause to review budget, time, triggers and whether continuing matches the plan created before gambling.",
      },
    ],
  },
  {
    slug: "reality-checks",
    title: "Reality Checks and Session Reminders",
    summary: "Learn how reminders can help users notice time, spending and decision drift during play.",
    category: "Time Management",
    readingTime: "4 min read",
    takeaways: [
      "Reality checks are prompts that interrupt continuous play.",
      "They are most useful when tied to a clear action.",
      "A reminder should encourage review, not automatic continuation.",
    ],
    sections: [
      {
        title: "What reality checks show",
        body: "Reality checks may display time spent, balance changes or session duration. The exact design depends on the operator.",
      },
      {
        title: "Make the reminder actionable",
        body: "A reminder works better when the user has already decided what to do when it appears, such as checking the budget or ending the session.",
      },
      {
        title: "Combine with other tools",
        body: "Reality checks are not a complete plan by themselves. They work best with deposit limits, time limits and cooling-off options.",
      },
    ],
  },
];

export function getProtectedHelpArticle(slug: string) {
  return protectedHelpArticles.find((article) => article.slug === slug);
}

export function getLegacyResponsibleGamblingRoute(slug: string) {
  return Object.prototype.hasOwnProperty.call(LEGACY_RESPONSIBLE_GAMBLING_ROUTES, slug)
    ? LEGACY_RESPONSIBLE_GAMBLING_ROUTES[slug as LegacyResponsibleGamblingSlug]
    : null;
}

export function withPreservedLegacyQuery(
  destination: string,
  searchParams: Record<string, string | string[] | undefined>,
) {
  if (!/^\/(?:help|learn)(?:\/|$)/.test(destination)) {
    throw new Error("Invalid legacy Responsible Gambling destination");
  }
  const query = new URLSearchParams();
  for (const [key, rawValue] of Object.entries(searchParams)) {
    const values = Array.isArray(rawValue) ? rawValue : [rawValue];
    for (const value of values) {
      if (value !== undefined) query.append(key, value);
    }
  }
  const serialized = query.toString();
  return serialized ? `${destination}?${serialized}` : destination;
}
