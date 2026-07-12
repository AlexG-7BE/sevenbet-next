import type { AuditAction, AuditLogEntry, CmsEntity } from "@/lib/cms/types";

export function createAuditEntry({
  actorId,
  action,
  entityType,
  entityId,
  summary,
  metadata,
}: {
  actorId: string;
  action: AuditAction;
  entityType: CmsEntity | "auth" | "role" | "settings";
  entityId: string;
  summary: string;
  metadata?: AuditLogEntry["metadata"];
}): AuditLogEntry {
  return {
    id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    actorId,
    action,
    entityType,
    entityId,
    timestamp: new Date().toISOString(),
    summary,
    metadata,
  };
}
