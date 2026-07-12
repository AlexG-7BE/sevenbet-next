export type KnowledgeQuestion = {
  question: string;
  answer: string;
  category: string;
  href?: string;
  popular?: boolean;
};

export type KnowledgeCategory = {
  title: string;
  description: string;
  href: string;
};

export const knowledgeCategories: KnowledgeCategory[] = [
  {
    title: "10-Step Program",
    description: "Questions about the SevenBet educational program, timing, progress, and repeat use.",
    href: "#program-questions",
  },
  {
    title: "Responsible Gambling",
    description: "Guides about limits, cooling-off, self-exclusion, and practical player protection tools.",
    href: "#responsible-gambling-questions",
  },
  {
    title: "Casino Bonuses",
    description: "Plain-English answers about welcome bonuses, wagering, expiry, and free spins.",
    href: "#bonus-questions",
  },
  {
    title: "Casino Reviews",
    description: "How SevenBet compares casinos, scores reviews, and presents operator information.",
    href: "#casino-review-questions",
  },
  {
    title: "Methodology",
    description: "How editorial criteria, scoring weights, updates, and limitations are handled.",
    href: "/methodology",
  },
  {
    title: "Affiliate Disclosure",
    description: "How SevenBet may earn commission and how affiliate relationships are disclosed.",
    href: "#affiliate-questions",
  },
  {
    title: "Payments",
    description: "Questions about deposits, withdrawals, payment methods, fees, and verification.",
    href: "/responsible-gambling/payment-safety",
  },
  {
    title: "Licensing",
    description: "What casino licenses can indicate and what users should still verify.",
    href: "/responsible-gambling/casino-licenses",
  },
  {
    title: "Casino Safety",
    description: "Trust signals, account checks, operator transparency, and responsible gambling tools.",
    href: "/responsible-gambling/casino-licenses",
  },
  {
    title: "General Questions",
    description: "Basic questions about SevenBet, how the site works, and where to go next.",
    href: "#general-questions",
  },
];

