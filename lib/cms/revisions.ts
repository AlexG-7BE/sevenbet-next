import type { CmsEntity, CmsRecord, ContentRevision } from "@/lib/cms/types";

export function createRevision({
  entityType,
  entityId,
  snapshot,
  createdBy,
  revisionNumber,
  summary,
}: {
  entityType: CmsEntity;
  entityId: string;
  snapshot: CmsRecord;
  createdBy: string;
  revisionNumber: number;
  summary: string;
}): ContentRevision {
  return {
    id: `rev_${entityId}_${revisionNumber}`,
    entityType,
    entityId,
    revisionNumber,
    snapshot,
    createdBy,
    createdAt: new Date().toISOString(),
    summary,
  };
}

export function restoreRevision(revision: ContentRevision, updatedBy: string): CmsRecord {
  return {
    ...revision.snapshot,
    updatedAt: new Date().toISOString(),
    updatedBy,
  };
}
