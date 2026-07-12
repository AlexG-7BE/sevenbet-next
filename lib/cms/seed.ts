import { getCasinos } from "@/lib/data";
import { permissionsForRole } from "@/lib/cms/permissions";
import type {
  AuditLogEntry,
  CmsAffiliateLink,
  CmsArticle,
  CmsBlock,
  CmsBonus,
  CmsCasino,
  CmsLesson,
  CmsProgram,
  CmsProgramStep,
  CmsRecord,
  CmsUser,
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
  summary: "Interactive educational program with lessons, scenarios, quizzes, XP and achievements.",
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
  order: step.day,
  estimatedMinutes: 10,
  xp: step.xp.lesson + step.xp.scenario + step.xp.quiz + step.xp.guide,
  status: "PUBLISHED",
  createdAt: now,
  updatedAt: now,
  createdBy: systemUserId,
  updatedBy: systemUserId,
}));

export const cmsLessons: CmsLesson[] = programSteps.map((step) => {
  const blocks: CmsBlock[] = [
    { id: `block_${step.day}_text`, type: "TEXT", order: 1, data: { text: step.lesson } },
    { id: `block_${step.day}_exercise`, type: "EXERCISE", order: 2, data: { prompt: step.exercisePrompt } },
    { id: `block_${step.day}_scenario`, type: "SCENARIO", order: 3, data: { prompt: step.scenario.prompt } },
    { id: `block_${step.day}_quiz`, type: "QUIZ", order: 4, data: { question: step.quiz.question } },
    { id: `block_${step.day}_summary`, type: "SUMMARY", order: 5, data: { takeaway: step.keyTakeaway, recap: step.recap } },
  ];

  return {
    id: `lesson_step_${step.day}`,
    entity: "lesson",
    programStepId: `program_step_${step.day}`,
    slug: `lesson-step-${step.day}`,
    title: step.title,
    order: step.day,
    status: "PUBLISHED",
    createdAt: now,
    updatedAt: now,
    createdBy: systemUserId,
    updatedBy: systemUserId,
    blocks,
  };
});

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
      { id: "article_block_1", type: "TEXT", order: 1, data: { text: "Welcome bonuses should be compared by terms, not headline amount alone." } },
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
  ...cmsArticles,
  ...cmsCasinos,
  ...cmsBonuses,
  ...cmsAffiliateLinks,
];

export const cmsAuditLog: AuditLogEntry[] = [];
export const cmsRevisions: ContentRevision[] = [];
