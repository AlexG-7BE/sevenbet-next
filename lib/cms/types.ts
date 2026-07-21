export type EditorialStatus = "DRAFT" | "IN_REVIEW" | "APPROVED" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED";
export type OfferStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "EXPIRED" | "ARCHIVED";
export type AdminRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "EDITOR"
  | "AUTHOR"
  | "REVIEWER"
  | "AFFILIATE_MANAGER"
  | "ANALYST"
  | "SUPPORT";

export type CmsPermission =
  | "article.create"
  | "article.edit"
  | "article.review"
  | "article.publish"
  | "program.view"
  | "program.create"
  | "program.edit"
  | "program.review"
  | "program.approve"
  | "program.publish"
  | "program.archive"
  | "program.restore_revision"
  | "program.preview_draft"
  | "lesson.edit"
  | "quiz.edit"
  | "scenario.edit"
  | "exercise.edit"
  | "achievement.manage"
  | "xp.manage"
  | "casino.edit"
  | "bonus.edit"
  | "affiliate.manage"
  | "media.manage"
  | "user.view"
  | "analytics.view"
  | "settings.manage";

export type CmsEntity =
  | "program"
  | "program-step"
  | "lesson"
  | "achievement"
  | "xp-rule"
  | "article"
  | "casino"
  | "bonus"
  | "affiliate-link"
  | "navigation"
  | "settings";

export type CmsUser = {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  permissions: CmsPermission[];
  authProvider: "placeholder" | "oauth" | "email";
  createdAt: string;
  updatedAt: string;
};

export type CmsBaseRecord = {
  id: string;
  slug: string;
  title: string;
  status: EditorialStatus | OfferStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  archivedAt?: string;
  version?: number;
};

export type CompletionRuleType =
  | "ALL_REQUIRED_BLOCKS_VIEWED"
  | "QUIZ_COMPLETED"
  | "MINIMUM_QUIZ_SCORE"
  | "SCENARIO_ANSWERED"
  | "EXERCISE_SUBMITTED"
  | "TAKEAWAY_ACKNOWLEDGED"
  | "ALL_REQUIRED_LESSONS_COMPLETED";

export type CompletionRule = {
  id: string;
  type: CompletionRuleType;
  operator: "AND" | "OR";
  targetId?: string;
  value?: number;
};

export type Prerequisite = {
  id: string;
  type: "STEP_COMPLETED" | "LESSON_COMPLETED" | "QUIZ_PASSED" | "EXERCISE_COMPLETED" | "AVAILABLE_AFTER";
  targetId?: string;
  availableAfter?: string;
};

export type CmsArticle = CmsBaseRecord & {
  entity: "article";
  excerpt: string;
  category: string;
  tags: string[];
  bodyBlocks: CmsBlock[];
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  readingTime?: string;
  difficulty?: "Beginner" | "Intermediate" | "Advanced";
  publishedAt?: string;
  lastReviewedAt?: string;
};

export type CmsProgram = CmsBaseRecord & {
  entity: "program";
  internalName: string;
  summary: string;
  introduction: string;
  estimatedTotalMinutes: number;
  language: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  coverImage?: string;
  xpCompletionReward: number;
  certificateEnabled: boolean;
  registrationRequirementPoint: "NEVER" | "BEFORE_START" | "BEFORE_SAVE" | "BEFORE_COMPLETION";
  progressSavingBehavior: "LOCAL" | "ACCOUNT" | "HYBRID";
  completionRules: CompletionRule[];
  seoTitle?: string;
  seoDescription?: string;
  socialImage?: string;
  canonicalUrl?: string;
  publishedVersion: number;
  draftVersion: number;
  publishedAt?: string;
  scheduledPublishAt?: string;
};

export type CmsProgramStep = CmsBaseRecord & {
  entity: "program-step";
  programId: string;
  order: number;
  shortTitle: string;
  description: string;
  learningObjective: string;
  estimatedMinutes: number;
  xp: number;
  completionMessage: string;
  practicalTakeaway: string;
  prerequisites: Prerequisite[];
  icon?: string;
  visibility: "PUBLIC" | "REGISTERED" | "HIDDEN";
  unlockDelayHours?: number;
  relatedGuideIds: string[];
  relatedResourceIds: string[];
  completionRules: CompletionRule[];
};

export type CmsLesson = CmsBaseRecord & {
  entity: "lesson";
  programStepId: string;
  order: number;
  summary: string;
  objective: string;
  estimatedMinutes: number;
  xp: number;
  required: boolean;
  retryPolicy: "UNLIMITED" | "ONCE" | "NO_RETRY";
  prerequisites: Prerequisite[];
  completionRules: CompletionRule[];
  takeaway: string;
  recap: string[];
  relatedResourceIds: string[];
  allowCommercialReferences: boolean;
  blocks: CmsBlock[];
};

export type CmsCasino = CmsBaseRecord & {
  entity: "casino";
  domain: string;
  operator?: string;
  editorScore?: number;
  license?: string;
  country?: string;
  publishedAt?: string;
  lastReviewedAt?: string;
};

