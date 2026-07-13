import { getCasinos } from "@/lib/data";
import { permissionsForRole } from "@/lib/cms/permissions";
import type {
  AuditLogEntry,
  CmsAffiliateLink,
  CmsAchievement,
  CmsArticle,
  CmsBlock,
  CmsBonus,
  CmsCasino,
  CmsLesson,
  CmsProgram,
  CmsProgramStep,
  CmsRecord,
  CmsUser,
  CmsXpRule,
  ContentRevision,
} from "@/lib/cms/types";
import { programSteps } from "@/lib/program";

const now = "2026-07-12T00:00:00.000Z";
const systemUserId = "admin_placeholder";
const firstCasino = getCasinos()[0];

export const cmsUsers: CmsUser[] = [
  {
    id: systemUserId,
    email: "admin@example.com",
    name: "Initial Admin Placeholder",
    role: "SUPER_ADMIN",
    permissions: permissionsForRole("SUPER_ADMIN"),
    authProvider: "placeholder",
    createdAt: now,
    updatedAt: now,
  },
];

export const cmsProgram: CmsProgram = {
  id: "program_10_step_control",
  entity: "program",
  slug: "sevenbet-10-step-control-program",
  title: "SevenBet 10-Step Control Program",
  internalName: "10 Step Control Program",
  summary: "Interactive educational program with lessons, scenarios, quizzes, XP and achievements.",
  introduction: "A structured educational framework designed to help players slow down, understand gambling decisions, and develop healthier decision-making routines before placing bets.",
  estimatedTotalMinutes: 80,
  language: "en",
  difficulty: "Beginner",
  xpCompletionReward: 100,
  certificateEnabled: false,
  registrationRequirementPoint: "NEVER",
  progressSavingBehavior: "LOCAL",
  completionRules: [{ id: "program_rule_required_lessons", type: "ALL_REQUIRED_LESSONS_COMPLETED", operator: "AND" }],
  seoTitle: "SevenBet 10-Step Control Program",
  seoDescription: "A calm, interactive educational program for more informed gambling decisions.",
  canonicalUrl: "/program",
  publishedVersion: 1,
  draftVersion: 1,
  publishedAt: now,
  status: "PUBLISHED",
  createdAt: now,
  updatedAt: now,
  createdBy: systemUserId,
  updatedBy: systemUserId,
};

export const cmsProgramSteps: CmsProgramStep[] = programSteps.map((step) => ({
  id: `program_step_${step.day}`,
  entity: "program-step",
  programId: cmsProgram.id,
  slug: `step-${step.day}`,
  title: step.title,
  shortTitle: step.title,
  description: step.focus,
  learningObjective: step.whyItMatters,
  order: step.day,
  estimatedMinutes: 10,
  xp: step.xp.lesson + step.xp.scenario + step.xp.quiz + step.xp.guide,
  completionMessage: step.recap.join(" "),
  practicalTakeaway: step.keyTakeaway,
  prerequisites: step.day > 1 ? [{ id: `prerequisite_step_${step.day}`, type: "STEP_COMPLETED", targetId: `program_step_${step.day - 1}` }] : [],
  visibility: "PUBLIC",
  relatedGuideIds: [],
  relatedResourceIds: [],
  completionRules: [
    { id: `step_${step.day}_exercise_rule`, type: "EXERCISE_SUBMITTED", operator: "AND", targetId: `block_${step.day}_exercise` },
    { id: `step_${step.day}_scenario_rule`, type: "SCENARIO_ANSWERED", operator: "AND", targetId: `block_${step.day}_scenario` },
    { id: `step_${step.day}_quiz_rule`, type: "QUIZ_COMPLETED", operator: "AND", targetId: `block_${step.day}_quiz` },
  ],
  status: "PUBLISHED",
  createdAt: now,
  updatedAt: now,
  createdBy: systemUserId,
  updatedBy: systemUserId,
}));

