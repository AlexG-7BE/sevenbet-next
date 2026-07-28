/** Persistence- and framework-independent contracts for casino editorial reviews. */
export type EditorialReviewStatus = "DRAFT" | "IN_REVIEW" | "APPROVED" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED" | "SUSPENDED";

export type EditorialBlock =
  | { id: string; type: "heading"; level: 2 | 3; text: string }
  | { id: string; type: "paragraph"; text: string }
  | { id: string; type: "quote"; text: string; attribution?: string }
  | { id: string; type: "callout" | "warning" | "information" | "responsible-gambling"; title: string; text: string }
  | { id: string; type: "bullet-list" | "numbered-list" | "checklist" | "pros" | "cons"; items: string[] }
  | { id: string; type: "faq"; question: string; answer: string }
  | { id: string; type: "image"; mediaId: string; alt: string; caption?: string }
  | { id: string; type: "video"; provider: "youtube" | "vimeo"; videoId: string; title: string }
  | { id: string; type: "divider" };

export type EditorialSectionKind =
  | "overview" | "key-facts" | "pros" | "cons" | "trust" | "bonuses" | "payments"
  | "games" | "licensing" | "company" | "responsible-gambling" | "faq" | "related-casinos" | "notes";

export interface EditorialSection { id: string; kind: EditorialSectionKind; title: string; order: number; blocks: EditorialBlock[]; }
export interface EditorialTrustScore { overall: number; categories: Array<{ key: string; score: number; comment?: string }>; confidence: "low" | "medium" | "high"; evidence: string[]; }
export interface EditorialSeo { title: string; description: string; canonicalPath?: string; robots?: string; socialTitle?: string; socialDescription?: string; keywords?: string[]; }
export interface CasinoEditorialDocument {
  version: 1;
  title: string;
  summary: string;
  author: string;
  factCheckedAt?: string;
  trustScore?: EditorialTrustScore;
  coverMediaId?: string;
  sections: EditorialSection[];
  relatedCasinoIds: string[];
  seo: EditorialSeo;
}
export interface EditorialRevision { id: string; reviewId: string; revisionNumber: number; content: CasinoEditorialDocument; summary: string; createdBy: string; createdAt: Date; promotedAt: Date | null; }
export interface EditorialReview { id: string; casinoId: string; status: EditorialReviewStatus; draftRevisionNumber: number; publishedRevisionId: string | null; scheduledPublishAt: Date | null; publishedAt: Date | null; archivedAt: Date | null; revisions: EditorialRevision[]; }
export interface EditorialValidationIssue { path: string; code: string; message: string; }