export type CmsBonus = CmsBaseRecord & {
  entity: "bonus";
  casinoId: string;
  summary: string;
  amount?: number;
  percentage?: number;
  minimumDeposit?: number;
  maximumBonus?: number;
  wageringMultiplier?: number;
  termsUrl?: string;
  offerStatus: OfferStatus;
  lastVerifiedAt?: string;
};

export type CmsAffiliateLink = CmsBaseRecord & {
  entity: "affiliate-link";
  casinoId?: string;
  bonusId?: string;
  destinationUrl: string;
  country?: string;
  language?: string;
  campaign?: string;
  priority: number;
  effectiveStart?: string;
  effectiveEnd?: string;
};

export type XpEventType =
  | "LESSON_COMPLETION"
  | "STEP_COMPLETION"
  | "QUIZ_COMPLETION"
  | "QUIZ_PASSING"
  | "SCENARIO_COMPLETION"
  | "EXERCISE_COMPLETION"
  | "PROGRAM_COMPLETION"
  | "GUIDE_COMPLETION";

export type CmsXpRule = CmsBaseRecord & {
  entity: "xp-rule";
  eventType: XpEventType;
  targetId?: string;
  xp: number;
  active: boolean;
  effectiveStart?: string;
  effectiveEnd?: string;
  awardKey: string;
};

export type CmsAchievement = CmsBaseRecord & {
  entity: "achievement";
  internalName: string;
  description: string;
  icon: string;
  category: "PROGRAM" | "LEARNING" | "PLANNING" | "TOOLS";
  tier: "COMMON" | "MILESTONE" | "ADVANCED";
  xpReward: number;
  active: boolean;
  hidden: boolean;
  triggerType: "FIRST_LESSON" | "STEP_COMPLETED" | "PROGRAM_COMPLETED" | "QUIZ_PASSED" | "QUIZ_COUNT" | "PLAN_CREATED" | "LEARNING_STREAK" | "GUIDE_COUNT";
  triggerConfig: Record<string, CmsJsonValue>;
  effectiveStart?: string;
  effectiveEnd?: string;
};

export type CmsJsonValue = string | number | boolean | null | CmsJsonValue[] | { [key: string]: CmsJsonValue };

export type CmsBlockType =
  | "TEXT"
  | "HEADING"
  | "CALLOUT"
  | "IMAGE"
  | "VIDEO"
  | "QUOTE"
  | "CHECKLIST"
  | "QUIZ"
  | "SCENARIO"
  | "EXERCISE"
  | "REFLECTION"
  | "PRACTICAL_TASK"
  | "RESOURCE_LINK"
  | "SUMMARY"
  | "DIVIDER"
  | "RESPONSIBLE_GAMBLING_NOTICE"
  | "RELATED_COMPARISON";

export type CmsBlock = {
  id: string;
  type: CmsBlockType;
  order: number;
  internalLabel: string;
  required: boolean;
  archived?: boolean;
  data: Record<string, CmsJsonValue>;
};

export type CmsRecord =
  | CmsProgram
  | CmsProgramStep
  | CmsLesson
  | CmsAchievement
  | CmsXpRule
  | CmsArticle
  | CmsCasino
  | CmsBonus
  | CmsAffiliateLink;

export type ProgramBuilderLesson = CmsLesson;
export type ProgramBuilderStep = CmsProgramStep & { lessons: ProgramBuilderLesson[] };
export type ProgramBuilderSnapshot = {
  program: CmsProgram;
  steps: ProgramBuilderStep[];
  achievements: CmsAchievement[];
  xpRules: CmsXpRule[];
};

export type ProgramValidationSeverity = "error" | "warning" | "suggestion";
export type ProgramValidationIssue = {
  id: string;
  severity: ProgramValidationSeverity;
  entityId: string;
  path: string;
  message: string;
};

export type ProgramValidationReport = {
  ok: boolean;
  issues: ProgramValidationIssue[];
  errors: number;
  warnings: number;
  suggestions: number;
};

export type AuditAction =
  | "login"
  | "create"
  | "update"
  | "reorder"
  | "request_review"
  | "request_changes"
  | "archive"
  | "publish"
  | "unpublish"
  | "approve"
  | "preview"
  | "restore_revision"
  | "role_change"
  | "affiliate_link_change"
  | "settings_change";

export type AuditLogEntry = {
  id: string;
  actorId: string;
  action: AuditAction;
  entityType: CmsEntity | "auth" | "role" | "settings";
  entityId: string;
  timestamp: string;
  summary: string;
  metadata?: Record<string, string | number | boolean>;
};

export type ContentRevision = {
  id: string;
  entityType: CmsEntity;
  entityId: string;
  revisionNumber: number;
  snapshot: CmsRecord;
  createdBy: string;
  createdAt: string;
  summary: string;
};

export type CmsValidationResult = {
  ok: boolean;
  errors: Record<string, string>;
};
