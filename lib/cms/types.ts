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
  | "program.edit"
  | "program.publish"
  | "casino.edit"
  | "bonus.edit"
  | "affiliate.manage"
  | "user.view"
  | "analytics.view"
  | "settings.manage";

export type CmsEntity =
  | "program"
  | "program-step"
  | "lesson"
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
  summary: string;
};

export type CmsProgramStep = CmsBaseRecord & {
  entity: "program-step";
  programId: string;
  order: number;
  estimatedMinutes: number;
  xp: number;
};

export type CmsLesson = CmsBaseRecord & {
  entity: "lesson";
  programStepId: string;
  order: number;
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

export type CmsBlock = {
  id: string;
  type:
    | "TEXT"
    | "CALLOUT"
    | "VIDEO"
    | "IMAGE"
    | "QUIZ"
    | "SCENARIO"
    | "EXERCISE"
    | "CHECKLIST"
    | "SUMMARY"
    | "RESOURCE_LINK";
  order: number;
  data: Record<string, string | number | boolean | string[]>;
};

export type CmsRecord =
  | CmsProgram
  | CmsProgramStep
  | CmsLesson
  | CmsArticle
  | CmsCasino
  | CmsBonus
  | CmsAffiliateLink;

export type AuditAction =
  | "login"
  | "create"
  | "update"
  | "archive"
  | "publish"
  | "unpublish"
  | "approve"
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
