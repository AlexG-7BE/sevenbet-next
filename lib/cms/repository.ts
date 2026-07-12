import { createAuditEntry } from "@/lib/cms/audit";
import { cmsAffiliateLinks, cmsAuditLog, cmsRecords, cmsRevisions } from "@/lib/cms/seed";
import { createRevision } from "@/lib/cms/revisions";
import type { AuditLogEntry, CmsEntity, CmsRecord, CmsUser, ContentRevision } from "@/lib/cms/types";
import { assertValidCmsRecord } from "@/lib/cms/validation";

const store = globalThis as typeof globalThis & {
  __sevenbetCmsRecords?: CmsRecord[];
  __sevenbetCmsAudit?: AuditLogEntry[];
  __sevenbetCmsRevisions?: ContentRevision[];
};

function records() {
  store.__sevenbetCmsRecords ||= [...cmsRecords];
  return store.__sevenbetCmsRecords;
}

function audit() {
  store.__sevenbetCmsAudit ||= [...cmsAuditLog];
  return store.__sevenbetCmsAudit;
}

function revisions() {
  store.__sevenbetCmsRevisions ||= [...cmsRevisions];
  return store.__sevenbetCmsRevisions;
}

export function listCmsRecords(entity?: CmsEntity) {
  return records().filter((record) => !entity || record.entity === entity);
}

export function getCmsRecord(entity: CmsEntity, id: string) {
  return records().find((record) => record.entity === entity && record.id === id);
}

export function createCmsRecord(entity: CmsEntity, input: CmsRecord, actor: CmsUser) {
  assertValidCmsRecord(input, entity);
  records().push(input);
  audit().push(createAuditEntry({
    actorId: actor.id,
    action: "create",
    entityType: entity,
    entityId: input.id,
    summary: `Created ${entity}: ${input.title}`,
  }));
  return input;
}

export function updateCmsRecord(entity: CmsEntity, id: string, input: Partial<CmsRecord>, actor: CmsUser) {
  const index = records().findIndex((record) => record.entity === entity && record.id === id);
  if (index === -1) throw new Error("CMS record not found");

  const next = {
    ...records()[index],
    ...input,
    updatedAt: new Date().toISOString(),
    updatedBy: actor.id,
  } as CmsRecord;

  assertValidCmsRecord(next, entity);
  const revisionNumber = revisions().filter((revision) => revision.entityId === id).length + 1;
  revisions().push(createRevision({
    entityType: entity,
    entityId: id,
    snapshot: records()[index],
    createdBy: actor.id,
    revisionNumber,
    summary: `Snapshot before update ${revisionNumber}`,
  }));
  records()[index] = next;
  audit().push(createAuditEntry({
    actorId: actor.id,
    action: "update",
    entityType: entity,
    entityId: id,
    summary: `Updated ${entity}: ${next.title}`,
  }));
  return next;
}

export function archiveCmsRecord(entity: CmsEntity, id: string, actor: CmsUser) {
  return updateCmsRecord(entity, id, { status: "ARCHIVED", archivedAt: new Date().toISOString() } as Partial<CmsRecord>, actor);
}

export function listRevisions(entity: CmsEntity, id: string) {
  return revisions().filter((revision) => revision.entityType === entity && revision.entityId === id);
}

export function listAuditEntries() {
  return audit().slice().reverse();
}

export function resolveAffiliateLink(slug: string) {
  const fromStore = records().find((record) => record.entity === "affiliate-link" && record.slug === slug);
  return fromStore || cmsAffiliateLinks.find((link) => link.slug === slug);
}
