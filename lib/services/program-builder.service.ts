import { randomUUID } from "node:crypto";

import {
  CmsBlockType as PrismaCmsBlockType,
  EditorialStatus as PrismaEditorialStatus,
  Prisma,
  type Achievement,
  type Lesson,
  type LessonBlock,
  type Program,
  type ProgramStep,
  type XpRule,
} from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import type {
  CmsAchievement,
  CmsBlock,
  CmsJsonValue,
  CmsLesson,
  CmsProgram,
  CmsProgramStep,
  CmsXpRule,
  ProgramBuilderSnapshot,
} from "@/lib/cms/types";

import {
  ConflictError,
  NotFoundError,
} from "./service-error";

import { validateProgramSnapshot } from "@/lib/cms/program-validation";
import type { CmsUser } from "@/lib/cms/types";

type ProgramGraph = Program & {
  steps: Array<
    ProgramStep & {
      lessons: Array<
        Lesson & {
          blocks: LessonBlock[];
        }
      >;
    }
  >;
};

function jsonValue(value: unknown): CmsJsonValue {
  return value as CmsJsonValue;
}

function jsonArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function iso(value: Date | null | undefined): string | undefined {
  return value ? value.toISOString() : undefined;
}

function mapProgram(program: Program): CmsProgram {
  return {
    id: program.id,
    entity: "program",
    slug: program.slug,
    internalName: program.internalName,
    title: program.title,
    summary: program.summary,
    introduction: program.introduction,
    estimatedTotalMinutes: program.estimatedTotalMinutes,
    language: program.language,
    difficulty:
      program.difficulty as CmsProgram["difficulty"],
    coverImage: program.coverImage ?? undefined,
    xpCompletionReward: program.xpCompletionReward,
    certificateEnabled: program.certificateEnabled,
    registrationRequirementPoint:
      program.registrationRequirementPoint as CmsProgram["registrationRequirementPoint"],
    progressSavingBehavior:
      program.progressSavingBehavior as CmsProgram["progressSavingBehavior"],
    completionRules: jsonArray(
      program.completionRules,
    ),
    seoTitle: program.seoTitle ?? undefined,
    seoDescription:
      program.seoDescription ?? undefined,
    socialImage: program.socialImage ?? undefined,
    canonicalUrl: program.canonicalUrl ?? undefined,
    publishedVersion: program.publishedVersion,
    draftVersion: program.draftVersion,
    publishedAt: iso(program.publishedAt),
    scheduledPublishAt: iso(
      program.scheduledPublishAt,
    ),
    status: program.status,
    archivedAt: iso(program.archivedAt),
    createdAt: program.createdAt.toISOString(),
    updatedAt: program.updatedAt.toISOString(),
    createdBy: program.createdBy,
    updatedBy: program.updatedBy,
  };
}

function mapBlock(block: LessonBlock): CmsBlock {
  return {
    id: block.id,
    type: block.type,
    order: block.order,
    internalLabel: block.internalLabel,
    required: block.required,
    archived: block.archived,
    data: jsonValue(block.data) as CmsBlock["data"],
  };
}

function mapLesson(
  lesson: Lesson & { blocks: LessonBlock[] },
): CmsLesson {
  return {
    id: lesson.id,
    entity: "lesson",
    programStepId: lesson.programStepId,
    slug: lesson.slug,
    title: lesson.title,
    summary: lesson.summary,
    objective: lesson.objective,
    status: lesson.status,
    order: lesson.order,
    estimatedMinutes: lesson.estimatedMinutes,
    xp: lesson.xp,
    required: lesson.required,
    retryPolicy:
      lesson.retryPolicy as CmsLesson["retryPolicy"],
    prerequisites: jsonArray(lesson.prerequisites),
    completionRules: jsonArray(
      lesson.completionRules,
    ),
    takeaway: lesson.takeaway,
    recap: lesson.recap,
    relatedResourceIds: lesson.relatedResourceIds,
    allowCommercialReferences:
      lesson.allowCommercialReferences,
    archivedAt: iso(lesson.archivedAt),
    createdAt: lesson.createdAt.toISOString(),
    updatedAt: lesson.updatedAt.toISOString(),
    createdBy: lesson.createdBy,
    updatedBy: lesson.updatedBy,
    blocks: lesson.blocks
      .slice()
      .sort((a, b) => a.order - b.order)
      .map(mapBlock),
  };
}