export const cmsLessons: CmsLesson[] = programSteps.map((step) => {
  const blocks: CmsBlock[] = [
    { id: `block_${step.day}_text`, type: "TEXT", order: 1000, internalLabel: "Core lesson", required: true, data: { text: step.lesson } },
    {
      id: `block_${step.day}_exercise`, type: "EXERCISE", order: 2000, internalLabel: "Reflection exercise", required: true,
      data: { exerciseType: "WRITTEN_REFLECTION", instructions: step.exercisePrompt, minimumLength: 8, saveBehavior: "LOCAL_PRIVATE", privacyNotice: "Your answer stays in your browser and is not visible to editors.", completionRule: "SUBMITTED", xp: step.xp.guide },
    },
    {
      id: `block_${step.day}_scenario`, type: "SCENARIO", order: 3000, internalLabel: "Decision scenario", required: true,
      data: { title: `${step.title} scenario`, situation: step.scenario.prompt, choices: step.scenario.options.map((option, index) => ({ id: `scenario_${step.day}_choice_${index}`, label: option.label, feedback: option.feedback, preferred: Boolean(option.recommended), order: (index + 1) * 1000 })), xp: step.xp.scenario, retryBehavior: "UNLIMITED", completionRule: "ANSWERED" },
    },
    {
      id: `block_${step.day}_quiz`, type: "QUIZ", order: 4000, internalLabel: "Knowledge check", required: true,
      data: { title: `${step.title} knowledge check`, instructions: "Choose the most accurate answer.", quizType: "SINGLE_CHOICE", passingScore: 100, xp: step.xp.quiz, retryPolicy: "UNLIMITED", questions: [{ id: `quiz_${step.day}_question_1`, type: "SINGLE_CHOICE", prompt: step.quiz.question, options: step.quiz.options.map((label, index) => ({ id: `quiz_${step.day}_option_${index}`, label, correct: index === step.quiz.correctIndex, order: (index + 1) * 1000 })), explanation: step.quiz.explanation, takeaway: step.keyTakeaway, points: 1, required: true, order: 1000 }] },
    },
    { id: `block_${step.day}_summary`, type: "SUMMARY", order: 5000, internalLabel: "Practical takeaway", required: true, data: { takeaway: step.keyTakeaway, recap: step.recap } },
  ];

  return {
    id: `lesson_step_${step.day}`,
    entity: "lesson",
    programStepId: `program_step_${step.day}`,
    slug: `lesson-step-${step.day}`,
    title: step.title,
    order: step.day,
    summary: step.focus,
    objective: step.whyItMatters,
    estimatedMinutes: 8,
    xp: step.xp.lesson,
    required: true,
    retryPolicy: "UNLIMITED",
    prerequisites: [],
    completionRules: [
      { id: `lesson_${step.day}_required_blocks`, type: "ALL_REQUIRED_BLOCKS_VIEWED", operator: "AND" },
      { id: `lesson_${step.day}_exercise`, type: "EXERCISE_SUBMITTED", operator: "AND", targetId: `block_${step.day}_exercise` },
      { id: `lesson_${step.day}_scenario`, type: "SCENARIO_ANSWERED", operator: "AND", targetId: `block_${step.day}_scenario` },
      { id: `lesson_${step.day}_quiz`, type: "QUIZ_COMPLETED", operator: "AND", targetId: `block_${step.day}_quiz` },
    ],
    takeaway: step.keyTakeaway,
    recap: step.recap,
    relatedResourceIds: [],
    allowCommercialReferences: step.day === 3,
    status: "PUBLISHED",
    createdAt: now,
    updatedAt: now,
    createdBy: systemUserId,
    updatedBy: systemUserId,
    blocks,
  };
});

export const cmsXpRules: CmsXpRule[] = [
  ["lesson-completion", "LESSON_COMPLETION", 10],
  ["scenario-completion", "SCENARIO_COMPLETION", 15],
  ["quiz-passing", "QUIZ_PASSING", 15],
  ["exercise-completion", "EXERCISE_COMPLETION", 10],
  ["program-completion", "PROGRAM_COMPLETION", 100],
].map(([slug, eventType, xp], index) => ({
  id: `xp_rule_${index + 1}`,
  entity: "xp-rule",
  slug: String(slug),
  title: String(slug).split("-").map((part) => part[0].toUpperCase() + part.slice(1)).join(" "),
  eventType: eventType as CmsXpRule["eventType"],
  xp: Number(xp),
  active: true,
  awardKey: `program-v1:${String(slug)}`,
  status: "PUBLISHED",
  createdAt: now,
  updatedAt: now,
  createdBy: systemUserId,
  updatedBy: systemUserId,
}));

