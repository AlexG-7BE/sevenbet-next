import { listCmsRecords } from "@/lib/cms/repository";
import { programBuilderService } from "@/lib/services";
import type { CmsEntity, CmsRecord } from "@/lib/cms/types";

export type PublicCmsResource = "program" | "program-steps" | "lessons" | "articles" | "casinos" | "bonuses";

const resourceToEntity: Record<PublicCmsResource, CmsEntity> = {
  program: "program",
  "program-steps": "program-step",
  lessons: "lesson",
  articles: "article",
  casinos: "casino",
  bonuses: "bonus",
};

export function isPublicCmsResource(value: string): value is PublicCmsResource {
  return value in resourceToEntity;
}

export function isPublicRecord(record: CmsRecord) {
  if (record.entity === "bonus") {
    return record.status === "PUBLISHED" && record.offerStatus === "ACTIVE";
  }
  return record.status === "PUBLISHED";
}

export async function listPublishedContent(resource: PublicCmsResource): Promise<CmsRecord[]> {
  if (resource === "program" || resource === "program-steps" || resource === "lessons") {
    const snapshot = await programBuilderService.getPublishedSnapshot();

    if (!snapshot) return [];
    if (resource === "program") return [snapshot.program];
    if (resource === "program-steps") {
      return snapshot.steps.map(({ lessons: _lessons, ...step }) => step);
    }
    return snapshot.steps.flatMap((step) => step.lessons);
  }
  const entity = resourceToEntity[resource];
  return listCmsRecords(entity).filter(isPublicRecord);
}

export function publicEntityForResource(resource: PublicCmsResource) {
  return resourceToEntity[resource];
}