function mapStep(
  step: ProgramStep & {
    lessons: Array<
      Lesson & { blocks: LessonBlock[] }
    >;
  },
): CmsProgramStep & { lessons: CmsLesson[] } {
  return {
    id: step.id,
    entity: "program-step",
    programId: step.programId,
    slug: step.slug,
    title: step.title,
    shortTitle: step.shortTitle,
    description: step.description,
    learningObjective: step.learningObjective,
    status: step.status,
    order: step.order,
    estimatedMinutes: step.estimatedMinutes,
    xp: step.xp,
    completionMessage: step.completionMessage,
    practicalTakeaway: step.practicalTakeaway,
    prerequisites: jsonArray(step.prerequisites),
    icon: step.icon ?? undefined,
    visibility:
      step.visibility as CmsProgramStep["visibility"],
    unlockDelayHours:
      step.unlockDelayHours ?? undefined,
    relatedGuideIds: step.relatedGuideIds,
    relatedResourceIds: step.relatedResourceIds,
    completionRules: jsonArray(
      step.completionRules,
    ),
    archivedAt: iso(step.archivedAt),
    createdAt: step.createdAt.toISOString(),
    updatedAt: step.updatedAt.toISOString(),
    createdBy: step.createdBy,
    updatedBy: step.updatedBy,
    lessons: step.lessons
      .slice()
      .sort((a, b) => a.order - b.order)
      .map(mapLesson),
  };
}

function mapAchievement(
  achievement: Achievement,
): CmsAchievement {
  return {
    id: achievement.id,
    entity: "achievement",
    slug: achievement.slug,
    internalName: achievement.internalName,
    title: achievement.title,
    description: achievement.description,
    icon: achievement.icon,
    category:
      achievement.category as CmsAchievement["category"],
    tier: achievement.tier as CmsAchievement["tier"],
    xpReward: achievement.xpReward,
    active: achievement.active,
    hidden: achievement.hidden,
    triggerType:
      achievement.triggerType as CmsAchievement["triggerType"],
    triggerConfig:
      achievement.triggerConfig as CmsAchievement["triggerConfig"],
    effectiveStart: iso(
      achievement.effectiveStart,
    ),
    effectiveEnd: iso(achievement.effectiveEnd),
    status: achievement.status,
    archivedAt: iso(achievement.archivedAt),
    createdAt: achievement.createdAt.toISOString(),
    updatedAt: achievement.updatedAt.toISOString(),
    createdBy: achievement.createdBy,
    updatedBy: achievement.updatedBy,
  };
}

function mapXpRule(rule: XpRule): CmsXpRule {
  return {
    id: rule.id,
    entity: "xp-rule",
    slug: rule.slug,
    title: rule.title,
    eventType: rule.eventType,
    targetId: rule.targetId ?? undefined,
    xp: rule.xp,
    active: rule.active,
    effectiveStart: iso(rule.effectiveStart),
    effectiveEnd: iso(rule.effectiveEnd),
    awardKey: rule.awardKey,
    status: rule.status,
    archivedAt: iso(rule.archivedAt),
    createdAt: rule.createdAt.toISOString(),
    updatedAt: rule.updatedAt.toISOString(),
    createdBy: rule.createdBy,
    updatedBy: rule.updatedBy,
  };
}

