import { programBuilderService } from "@/lib/services";

export type PublicCmsResource = "program" | "program-steps" | "lessons" | "articles" | "casinos" | "bonuses";
type PublicProgrammeResource = "program" | "program-steps" | "lessons";

const resourceToEntity: Record<PublicCmsResource, string> = {
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

export async function listPublishedContent(resource: PublicProgrammeResource) {
  const snapshot = await programBuilderService.getPublishedSnapshot();

  if (!snapshot) return [];
  if (resource === "program") return [snapshot.program];
  if (resource === "program-steps") {
    return snapshot.steps.map(({ lessons: _lessons, ...step }) => step);
  }
  return snapshot.steps.flatMap((step) => step.lessons);
}

export function publicEntityForResource(resource: PublicCmsResource) {
  return resourceToEntity[resource];
}