export const knowledgeQuestions: KnowledgeQuestion[] = [
  {
    question: "What is the 10-Step Program?",
    answer:
      "The SevenBet 10-Step Program is a free educational framework that encourages users to slow down, reflect on gambling decisions, understand key terms, and create personal rules before comparing casinos.",
    category: "10-Step Program",
    href: "/program",
    popular: true,
  },
  {
    question: "How does SevenBet review casinos?",
    answer:
      "SevenBet reviews casinos using an editorial framework that considers licensing, bonus terms, wagering, payments, withdrawal conditions, responsible gambling tools, usability, support information, and account rules.",
    category: "Methodology",
    href: "/methodology",
    popular: true,
  },
  {
    question: "What is a wagering requirement?",
    answer:
      "A wagering requirement describes how much qualifying play may be required before bonus-related withdrawals are allowed under operator terms.",
    category: "Casino Bonuses",
    href: "/responsible-gambling/bonus-terms",
    popular: true,
  },
  {
    question: "How do casino bonuses work?",
    answer:
      "Casino bonuses usually include eligibility rules, minimum deposits, wagering requirements, expiry windows, game contribution rules, and withdrawal restrictions. The headline amount is only one part of the offer.",
    category: "Casino Bonuses",
    href: "/bonuses",
    popular: true,
  },
  {
    question: "How does SevenBet make money?",
    answer:
      "SevenBet may receive commissions from some affiliate links when a reader visits an operator and completes a qualifying action. The Affiliate Disclosure explains this relationship.",
    category: "Affiliate Disclosure",
    href: "/affiliate-disclosure",
    popular: true,
  },
  {
    question: "Are affiliate links safe?",
    answer:
      "An affiliate link is a commercial tracking link, not a safety guarantee. Users should still review licensing, current terms, local availability, and responsible gambling tools.",
    category: "Affiliate Disclosure",
    href: "/affiliate-disclosure",
    popular: true,
  },
  {
    question: "How often are reviews updated?",
    answer:
      "Reviews should be checked periodically and prioritized after major offer, licensing, payment, or operator changes. Not every operator change will appear immediately.",
    category: "Methodology",
    href: "/methodology",
    popular: true,
  },
  {
    question: "How long does the program take?",
    answer:
      "The current 10-Step Program is designed as a short self-paced educational framework. It can be completed in one sitting or returned to over multiple sessions.",
    category: "10-Step Program",
    href: "/program",
  },
  {
    question: "Can I pause it?",
    answer:
      "Yes. The program is designed to be self-paced, so users can pause and return when they are ready to continue.",
    category: "10-Step Program",
    href: "/program",
  },
  {
    question: "Do I need an account?",
    answer:
      "The current SevenBet educational pages do not require an account to read the program, guides, reviews, or comparison pages.",
    category: "10-Step Program",
    href: "/program",
  },
  {
    question: "Is it free?",
    answer: "The current SevenBet 10-Step Program is presented as a free educational resource on the website.",
    category: "10-Step Program",
    href: "/program",
  },
  {
    question: "Can I repeat it?",
    answer:
      "Yes. Repeating the program can help users review limits, triggers, bonus knowledge, and decision rules before comparing casino information again.",
    category: "10-Step Program",
    href: "/program",
  },
  {
    question: "What is a welcome bonus?",
    answer:
      "A welcome bonus is an introductory offer for new users. It may include deposit requirements, wagering rules, expiry windows, eligible games, and withdrawal conditions.",
    category: "Casino Bonuses",
    href: "/bonuses",
  },
  {
    question: "What is wagering?",
    answer:
      "Wagering refers to the amount of qualifying play that may be required before bonus-related withdrawals are allowed.",
    category: "Casino Bonuses",
    href: "/responsible-gambling/bonus-terms",
  },
  {
    question: "Can bonuses expire?",
    answer:
      "Yes. Many bonuses include expiry windows. A short expiry window can create pressure, so it should be reviewed before accepting any offer.",
    category: "Casino Bonuses",
    href: "/responsible-gambling/bonus-terms",
  },
  {
    question: "What is a no-deposit bonus?",
    answer:
      "A no-deposit bonus is an offer that may not require an initial deposit, but it can still include eligibility rules, wagering, expiry, and withdrawal restrictions.",
    category: "Casino Bonuses",
    href: "/responsible-gambling/bonus-terms",
  },
  {
    question: "How do free spins work?",
    answer:
      "Free spins are promotional spins on selected games. They may include wagering, expiry, game restrictions, and maximum conversion limits.",
    category: "Casino Bonuses",
    href: "/responsible-gambling/bonus-terms",
  },
  {
    question: "How are casinos scored?",
    answer:
      "SevenBet uses a 10-point Editor's Score based on transparent criteria including licensing, bonus clarity, payments, responsible gambling tools, usability, support, and account rules.",
    category: "Casino Reviews",
    href: "/methodology",
  },
  {
    question: "What does Editor's Score mean?",
    answer:
      "Editor's Score is an editorial comparison score. It is not a prediction of financial outcomes, user experience, withdrawals, or dispute results.",
    category: "Casino Reviews",
    href: "/methodology",
  },
  {
    question: "How are payment methods checked?",
    answer:
      "Payment methods are reviewed from available operator information, including deposit options, withdrawal methods, processing times, currencies, fees, and verification rules where listed.",
    category: "Casino Reviews",
    href: "/responsible-gambling/payment-safety",
  },
  {
    question: "What is a deposit limit?",
    answer:
      "A deposit limit sets a maximum amount that can be deposited during a chosen period. Availability and rules differ by operator and jurisdiction.",
    category: "Responsible Gambling",
    href: "/responsible-gambling/deposit-limits",
  },
  {
    question: "What is self-exclusion?",
    answer:
      "Self-exclusion is a longer restriction on gambling access, usually managed through an operator or regulator tool.",
    category: "Responsible Gambling",
    href: "/responsible-gambling/self-exclusion",
  },
  {
    question: "What is a cooling-off period?",
    answer:
      "A cooling-off period is a temporary pause from gambling access. It may be useful when decisions feel rushed, emotional, or connected to losses.",
    category: "Responsible Gambling",
    href: "/responsible-gambling/cooling-off",
  },
  {
    question: "What is a reality check?",
    answer:
      "A reality check is a reminder that can show elapsed time or session information and encourage users to pause before continuing.",
    category: "Responsible Gambling",
    href: "/responsible-gambling/reality-checks",
  },
  {
    question: "What is an affiliate link?",
    answer:
      "An affiliate link is a tracked link that may allow SevenBet to receive a commission if a user visits an operator and completes a qualifying action.",
    category: "Affiliate Disclosure",
    href: "/affiliate-disclosure",
  },
  {
    question: "Do affiliate links affect rankings?",
    answer:
      "Affiliate relationships should not automatically determine rankings or review scores. Review methodology and disclosure pages explain how SevenBet handles this.",
    category: "Affiliate Disclosure",
    href: "/affiliate-disclosure",
  },
  {
    question: "Who pays SevenBet?",
    answer:
      "When an affiliate action qualifies, commissions generally come from the operator, not directly from the reader.",
    category: "Affiliate Disclosure",
    href: "/affiliate-disclosure",
  },
  {
    question: "Is SevenBet a casino?",
    answer:
      "No. SevenBet does not operate casinos, accept deposits, process withdrawals, or provide gambling services.",
    category: "General Questions",
    href: "/about",
  },
  {
    question: "Where should I start?",
    answer:
      "Start with the 10-Step Program or the Responsible Gambling Hub before comparing casino reviews or welcome bonuses.",
    category: "General Questions",
    href: "/program",
  },
];

export const knowledgeSections = [
  {
    id: "program-questions",
    title: "Program Questions",
    category: "10-Step Program",
  },
  {
    id: "bonus-questions",
    title: "Bonus Questions",
    category: "Casino Bonuses",
  },
  {
    id: "casino-review-questions",
    title: "Casino Review Questions",
    category: "Casino Reviews",
  },
  {
    id: "responsible-gambling-questions",
    title: "Responsible Gambling Questions",
    category: "Responsible Gambling",
  },
  {
    id: "affiliate-questions",
    title: "Affiliate Questions",
    category: "Affiliate Disclosure",
  },
  {
    id: "general-questions",
    title: "General Questions",
    category: "General Questions",
  },
];

export const contactOptions = [
  {
    title: "Contact SevenBet",
    text: "Use the About and disclosure pages to understand the project and available contact routes.",
    href: "/about",
  },
  {
    title: "Report incorrect information",
    text: "Start with the methodology page to understand how corrections should be reviewed.",
    href: "/methodology",
  },
  {
    title: "Suggest a topic",
    text: "Use the Responsible Gambling Hub as the reference point for future educational guides.",
    href: "/responsible-gambling",
  },
];