export class ProgramBuilderService {
  async getSnapshot(
    programId: string,
  ): Promise<ProgramBuilderSnapshot> {
    const [program, achievements, xpRules] =
      await Promise.all([
        prisma.program.findUnique({
          where: {
            id: programId,
          },
          include: {
            steps: {
              where: {
                status: {
                  not: "ARCHIVED",
                },
              },
              orderBy: {
                order: "asc",
              },
              include: {
                lessons: {
                  where: {
                    status: {
                      not: "ARCHIVED",
                    },
                  },
                  orderBy: {
                    order: "asc",
                  },
                  include: {
                    blocks: {
                      orderBy: {
                        order: "asc",
                      },
                    },
                  },
                },
              },
            },
          },
        }),
        prisma.achievement.findMany({
          where: {
            status: {
              not: "ARCHIVED",
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        }),
        prisma.xpRule.findMany({
          where: {
            status: {
              not: "ARCHIVED",
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        }),
      ]);

    if (!program) {
      throw new NotFoundError("Program", {
        id: programId,
      });
    }

    const graph = program as ProgramGraph;

    return {
      program: mapProgram(graph),
      steps: graph.steps.map(mapStep),
      achievements: achievements.map(mapAchievement),
      xpRules: xpRules.map(mapXpRule),
    };
  }

  async saveSnapshot(
    input: ProgramBuilderSnapshot,
    actor: CmsUser,
    expectedUpdatedAt?: string,
  ) {
    const validation = validateProgramSnapshot(input);

    const normalized: ProgramBuilderSnapshot = JSON.parse(
      JSON.stringify(input),
    ) as ProgramBuilderSnapshot;

    normalized.program = {
      ...normalized.program,
      status: "DRAFT",
      draftVersion: Math.max(
        normalized.program.draftVersion,
        normalized.program.publishedVersion + 1,
      ),
    };

    normalized.steps = normalized.steps.map(
      (step, stepIndex) => ({
        ...step,
        programId: normalized.program.id,
        order: (stepIndex + 1) * 1000,
        status: "DRAFT",
        lessons: step.lessons.map(
          (lesson, lessonIndex) => ({
            ...lesson,
            programStepId: step.id,
            order: (lessonIndex + 1) * 1000,
            status: "DRAFT",
            blocks: lesson.blocks.map(
              (block, blockIndex) => ({
                ...block,
                order: (blockIndex + 1) * 1000,
              }),
            ),
          }),
        ),
      }),
    );

    const currentSnapshot = await this.getSnapshot(
      normalized.program.id,
    );

    await prisma.$transaction(async (tx) => {
      const currentProgram =
        await tx.program.findUnique({
          where: {
            id: normalized.program.id,
          },
          select: {
            id: true,
            updatedAt: true,
          },
        });

      if (!currentProgram) {
        throw new NotFoundError("Program", {
          id: normalized.program.id,
        });
      }

      if (
        expectedUpdatedAt &&
        currentProgram.updatedAt.toISOString() !==
          expectedUpdatedAt
      ) {
        throw new ConflictError(
          "This program was changed by another editor. Reload it before saving.",
          {
            expectedUpdatedAt,
            actualUpdatedAt:
              currentProgram.updatedAt.toISOString(),
          },
        );
      }

      const revisionAggregate =
        await tx.contentRevision.aggregate({
          where: {
            entityType: "program",
            entityId: normalized.program.id,
          },
          _max: {
            revisionNumber: true,
          },
        });

      await tx.contentRevision.create({
        data: {
          entityType: "program",
          entityId: normalized.program.id,
          revisionNumber:
            (revisionAggregate._max.revisionNumber ??
              0) + 1,
          snapshot: JSON.parse(
            JSON.stringify(currentSnapshot),
          ) as Prisma.InputJsonValue,
          summary: `Snapshot before Program Builder save`,
          createdBy: actor.id,
        },
      });

      await tx.program.update({
        where: {
          id: normalized.program.id,
        },
        data: {
          slug: normalized.program.slug,
          internalName:
            normalized.program.internalName,
          title: normalized.program.title,
          summary: normalized.program.summary,
          introduction:
            normalized.program.introduction,
          estimatedTotalMinutes:
            normalized.program
              .estimatedTotalMinutes,
          language: normalized.program.language,
          difficulty:
            normalized.program.difficulty,
          coverImage:
            normalized.program.coverImage ?? null,
          xpCompletionReward:
            normalized.program.xpCompletionReward,
          certificateEnabled:
            normalized.program.certificateEnabled,
          registrationRequirementPoint:
            normalized.program
              .registrationRequirementPoint,
          progressSavingBehavior:
            normalized.program
              .progressSavingBehavior,
          completionRules:
            normalized.program
              .completionRules as Prisma.InputJsonValue,
          seoTitle:
            normalized.program.seoTitle ?? null,
          seoDescription:
            normalized.program.seoDescription ??
            null,
          socialImage:
            normalized.program.socialImage ?? null,
          canonicalUrl:
            normalized.program.canonicalUrl ?? null,
          publishedVersion:
            normalized.program.publishedVersion,
          draftVersion:
            normalized.program.draftVersion,
          scheduledPublishAt:
            normalized.program.scheduledPublishAt
              ? new Date(
                  normalized.program
                    .scheduledPublishAt,
                )
              : null,
          status: PrismaEditorialStatus.DRAFT,
          archivedAt: null,
          updatedBy: actor.id,
        },
      });

      const existingSteps =
        await tx.programStep.findMany({
          where: {
            programId: normalized.program.id,
          },
          include: {
            lessons: {
              include: {
                blocks: true,
              },
            },
          },
        });

      const incomingStepIds = new Set(
        normalized.steps.map((step) => step.id),
      );

      const incomingLessonIds = new Set(
        normalized.steps.flatMap((step) =>
          step.lessons.map((lesson) => lesson.id),
        ),
      );

      const incomingBlockIds = new Set(
        normalized.steps.flatMap((step) =>
          step.lessons.flatMap((lesson) =>
            lesson.blocks.map((block) => block.id),
          ),
        ),
      );

      for (const existingStep of existingSteps) {
        if (!incomingStepIds.has(existingStep.id)) {
          await tx.programStep.update({
            where: {
              id: existingStep.id,
            },
            data: {
              status:
                PrismaEditorialStatus.ARCHIVED,
              archivedAt: new Date(),
              updatedBy: actor.id,
            },
          });
        }

        for (const existingLesson of
          existingStep.lessons) {
          if (
            !incomingLessonIds.has(
              existingLesson.id,
            )
          ) {
            await tx.lesson.update({
              where: {
                id: existingLesson.id,
              },
              data: {
                status:
                  PrismaEditorialStatus.ARCHIVED,
                archivedAt: new Date(),
                updatedBy: actor.id,
              },
            });
          }

          for (const existingBlock of
            existingLesson.blocks) {
            if (
              !incomingBlockIds.has(
                existingBlock.id,
              )
            ) {
              await tx.lessonBlock.update({
                where: {
                  id: existingBlock.id,
                },
                data: {
                  archived: true,
                },
              });
            }
          }
        }
      }

      for (const step of normalized.steps) {
        await tx.programStep.upsert({
          where: {
            id: step.id,
          },
          create: {
            id: step.id,
            programId: normalized.program.id,
            slug: step.slug,
            title: step.title,
            shortTitle: step.shortTitle,
            description: step.description,
            learningObjective:
              step.learningObjective,
            status: PrismaEditorialStatus.DRAFT,
            order: step.order,
            estimatedMinutes:
              step.estimatedMinutes,
            xp: step.xp,
            completionMessage:
              step.completionMessage,
            practicalTakeaway:
              step.practicalTakeaway,
            prerequisites:
              step.prerequisites as Prisma.InputJsonValue,
            icon: step.icon ?? null,
            visibility: step.visibility,
            unlockDelayHours:
              step.unlockDelayHours ?? null,
            relatedGuideIds:
              step.relatedGuideIds,
            relatedResourceIds:
              step.relatedResourceIds,
            completionRules:
              step.completionRules as Prisma.InputJsonValue,
            archivedAt: null,
            createdBy: actor.id,
            updatedBy: actor.id,
          },
          update: {
            programId: normalized.program.id,
            slug: step.slug,
            title: step.title,
            shortTitle: step.shortTitle,
            description: step.description,
            learningObjective:
              step.learningObjective,
            status: PrismaEditorialStatus.DRAFT,
            order: step.order,
            estimatedMinutes:
              step.estimatedMinutes,
            xp: step.xp,
            completionMessage:
              step.completionMessage,
            practicalTakeaway:
              step.practicalTakeaway,
            prerequisites:
              step.prerequisites as Prisma.InputJsonValue,
            icon: step.icon ?? null,
            visibility: step.visibility,
            unlockDelayHours:
              step.unlockDelayHours ?? null,
            relatedGuideIds:
              step.relatedGuideIds,
            relatedResourceIds:
              step.relatedResourceIds,
            completionRules:
              step.completionRules as Prisma.InputJsonValue,
            archivedAt: null,
            updatedBy: actor.id,
          },
        });

        for (const lesson of step.lessons) {
          await tx.lesson.upsert({
            where: {
              id: lesson.id,
            },
            create: {
              id: lesson.id,
              programStepId: step.id,
              slug: lesson.slug,
              title: lesson.title,
              summary: lesson.summary,
              objective: lesson.objective,
              status:
                PrismaEditorialStatus.DRAFT,
              order: lesson.order,
              estimatedMinutes:
                lesson.estimatedMinutes,
              xp: lesson.xp,
              required: lesson.required,
              retryPolicy: lesson.retryPolicy,
              prerequisites:
                lesson.prerequisites as Prisma.InputJsonValue,
              completionRules:
                lesson.completionRules as Prisma.InputJsonValue,
              takeaway: lesson.takeaway,
              recap: lesson.recap,
              relatedResourceIds:
                lesson.relatedResourceIds,
              allowCommercialReferences:
                lesson.allowCommercialReferences,
              archivedAt: null,
              createdBy: actor.id,
              updatedBy: actor.id,
            },
            update: {
              programStepId: step.id,
              slug: lesson.slug,
              title: lesson.title,
              summary: lesson.summary,
              objective: lesson.objective,
              status:
                PrismaEditorialStatus.DRAFT,
              order: lesson.order,
              estimatedMinutes:
                lesson.estimatedMinutes,
              xp: lesson.xp,
              required: lesson.required,
              retryPolicy: lesson.retryPolicy,
              prerequisites:
                lesson.prerequisites as Prisma.InputJsonValue,
              completionRules:
                lesson.completionRules as Prisma.InputJsonValue,
              takeaway: lesson.takeaway,
              recap: lesson.recap,
              relatedResourceIds:
                lesson.relatedResourceIds,
              allowCommercialReferences:
                lesson.allowCommercialReferences,
              archivedAt: null,
              updatedBy: actor.id,
            },
          });

          for (const block of lesson.blocks) {
            await tx.lessonBlock.upsert({
              where: {
                id: block.id,
              },
              create: {
                id: block.id,
                lessonId: lesson.id,
                type: block.type as PrismaCmsBlockType,
                order: block.order,
                internalLabel:
                  block.internalLabel,
                required: block.required,
                archived: block.archived,
                data: block.data as Prisma.InputJsonValue,
              },
              update: {
                lessonId: lesson.id,
                type: block.type as PrismaCmsBlockType,
                order: block.order,
                internalLabel:
                  block.internalLabel,
                required: block.required,
                archived: block.archived,
                data: block.data as Prisma.InputJsonValue,
              },
            });
          }
        }
      }

      await tx.programVersion.upsert({
        where: {
          programId_version: {
            programId: normalized.program.id,
            version:
              normalized.program.draftVersion,
          },
        },
        create: {
          programId: normalized.program.id,
          version:
            normalized.program.draftVersion,
          status: "DRAFT",
          snapshot: JSON.parse(
            JSON.stringify(normalized),
          ) as Prisma.InputJsonValue,
          createdBy: actor.id,
        },
        update: {
          status: "DRAFT",
          snapshot: JSON.parse(
            JSON.stringify(normalized),
          ) as Prisma.InputJsonValue,
          createdBy: actor.id,
        },
      });
    });

    const snapshot = await this.getSnapshot(
      normalized.program.id,
    );

    return {
      snapshot,
      validation,
    };
  }

  async transitionWorkflow(
    programId: string,
    nextStatus: PrismaEditorialStatus,
    actorId: string,
  ) {
    const program = await prisma.program.findUnique({
      where: { id: programId },
      select: { id: true, status: true },
    });

    if (!program) {
      throw new NotFoundError("Program", { id: programId });
    }

    const allowed: Record<
      PrismaEditorialStatus,
      PrismaEditorialStatus[]
    > = {
      DRAFT: [
        PrismaEditorialStatus.IN_REVIEW,
        PrismaEditorialStatus.ARCHIVED,
      ],
      IN_REVIEW: [
        PrismaEditorialStatus.DRAFT,
        PrismaEditorialStatus.APPROVED,
        PrismaEditorialStatus.ARCHIVED,
      ],
      APPROVED: [
        PrismaEditorialStatus.DRAFT,
        PrismaEditorialStatus.PUBLISHED,
        PrismaEditorialStatus.ARCHIVED,
      ],
      SCHEDULED: [
        PrismaEditorialStatus.DRAFT,
        PrismaEditorialStatus.PUBLISHED,
        PrismaEditorialStatus.ARCHIVED,
      ],
      PUBLISHED: [
        PrismaEditorialStatus.DRAFT,
        PrismaEditorialStatus.ARCHIVED,
      ],
      ARCHIVED: [
        PrismaEditorialStatus.DRAFT,
      ],
    };

    if (!allowed[program.status].includes(nextStatus)) {
      throw new ConflictError(
        `Cannot change program status from ${program.status} to ${nextStatus}`,
        {
          currentStatus: program.status,
          nextStatus,
        },
      );
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.program.update({
        where: { id: programId },
        data: {
          status: nextStatus,
          archivedAt:
            nextStatus === PrismaEditorialStatus.ARCHIVED
              ? new Date()
              : null,
          updatedBy: actorId,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId,
          action:
            nextStatus === PrismaEditorialStatus.IN_REVIEW
              ? "request_review"
              : nextStatus === PrismaEditorialStatus.APPROVED
                ? "approve"
                : nextStatus === PrismaEditorialStatus.ARCHIVED
                  ? "archive"
                  : "update",
          entityType: "program",
          entityId: programId,
          summary: `Program status changed to ${nextStatus}`,
        },
      });

      return updated;
    });
  }

  async publish(
    programId: string,
    actorId: string,
  ) {
    const snapshot = await this.getSnapshot(programId);
    const validation = validateProgramSnapshot(snapshot);

    if (!validation.ok) {
      throw new ConflictError(
        `Publication blocked by ${validation.errors} validation error(s).`,
        validation,
      );
    }

    if (
      snapshot.program.status !== "APPROVED" &&
      snapshot.program.status !== "SCHEDULED"
    ) {
      throw new ConflictError(
        "Program must be approved before publication.",
        {
          currentStatus: snapshot.program.status,
        },
      );
    }

    const publishedAt = new Date();
    const publishedVersion =
      snapshot.program.draftVersion;

    await prisma.$transaction(async (tx) => {
      await tx.programStep.updateMany({
        where: {
          programId,
          archivedAt: null,
        },
        data: {
          status: PrismaEditorialStatus.PUBLISHED,
          updatedBy: actorId,
        },
      });

      const stepIds = snapshot.steps.map(
        (step) => step.id,
      );

      await tx.lesson.updateMany({
        where: {
          programStepId: {
            in: stepIds,
          },
          archivedAt: null,
        },
        data: {
          status: PrismaEditorialStatus.PUBLISHED,
          updatedBy: actorId,
        },
      });

      await tx.program.update({
        where: {
          id: programId,
        },
        data: {
          status: PrismaEditorialStatus.PUBLISHED,
          publishedAt,
          scheduledPublishAt: null,
          publishedVersion,
          updatedBy: actorId,
        },
      });

      await tx.programVersion.upsert({
        where: {
          programId_version: {
            programId,
            version: publishedVersion,
          },
        },
        create: {
          programId,
          version: publishedVersion,
          status: "PUBLISHED",
          snapshot: JSON.parse(
            JSON.stringify(snapshot),
          ) as Prisma.InputJsonValue,
          publishedAt,
          createdBy: actorId,
        },
        update: {
          status: "PUBLISHED",
          snapshot: JSON.parse(
            JSON.stringify(snapshot),
          ) as Prisma.InputJsonValue,
          publishedAt,
          createdBy: actorId,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId,
          action: "publish",
          entityType: "program",
          entityId: programId,
          summary: `Published program version ${publishedVersion}`,
          metadata: {
            version: publishedVersion,
          },
        },
      });
    });

    return {
      snapshot: await this.getSnapshot(programId),
      validation,
    };
  }

  async archive(
    programId: string,
    actorId: string,
  ) {
    return this.transitionWorkflow(
      programId,
      PrismaEditorialStatus.ARCHIVED,
      actorId,
    );
  }

  async duplicate(
    programId: string,
    actorId: string,
  ): Promise<ProgramBuilderSnapshot> {
    const source = await this.getSnapshot(programId);
    const suffix = randomUUID().slice(0, 8);

    const programIdMap = new Map<string, string>();
    const stepIdMap = new Map<string, string>();
    const lessonIdMap = new Map<string, string>();
    const blockIdMap = new Map<string, string>();

    const newProgramId = randomUUID();
    programIdMap.set(source.program.id, newProgramId);

    for (const step of source.steps) {
      stepIdMap.set(step.id, randomUUID());

      for (const lesson of step.lessons) {
        lessonIdMap.set(lesson.id, randomUUID());

        for (const block of lesson.blocks) {
          blockIdMap.set(block.id, randomUUID());
        }
      }
    }

    const remapTargetId = (
      targetId: string | undefined,
    ): string | undefined => {
      if (!targetId) return undefined;

      return (
        stepIdMap.get(targetId) ??
        lessonIdMap.get(targetId) ??
        blockIdMap.get(targetId) ??
        targetId
      );
    };

    const duplicate: ProgramBuilderSnapshot = {
      program: {
        ...source.program,
        id: newProgramId,
        slug: `${source.program.slug}-copy-${suffix}`,
        title: `${source.program.title} Copy`,
        internalName: `${source.program.internalName} Copy`,
        status: "DRAFT",
        publishedVersion: 0,
        draftVersion: 1,
        publishedAt: undefined,
        scheduledPublishAt: undefined,
        archivedAt: undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: actorId,
        updatedBy: actorId,
      },
      steps: source.steps.map((step, stepIndex) => {
        const newStepId = stepIdMap.get(step.id)!;

        return {
          ...step,
          id: newStepId,
          programId: newProgramId,
          slug: `${step.slug}-copy-${suffix}`,
          status: "DRAFT",
          order: (stepIndex + 1) * 1000,
          archivedAt: undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: actorId,
          updatedBy: actorId,
          prerequisites: step.prerequisites.map(
            (prerequisite) => ({
              ...prerequisite,
              id: `rule_${randomUUID()}`,
              targetId: remapTargetId(
                prerequisite.targetId,
              ),
            }),
          ),
          completionRules: step.completionRules.map(
            (rule) => ({
              ...rule,
              id: `rule_${randomUUID()}`,
              targetId: remapTargetId(
                rule.targetId,
              ),
            }),
          ),
          lessons: step.lessons.map(
            (lesson, lessonIndex) => {
              const newLessonId =
                lessonIdMap.get(lesson.id)!;

              return {
                ...lesson,
                id: newLessonId,
                programStepId: newStepId,
                slug: `${lesson.slug}-copy-${suffix}`,
                status: "DRAFT",
                order: (lessonIndex + 1) * 1000,
                archivedAt: undefined,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: actorId,
                updatedBy: actorId,
                prerequisites:
                  lesson.prerequisites.map(
                    (prerequisite) => ({
                      ...prerequisite,
                      id: `rule_${randomUUID()}`,
                      targetId: remapTargetId(
                        prerequisite.targetId,
                      ),
                    }),
                  ),
                completionRules:
                  lesson.completionRules.map(
                    (rule) => ({
                      ...rule,
                      id: `rule_${randomUUID()}`,
                      targetId: remapTargetId(
                        rule.targetId,
                      ),
                    }),
                  ),
                blocks: lesson.blocks.map(
                  (block, blockIndex) => ({
                    ...block,
                    id: blockIdMap.get(block.id)!,
                    order: (blockIndex + 1) * 1000,
                  }),
                ),
              };
            },
          ),
        };
      }),
      achievements: source.achievements,
      xpRules: source.xpRules,
    };

    await prisma.$transaction(async (tx) => {
      await tx.program.create({
        data: {
          id: duplicate.program.id,
          slug: duplicate.program.slug,
          internalName:
            duplicate.program.internalName,
          title: duplicate.program.title,
          summary: duplicate.program.summary,
          introduction:
            duplicate.program.introduction,
          estimatedTotalMinutes:
            duplicate.program
              .estimatedTotalMinutes,
          language: duplicate.program.language,
          difficulty:
            duplicate.program.difficulty,
          coverImage:
            duplicate.program.coverImage ?? null,
          xpCompletionReward:
            duplicate.program.xpCompletionReward,
          certificateEnabled:
            duplicate.program.certificateEnabled,
          registrationRequirementPoint:
            duplicate.program
              .registrationRequirementPoint,
          progressSavingBehavior:
            duplicate.program
              .progressSavingBehavior,
          completionRules:
            duplicate.program
              .completionRules as Prisma.InputJsonValue,
          seoTitle:
            duplicate.program.seoTitle ?? null,
          seoDescription:
            duplicate.program.seoDescription ??
            null,
          socialImage:
            duplicate.program.socialImage ?? null,
          canonicalUrl:
            duplicate.program.canonicalUrl ?? null,
          publishedVersion: 0,
          draftVersion: 1,
          status: PrismaEditorialStatus.DRAFT,
          createdBy: actorId,
          updatedBy: actorId,
        },
      });

      for (const step of duplicate.steps) {
        await tx.programStep.create({
          data: {
            id: step.id,
            programId: duplicate.program.id,
            slug: step.slug,
            title: step.title,
            shortTitle: step.shortTitle,
            description: step.description,
            learningObjective:
              step.learningObjective,
            status: PrismaEditorialStatus.DRAFT,
            order: step.order,
            estimatedMinutes:
              step.estimatedMinutes,
            xp: step.xp,
            completionMessage:
              step.completionMessage,
            practicalTakeaway:
              step.practicalTakeaway,
            prerequisites:
              step.prerequisites as Prisma.InputJsonValue,
            icon: step.icon ?? null,
            visibility: step.visibility,
            unlockDelayHours:
              step.unlockDelayHours ?? null,
            relatedGuideIds:
              step.relatedGuideIds,
            relatedResourceIds:
              step.relatedResourceIds,
            completionRules:
              step.completionRules as Prisma.InputJsonValue,
            createdBy: actorId,
            updatedBy: actorId,
          },
        });

        for (const lesson of step.lessons) {
          await tx.lesson.create({
            data: {
              id: lesson.id,
              programStepId: step.id,
              slug: lesson.slug,
              title: lesson.title,
              summary: lesson.summary,
              objective: lesson.objective,
              status:
                PrismaEditorialStatus.DRAFT,
              order: lesson.order,
              estimatedMinutes:
                lesson.estimatedMinutes,
              xp: lesson.xp,
              required: lesson.required,
              retryPolicy: lesson.retryPolicy,
              prerequisites:
                lesson.prerequisites as Prisma.InputJsonValue,
              completionRules:
                lesson.completionRules as Prisma.InputJsonValue,
              takeaway: lesson.takeaway,
              recap: lesson.recap,
              relatedResourceIds:
                lesson.relatedResourceIds,
              allowCommercialReferences:
                lesson.allowCommercialReferences,
              createdBy: actorId,
              updatedBy: actorId,
            },
          });

          for (const block of lesson.blocks) {
            await tx.lessonBlock.create({
              data: {
                id: block.id,
                lessonId: lesson.id,
                type:
                  block.type as PrismaCmsBlockType,
                order: block.order,
                internalLabel:
                  block.internalLabel,
                required: block.required,
                archived: block.archived,
                data:
                  block.data as Prisma.InputJsonValue,
              },
            });
          }
        }
      }

      await tx.programVersion.create({
        data: {
          programId: duplicate.program.id,
          version: 1,
          status: "DRAFT",
          snapshot: JSON.parse(
            JSON.stringify(duplicate),
          ) as Prisma.InputJsonValue,
          createdBy: actorId,
        },
      });
    });

    return this.getSnapshot(duplicate.program.id);
  }

  async listRevisions(programId: string) {
    await this.getSnapshot(programId);

    const revisions =
      await prisma.contentRevision.findMany({
        where: {
          entityType: "program",
          entityId: programId,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

    return revisions.map((revision) => ({
      ...revision,
      createdAt: revision.createdAt.toISOString(),
    }));
  }

  async restoreRevision(
    programId: string,
    revisionId: string,
    actor: CmsUser,
  ) {
    const revision =
      await prisma.contentRevision.findFirst({
        where: {
          id: revisionId,
          entityType: "program",
          entityId: programId,
        },
      });

    if (!revision) {
      throw new NotFoundError(
        "Program revision",
        {
          programId,
          revisionId,
        },
      );
    }

    const snapshot =
      revision.snapshot as unknown as ProgramBuilderSnapshot;

    if (
      !snapshot.program ||
      snapshot.program.id !== programId
    ) {
      throw new ConflictError(
        "Revision snapshot does not match the program",
        {
          programId,
          revisionId,
        },
      );
    }

    const result = await this.saveSnapshot(
      snapshot,
      actor,
    );

    return {
      ...result,
      restoredRevisionId: revisionId,
    };
  }

  async getPublishedSnapshot(): Promise<ProgramBuilderSnapshot | null> {
    const program = await prisma.program.findFirst({
      where: {
        status: PrismaEditorialStatus.PUBLISHED,
        archivedAt: null,
      },
      orderBy: {
        publishedAt: "desc",
      },
      select: {
        id: true,
        publishedVersion: true,
      },
    });

    if (!program) {
      return null;
    }

    const version = await prisma.programVersion.findFirst({
      where: {
        programId: program.id,
        status: "PUBLISHED",
        version: program.publishedVersion,
      },
      orderBy: {
        version: "desc",
      },
      select: {
        snapshot: true,
      },
    });

    if (version?.snapshot) {
      return version.snapshot as unknown as ProgramBuilderSnapshot;
    }

    return this.findSnapshot(program.id);
  }

  async findSnapshot(
    programId: string,
  ): Promise<ProgramBuilderSnapshot | null> {
    try {
      return await this.getSnapshot(programId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return null;
      }

      throw error;
    }
  }
}

export const programBuilderService =
  new ProgramBuilderService();
