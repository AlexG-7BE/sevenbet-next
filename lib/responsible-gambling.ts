export type LearningCategory = {
  id: string;
  title: string;
  description: string;
};

export type LearningArticle = {
  slug: string;
  title: string;
  summary: string;
  category: string;
  readingTime: string;
  takeaways: string[];
  sections: Array<{ title: string; body: string }>;
  examples: string[];
  tips: string[];
  faq: Array<[string, string]>;
  related: string[];
  next: string;
};

export const learningCategories: LearningCategory[] = [
  {
    id: "bonus-education",
    title: "Bonus Education",
    description: "Understand wagering, expiry windows, game contribution and common bonus terms.",
  },
  {
    id: "casino-safety",
    title: "Casino Safety",
    description: "Learn how licensing, account checks, payments and operator transparency work.",
  },
  {
    id: "money-management",
    title: "Money Management",
    description: "Build simple rules for deposits, loss boundaries and bankroll decisions.",
  },
  {
    id: "time-management",
    title: "Time Management",
    description: "Use session planning, time reminders and breaks to reduce automatic play.",
  },
  {
    id: "casino-reviews-explained",
    title: "Casino Reviews Explained",
    description: "See how SevenBet compares casinos using factual criteria and visible risk context.",
  },
  {
    id: "responsible-gambling-tools",
    title: "Responsible Gambling Tools",
    description: "Learn what deposit limits, reality checks, cooling-off and self-exclusion options do.",
  },
  {
    id: "industry-basics",
    title: "Industry Basics",
    description: "Plain-language definitions for common gambling and iGaming terminology.",
  },
];

export const responsibleTools = [
  {
    title: "Deposit limits",
    description: "Set a maximum deposit amount for a defined period before any gambling session starts.",
    href: "/responsible-gambling/deposit-limits",
  },
  {
    title: "Loss limits",
    description: "Create a boundary for how much money can be lost before play should stop.",
    href: "/responsible-gambling/budgeting",
  },
  {
    title: "Session reminders",
    description: "Use reminders to notice elapsed time and interrupt automatic decisions.",
    href: "/responsible-gambling/time-management",
  },
  {
    title: "Cooling-off periods",
    description: "Use a temporary pause when decisions feel rushed, emotional or connected to losses.",
    href: "/responsible-gambling/cooling-off",
  },
  {
    title: "Self-exclusion options",
    description: "A longer access block that may be useful when ordinary limits are not enough.",
    href: "/responsible-gambling/self-exclusion",
  },
  {
    title: "Reality checks",
    description: "On-screen notices that show session duration and help users pause before continuing.",
    href: "/responsible-gambling/reality-checks",
  },
];

export const learningPaths = [
  {
    title: "New to Online Casinos",
    summary: "Start with terminology, licensing and basic decision checks before comparing offers.",
    links: ["bonus-terms", "casino-licenses", "payment-safety"],
  },
  {
    title: "Understanding Bonus Terms",
    summary: "Learn wagering, expiry windows and practical offer comparison rules.",
    links: ["bonus-terms", "deposit-limits", "reality-checks"],
  },
  {
    title: "Managing Your Gambling Budget",
    summary: "Create deposit rules, loss boundaries and decision checkpoints.",
    links: ["budgeting", "deposit-limits", "cooling-off"],
  },
  {
    title: "Choosing Licensed Casinos",
    summary: "Review licensing signals, payment safety and comparison methodology.",
    links: ["casino-licenses", "payment-safety", "bonus-terms"],
  },
  {
    title: "Safer Gambling Tools",
    summary: "Understand player protection tools and when each one may be useful.",
    links: ["deposit-limits", "reality-checks", "self-exclusion"],
  },
];