export const cmsAchievements: CmsAchievement[] = [
  { id: "achievement_first_step", slug: "first-step", internalName: "first_step", title: "First Step Complete", description: "Complete the first required step.", icon: "01", category: "PROGRAM", tier: "COMMON", xpReward: 0, active: true, hidden: false, triggerType: "STEP_COMPLETED", triggerConfig: { stepId: "program_step_1" } },
  { id: "achievement_halfway", slug: "halfway-reflection", internalName: "halfway", title: "Halfway Reflection", description: "Complete five program steps.", icon: "05", category: "PROGRAM", tier: "MILESTONE", xpReward: 0, active: true, hidden: false, triggerType: "STEP_COMPLETED", triggerConfig: { count: 5 } },
  { id: "achievement_program_complete", slug: "program-complete", internalName: "program_complete", title: "Program Complete", description: "Complete all required program steps.", icon: "10", category: "PROGRAM", tier: "MILESTONE", xpReward: 100, active: true, hidden: false, triggerType: "PROGRAM_COMPLETED", triggerConfig: { programId: "program_10_step_control" } },
].map((achievement) => ({ ...achievement, entity: "achievement" as const, status: "PUBLISHED" as const, createdAt: now, updatedAt: now, createdBy: systemUserId, updatedBy: systemUserId })) as unknown as CmsAchievement[];

export const cmsArticles: CmsArticle[] = [
  {
    id: "article_sample_bonus_terms",
    entity: "article",
    slug: "how-welcome-bonus-terms-work",
    title: "How Welcome Bonus Terms Work",
    excerpt: "Understand wagering, expiry, maximum bet rules and withdrawal restrictions before comparing offers.",
    category: "casino-bonuses",
    tags: ["Bonuses", "Responsible Gambling"],
    bodyBlocks: [
      { id: "article_block_1", type: "TEXT", order: 1000, internalLabel: "Introduction", required: true, data: { text: "Welcome bonuses should be compared by terms, not headline amount alone." } },
    ],
    seoTitle: "How Welcome Bonus Terms Work",
    seoDescription: "A SevenBet guide to welcome bonus terms and responsible comparison.",
    readingTime: "6 min read",
    difficulty: "Beginner",
    status: "PUBLISHED",
    publishedAt: now,
    lastReviewedAt: now,
    createdAt: now,
    updatedAt: now,
    createdBy: systemUserId,
    updatedBy: systemUserId,
  },
];

export const cmsCasinos: CmsCasino[] = [
  {
    id: "casino_sample",
    entity: "casino",
    slug: firstCasino?.slug || "sample-casino",
    title: firstCasino?.name || "Sample Casino",
    domain: firstCasino?.domain || "example.com",
    operator: firstCasino?.operator,
    editorScore: firstCasino?.rating,
    license: firstCasino?.license,
    country: firstCasino?.country,
    status: "PUBLISHED",
    publishedAt: now,
    lastReviewedAt: now,
    createdAt: now,
    updatedAt: now,
    createdBy: systemUserId,
    updatedBy: systemUserId,
  },
];

export const cmsBonuses: CmsBonus[] = [
  {
    id: "bonus_sample",
    entity: "bonus",
    casinoId: "casino_sample",
    slug: "sample-welcome-bonus",
    title: firstCasino?.bonusHeadline || "Sample Welcome Bonus",
    summary: "Sample bonus seeded from the current casino dataset for CMS architecture testing.",
    amount: firstCasino?.bonusAmountUsd,
    minimumDeposit: firstCasino?.minDeposit,
    wageringMultiplier: firstCasino?.wagering,
    offerStatus: "ACTIVE",
    status: "PUBLISHED",
    lastVerifiedAt: now,
    createdAt: now,
    updatedAt: now,
    createdBy: systemUserId,
    updatedBy: systemUserId,
  },
];

export const cmsAffiliateLinks: CmsAffiliateLink[] = [
  {
    id: "affiliate_link_sample",
    entity: "affiliate-link",
    slug: "sample-casino",
    title: "Sample Casino Redirect",
    casinoId: "casino_sample",
    bonusId: "bonus_sample",
    destinationUrl: firstCasino?.affiliateUrl || "https://example.com",
    language: "en",
    campaign: "phase-1-seed",
    priority: 1,
    status: "PUBLISHED",
    createdAt: now,
    updatedAt: now,
    createdBy: systemUserId,
    updatedBy: systemUserId,
  },
];

export const cmsRecords: CmsRecord[] = [
  cmsProgram,
  ...cmsProgramSteps,
  ...cmsLessons,
  ...cmsAchievements,
  ...cmsXpRules,
  ...cmsArticles,
  ...cmsCasinos,
  ...cmsBonuses,
  ...cmsAffiliateLinks,
];

export const cmsAuditLog: AuditLogEntry[] = [];
export const cmsRevisions: ContentRevision[] = [];
