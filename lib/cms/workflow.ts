import type { AuditAction, EditorialStatus } from "@/lib/cms/types";

export const editorialTransitions: Record<EditorialStatus, EditorialStatus[]> = {
  DRAFT: ["IN_REVIEW", "ARCHIVED"],
  IN_REVIEW: ["DRAFT", "APPROVED", "ARCHIVED"],
  APPROVED: ["DRAFT", "SCHEDULED", "PUBLISHED", "ARCHIVED"],
  SCHEDULED: ["PUBLISHED", "DRAFT", "ARCHIVED"],
  PUBLISHED: ["DRAFT", "ARCHIVED"],
  ARCHIVED: ["DRAFT"],
};

export function canTransitionStatus(from: EditorialStatus, to: EditorialStatus) {
  return editorialTransitions[from].includes(to);
}

export function transitionStatus(from: EditorialStatus, to: EditorialStatus) {
  if (!canTransitionStatus(from, to)) {
    throw new Error(`Invalid workflow transition from ${from} to ${to}`);
  }
  return to;
}

export function actionForTransition(to: EditorialStatus): AuditAction {
  if (to === "APPROVED") return "approve";
  if (to === "PUBLISHED") return "publish";
  if (to === "ARCHIVED") return "archive";
  if (to === "DRAFT") return "unpublish";
  return "update";
}