export const practicalTools = [
  {
    title: "Budget planning worksheet",
    text: "Define a fixed entertainment budget, essential expenses and a stop point before gambling.",
    href: "/tools/budget-calculator",
  },
  {
    title: "Session planning checklist",
    text: "Set a start time, end time, deposit limit and reason to stop before logging in.",
    href: "/responsible-gambling/time-management",
  },
  {
    title: "Bonus comparison guide",
    text: "Compare wagering, expiry, maximum bet rules and payment restrictions before accepting a bonus.",
    href: "/responsible-gambling/bonus-terms",
  },
  {
    title: "Casino evaluation checklist",
    text: "Review license, payment methods, withdrawal speed, support and responsible gambling tools.",
    href: "/responsible-gambling/casino-licenses",
  },
  {
    title: "Decision checklist before registering",
    text: "Pause and confirm budget, time, terms and local legality before opening an operator page.",
    href: "/program",
  },
];

export const learningArticles: LearningArticle[] = [
  {
    slug: "budgeting",
    title: "Budgeting for Gambling Decisions",
    summary: "A practical guide to setting an entertainment budget, deposit boundary and stop rule before gambling.",
    category: "Money Management",
    readingTime: "6 min read",
    takeaways: [
      "A gambling budget should only use money that is not needed for essentials.",
      "The limit is set before the session, not while emotions are active.",
      "A stop rule is more useful when it includes both money and time.",
    ],
    sections: [
      {
        title: "Start with essentials",
        body: "Responsible budgeting begins by separating essential expenses from optional entertainment money. Rent, bills, food, debt payments and savings goals should be protected before any gambling budget is considered.",
      },
      {
        title: "Use a fixed session amount",
        body: "A session budget is a maximum amount, not a target to spend. Decide the amount before opening a casino account and avoid increasing it during the same day.",
      },
      {
        title: "Plan the stop point",
        body: "A useful budget includes a stop point for losses, wins and time. Writing the rule in advance makes it easier to notice when a session is drifting.",
      },
    ],
    examples: [
      "A user sets a weekly entertainment budget and decides that gambling, streaming subscriptions and games all come from the same optional category.",
      "Before reviewing offers, a user sets a maximum deposit and decides not to increase it after a loss.",
    ],
    tips: [
      "Keep the budget separate from essential money.",
      "Use deposit limits where available.",
      "Write the stop rule before the session starts.",
      "Do not treat bonus size as a reason to increase the budget.",
    ],
    faq: [
      ["Should a bonus change my budget?", "No. A bonus should be evaluated inside the budget you already set."],
      ["What if I want to increase my limit?", "Pause first. Changing limits during or immediately after a session can make decisions less controlled."],
      ["Is budgeting enough by itself?", "No. It is an educational planning tool. It works best with time limits, deposit limits and calm decision-making."],
    ],
    related: ["deposit-limits", "time-management", "bonus-terms"],
    next: "deposit-limits",
  },
  {
    slug: "time-management",
    title: "Time Management for Gambling Sessions",
    summary: "Learn how to plan session length, use reminders and take breaks before decisions become automatic.",
    category: "Time Management",
    readingTime: "5 min read",
    takeaways: [
      "Time limits work best when set before the session starts.",
      "Session reminders help interrupt automatic play.",
      "Breaks make it easier to review whether the original plan still makes sense.",
    ],
    sections: [
      {
        title: "Why time planning matters",
        body: "Many gambling decisions happen quickly. Time planning gives users a simple checkpoint to pause, review the budget and decide whether continuing still matches the original plan.",
      },
      {
        title: "Use a start and end time",
        body: "A session plan should include both a start time and an end time. Open-ended sessions are harder to evaluate and can make bonus expiry windows feel more urgent.",
      },
      {
        title: "Add a review moment",
        body: "A reminder is most useful when it asks a concrete question: am I still inside my budget, time limit and original reason for playing?",
      },
    ],
    examples: [
      "A user sets a 30-minute session and a phone timer before logging in.",
      "A user decides that any session running past the planned time ends without adding another deposit.",
    ],
    tips: [
      "Use casino session reminders if available.",
      "Set an external timer as a backup.",
      "Avoid starting a session when tired, rushed or distracted.",
      "Treat bonus expiry pressure as a reason to slow down, not speed up.",
    ],
    faq: [
      ["How long should a gambling session be?", "SevenBet does not prescribe a session length. The important step is choosing a limit in advance and respecting it."],
      ["Are session reminders enough?", "They are useful prompts, but they work best with budget limits and clear stop rules."],
      ["Can I continue after the timer?", "Pause first and review the original plan. Avoid extending sessions to recover losses."],
    ],
    related: ["reality-checks", "cooling-off", "budgeting"],
    next: "reality-checks",
  },
  {
    slug: "bonus-terms",
    title: "How Casino Bonus Terms Work",
    summary: "Understand wagering requirements, expiry windows, maximum bet rules and game contribution before comparing offers.",
    category: "Bonus Education",
    readingTime: "8 min read",
    takeaways: [
      "The headline bonus amount is only one part of the offer.",
      "Wagering requirements show how much play may be needed before withdrawal.",
      "Expiry, max bet rules and restricted games can materially change an offer.",
    ],
    sections: [
      {
        title: "Look beyond the headline",
        body: "A large welcome offer can still be restrictive if the wagering requirement is high, the expiry window is short or many games contribute at a reduced rate.",
      },
      {
        title: "Wagering requirement",
        body: "A x35 wagering requirement usually means the relevant bonus amount must be wagered 35 times before bonus-related withdrawals may be available, subject to operator terms.",
      },
      {
        title: "Game contribution and max bets",
        body: "Some games may contribute less to wagering, and some offers set a maximum bet while the bonus is active. Breaking those rules may void bonus-related winnings.",
      },
    ],
    examples: [
      "A $100 bonus with x35 wagering may imply $3,500 in example wagering volume before withdrawal rules are met.",
      "A short expiry window can create pressure to play longer than planned.",
    ],
    tips: [
      "Compare wagering before comparing bonus size.",
      "Check expiry and maximum bet rules.",
      "Review whether preferred games contribute to wagering.",
      "Do not accept a bonus if the terms require changing your budget or session time.",
    ],
    faq: [
      ["What is a wagering requirement?", "It is a rule describing how much qualifying play may be required before bonus-related withdrawals are allowed."],
      ["Are lower wagering requirements better?", "Lower wagering is generally easier to understand and evaluate, but all terms still matter."],
      ["Should I accept every welcome bonus?", "No. Compare the terms against your budget, time limit and level of understanding."],
    ],
    related: ["budgeting", "deposit-limits", "casino-licenses"],
    next: "casino-licenses",
  },
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
        body: "Self-exclusion may be useful when ordinary planning tools are not enough to maintain control. SevenBet presents this as education, not medical advice.",
      },
    ],
    examples: [
      "A user who repeatedly changes deposit limits may review self-exclusion options instead of comparing more offers.",
      "A user checks whether a national self-exclusion scheme covers multiple licensed sites.",
    ],
    tips: [
      "Read the duration and scope carefully.",
      "Check whether withdrawals or account access are affected.",
      "Use external support resources when gambling is causing harm.",
      "Do not use a new operator to bypass an active exclusion.",
    ],
    faq: [
      ["Is self-exclusion the same as cooling-off?", "No. Cooling-off is usually shorter. Self-exclusion is generally a stronger and longer restriction."],
      ["Can SevenBet activate self-exclusion for me?", "No. SevenBet can explain the concept, but operator or regulator tools must be used directly."],
      ["Is this medical guidance?", "No. This is educational information only."],
    ],
    related: ["cooling-off", "deposit-limits", "reality-checks"],
    next: "cooling-off",
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
    examples: [
      "A user sets a weekly deposit limit based on optional entertainment money.",
      "A user avoids increasing a daily deposit limit after a loss and returns to the 10-Step Program instead.",
    ],
    tips: [
      "Set the limit before reviewing offers.",
      "Use a lower amount when uncertain.",
      "Pair deposit limits with time limits.",
      "Review operator rules for when limit changes take effect.",
    ],
    faq: [
      ["Can I change a deposit limit?", "Many operators allow changes, but timing and cooling periods vary."],
      ["Are deposit limits available everywhere?", "Availability depends on operator, license and jurisdiction."],
      ["Should the bonus amount affect my deposit limit?", "No. The limit should come from your budget, not the size of an offer."],
    ],
    related: ["budgeting", "cooling-off", "bonus-terms"],
    next: "budgeting",
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
    examples: [
      "A user activates a 24-hour pause after reaching the session budget.",
      "A user uses a break to read bonus terms instead of making another deposit.",
    ],
    tips: [
      "Choose a pause before urgency becomes intense.",
      "Pair the pause with a written review of the session.",
      "Avoid opening another operator during the break.",
      "Consider stronger tools if short pauses are repeatedly ignored.",
    ],
    faq: [
      ["How long is a cooling-off period?", "Duration depends on the operator and local rules."],
      ["Can I cancel it early?", "Operator rules differ. Read the terms before activating any tool."],
      ["Is cooling-off a complete plan?", "No. It is a player protection tool and educational concept that works best with budget and time rules."],
    ],
    related: ["self-exclusion", "time-management", "reality-checks"],
    next: "self-exclusion",
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
    examples: [
      "A user sets a 30-minute reminder and stops to compare actual spending against the plan.",
      "A user treats a second reminder as the end of the session, not a suggestion to continue.",
    ],
    tips: [
      "Use reminders before the session feels long.",
      "Write down what action follows the reminder.",
      "Do not dismiss reminders without checking the plan.",
      "Use a phone timer if operator reminders are unavailable.",
    ],
    faq: [
      ["Are reality checks available at every casino?", "Availability depends on operator, platform and licensing rules."],
      ["Do reminders block play?", "Usually they prompt reflection; blocking depends on the specific tool."],
      ["What should I do when a reminder appears?", "Pause and compare the current session with your budget and time plan."],
    ],
    related: ["time-management", "deposit-limits", "cooling-off"],
    next: "time-management",
  },
  {
    slug: "casino-licenses",
    title: "Casino Licenses and Trust Signals",
    summary: "Learn what licensing can indicate and which trust signals to review before registering.",
    category: "Casino Safety",
    readingTime: "6 min read",
    takeaways: [
      "A license can indicate oversight, but users should verify current status.",
      "Licensing is one trust signal, not the only factor.",
      "Payment clarity, terms and responsible gambling tools also matter.",
    ],
    sections: [
      {
        title: "What a license can indicate",
        body: "A gambling license may indicate that an operator is subject to rules in a jurisdiction. The exact protections and complaint routes vary by regulator.",
      },
      {
        title: "Verify the details",
        body: "Users should check license number, operator name, trading names and domain where available. A logo alone is not enough.",
      },
      {
        title: "Look at the full picture",
        body: "A safer evaluation also includes payment clarity, bonus terms, account verification, support and responsible gambling information.",
      },
    ],
    examples: [
      "A user compares the operator name on a casino page with the license register where available.",
      "A user avoids treating a bonus as trustworthy only because the headline amount is large.",
    ],
    tips: [
      "Check the operator name, not only the brand.",
      "Review license status where public registers are available.",
      "Read withdrawal and verification rules.",
      "Compare responsible gambling tools before registering.",
    ],
    faq: [
      ["Does a license prove everything is safe?", "No. A license is an important signal, but users still need to review terms and local legality."],
      ["What if I cannot verify a license?", "Treat the profile as needing more review before registration."],
      ["Does SevenBet replace regulator checks?", "No. SevenBet provides comparison context and links users to methodology."],
    ],
    related: ["payment-safety", "bonus-terms", "self-exclusion"],
    next: "payment-safety",
  },
  {
    slug: "payment-safety",
    title: "Payment Safety and Withdrawals",
    summary: "Understand payment methods, withdrawal timing, KYC checks, fees and crypto considerations.",
    category: "Casino Safety",
    readingTime: "6 min read",
    takeaways: [
      "Withdrawal speed depends on operator rules, verification and payment method.",
      "KYC checks may be required before withdrawals are approved.",
      "Payment method convenience should not override budget rules.",
    ],
    sections: [
      {
        title: "Deposits and withdrawals are different",
        body: "A fast deposit method does not always mean a fast withdrawal. Review processing times, pending periods and verification requirements before depositing.",
      },
      {
        title: "KYC and account checks",
        body: "Operators may ask for identity, address or payment verification. Users should understand these requirements before accepting a bonus.",
      },
      {
        title: "Fees, currencies and crypto",
        body: "Fees and currency conversion can affect the final amount. Crypto support may add speed or flexibility, but users should also review volatility, local rules and operator terms.",
      },
    ],
    examples: [
      "A user checks whether the same method used for deposit can be used for withdrawal.",
      "A user reviews withdrawal limits before accepting a bonus with high wagering.",
    ],
    tips: [
      "Check withdrawal methods before depositing.",
      "Prepare for identity verification.",
      "Review fees and currency conversion.",
      "Avoid using payment speed as a reason to ignore budget limits.",
    ],
    faq: [
      ["How long do withdrawals take?", "Timing depends on operator processing, payment method and verification checks."],
      ["Can crypto withdrawals be faster?", "Sometimes, but availability and rules differ by operator and jurisdiction."],
      ["What is KYC?", "KYC means identity checks that operators may use to verify account and payment details."],
    ],
    related: ["casino-licenses", "budgeting", "bonus-terms"],
    next: "bonus-terms",
  },
  {
    slug: "faq",
    title: "Responsible Gambling FAQ",
    summary: "Plain-language answers to common questions about responsible gambling tools and casino terminology.",
    category: "Industry Basics",
    readingTime: "5 min read",
    takeaways: [
      "Responsible gambling is about planning, limits and informed decisions.",
      "Casino tools vary by operator and jurisdiction.",
      "SevenBet provides education and comparison context, not medical advice.",
    ],
    sections: [
      {
        title: "How to use this FAQ",
        body: "Use these answers as a starting point before reading the detailed guides. For operator-specific rules, always check the casino terms and local regulations.",
      },
      {
        title: "Where to go next",
        body: "If you are unsure, start with budgeting, deposit limits and the 10-Step Program before comparing casino offers.",
      },
    ],
    examples: [
      "A user reads the FAQ before comparing welcome bonuses.",
      "A user follows the related articles to understand deposit limits and self-exclusion tools.",
    ],
    tips: [
      "Start with planning guides before offer comparisons.",
      "Use the self-check when decisions feel unclear.",
      "Review methodology before relying on any comparison card.",
    ],
    faq: [
      ["What is responsible gambling?", "It is a set of habits, limits and tools intended to support informed, controlled gambling decisions."],
      ["What is a deposit limit?", "It is a maximum deposit amount for a chosen time period."],
      ["What is self-exclusion?", "It is a longer restriction on gambling access, usually managed by an operator or regulator tool."],
      ["What is a wagering requirement?", "It describes how much qualifying play may be required before bonus-related withdrawals are allowed."],
      ["How do cooling-off periods work?", "They create a temporary pause from gambling access for a defined period."],
      ["How can I compare casinos?", "Compare license, terms, payments, withdrawal speed and responsible gambling tools before any offer button."],
    ],
    related: ["budgeting", "bonus-terms", "casino-licenses"],
    next: "budgeting",
  },
];

export function getLearningArticle(slug: string) {
  return learningArticles.find((article) => article.slug === slug);
}

export function getRelatedArticles(article: LearningArticle) {
  return article.related
    .map((slug) => getLearningArticle(slug))
    .filter((item): item is LearningArticle => Boolean(item));
}

export function getNextArticle(article: LearningArticle) {
  return getLearningArticle(article.next);
}

export function getCategoryForArticle(article: LearningArticle) {
  return learningCategories.find((category) => category.title === article.category);
}
