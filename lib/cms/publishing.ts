import { listCmsRecords } from "@/lib/cms/repository";
import { getPublishedProgramSnapshot } from "@/lib/cms/program-builder";
import type { CmsProgram } from "@/lib/cms/types";
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

export function listPublishedContent(resource: PublicCmsResource) {
  if (resource === "program" || resource === "program-steps" || resource === "lessons") {
    const snapshots = (listCmsRecords("program") as CmsProgram[])
      .map((program) => getPublishedProgramSnapshot(program.id))
      .filter((snapshot) => Boolean(snapshot));
    if (resource === "program") return snapshots.map((snapshot) => snapshot!.program);
    if (resource === "program-steps") return snapshots.flatMap((snapshot) => snapshot!.steps.map(({ lessons: _lessons, ...step }) => step));
    return snapshots.flatMap((snapshot) => snapshot!.steps.flatMap((step) => step.lessons));
  }
  const entity = resourceToEntity[resource];
  return listCmsRecords(entity).filter(isPublicRecord);
}

export function publicEntityForResource(resource: PublicCmsResource) {
  return resourceToEntity[resource];
}
