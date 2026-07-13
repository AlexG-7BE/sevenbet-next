import {
  EditorialStatus,
  Prisma,
} from "@prisma/client";

import {
  programRepository,
  type ProgramBuilderProgram,
  type ProgramListItem,
} from "@/lib/repositories";

import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "./service-error";

export interface ProgramValidationIssue {
  path: string;
  message: string;
}

export interface ProgramValidationResult {
  valid: boolean;
  issues: ProgramValidationIssue[];
}

export interface CreateProgramInput {
  slug: string;
  internalName: string;
  title: string;
  summary?: string;
  introduction?: string;
  estimatedTotalMinutes?: number;
  language?: string;
  difficulty?: string;
  completionRules?: Prisma.InputJsonValue;
  createdBy: string;
}

export interface UpdateProgramInput {
  slug?: string;
  internalName?: string;
  title?: string;
  summary?: string;
  introduction?: string;
  estimatedTotalMinutes?: number;
  language?: string;
  difficulty?: string;
  coverImage?: string | null;
  xpCompletionReward?: number;
  certificateEnabled?: boolean;
  registrationRequirementPoint?: string;
  progressSavingBehavior?: string;
  completionRules?: Prisma.InputJsonValue;
  seoTitle?: string | null;
  seoDescription?: string | null;
  socialImage?: string | null;
  canonicalUrl?: string | null;
  scheduledPublishAt?: Date | null;
  updatedBy: string;
}

function normalizeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export class ProgramService {
  async listPrograms(): Promise<ProgramListItem[]> {
    return programRepository.findAll();
  }

  async listPublishedPrograms(): Promise<ProgramListItem[]> {
    return programRepository.findPublished();
  }

  async getProgramById(
    id: string,
  ): Promise<ProgramBuilderProgram> {
    const program = await programRepository.findById(id);

    if (!program) {
      throw new NotFoundError("Program", { id });
    }

    return program;
  }

  async getProgramBySlug(
    slug: string,
  ): Promise<ProgramBuilderProgram> {
    const normalizedSlug = normalizeSlug(slug);

    const program =
      await programRepository.findBySlug(normalizedSlug);

    if (!program) {
      throw new NotFoundError("Program", {
        slug: normalizedSlug,
      });
    }

    return program;
  }

  async createDraft(
    input: CreateProgramInput,
  ): Promise<ProgramBuilderProgram> {
    const slug = normalizeSlug(input.slug);

    if (!slug) {
      throw new ValidationError(
        "Program slug cannot be empty",
      );
    }

    if (!input.title.trim()) {
      throw new ValidationError(
        "Program title cannot be empty",
      );
    }

    if (
      await programRepository.existsBySlug(slug)
    ) {
      throw new ConflictError(
        "A program with this slug already exists",
        { slug },
      );
    }

    return programRepository.create({
      slug,
      internalName: input.internalName.trim(),
      title: input.title.trim(),
      summary: input.summary?.trim() ?? "",
      introduction: input.introduction?.trim() ?? "",
      estimatedTotalMinutes:
        input.estimatedTotalMinutes ?? 30,
      language: input.language?.trim() || "en",
      difficulty:
        input.difficulty?.trim() || "Beginner",
      completionRules: input.completionRules ?? [],
      status: EditorialStatus.DRAFT,
      createdBy: input.createdBy,
      updatedBy: input.createdBy,
    });
  }

  async updateProgram(
    id: string,
    input: UpdateProgramInput,
  ): Promise<ProgramBuilderProgram> {
    await this.getProgramById(id);

    let slug: string | undefined;

    if (input.slug !== undefined) {
      slug = normalizeSlug(input.slug);

      if (!slug) {
        throw new ValidationError(
          "Program slug cannot be empty",
        );
      }

      if (
        await programRepository.existsBySlug(
          slug,
          id,
        )
      ) {
        throw new ConflictError(
          "A program with this slug already exists",
          { slug },
        );
      }
    }

    if (
      input.title !== undefined &&
      !input.title.trim()
    ) {
      throw new ValidationError(
        "Program title cannot be empty",
      );
    }

    if (
      input.estimatedTotalMinutes !== undefined &&
      input.estimatedTotalMinutes < 1
    ) {
      throw new ValidationError(
        "Estimated duration must be greater than zero",
      );
    }

    if (
      input.xpCompletionReward !== undefined &&
      input.xpCompletionReward < 0
    ) {
      throw new ValidationError(
        "XP reward cannot be negative",
      );
    }

    return programRepository.update(id, {
      ...(slug !== undefined ? { slug } : {}),
      ...(input.internalName !== undefined
        ? {
            internalName:
              input.internalName.trim(),
          }
        : {}),
      ...(input.title !== undefined
        ? { title: input.title.trim() }
        : {}),
      ...(input.summary !== undefined
        ? { summary: input.summary.trim() }
        : {}),
      ...(input.introduction !== undefined
        ? {
            introduction:
              input.introduction.trim(),
          }
        : {}),
      ...(input.estimatedTotalMinutes !== undefined
        ? {
            estimatedTotalMinutes:
              input.estimatedTotalMinutes,
          }
        : {}),
      ...(input.language !== undefined
        ? { language: input.language.trim() }
        : {}),
      ...(input.difficulty !== undefined
        ? {
            difficulty:
              input.difficulty.trim(),
          }
        : {}),
      ...(input.coverImage !== undefined
        ? { coverImage: input.coverImage }
        : {}),
      ...(input.xpCompletionReward !== undefined
        ? {
            xpCompletionReward:
              input.xpCompletionReward,
          }
        : {}),
      ...(input.certificateEnabled !== undefined
        ? {
            certificateEnabled:
              input.certificateEnabled,
          }
        : {}),
      ...(input.registrationRequirementPoint !==
      undefined
        ? {
            registrationRequirementPoint:
              input.registrationRequirementPoint,
          }
        : {}),
      ...(input.progressSavingBehavior !== undefined
        ? {
            progressSavingBehavior:
              input.progressSavingBehavior,
          }
        : {}),
      ...(input.completionRules !== undefined
        ? {
            completionRules:
              input.completionRules,
          }
        : {}),
      ...(input.seoTitle !== undefined
        ? { seoTitle: input.seoTitle }
        : {}),
      ...(input.seoDescription !== undefined
        ? {
            seoDescription:
              input.seoDescription,
          }
        : {}),
      ...(input.socialImage !== undefined
        ? { socialImage: input.socialImage }
        : {}),
      ...(input.canonicalUrl !== undefined
        ? {
            canonicalUrl:
              input.canonicalUrl,
          }
        : {}),
      ...(input.scheduledPublishAt !== undefined
        ? {
            scheduledPublishAt:
              input.scheduledPublishAt,
          }
        : {}),
      updatedBy: input.updatedBy,
    });
  }

  validateForPublication(
    program: ProgramBuilderProgram,
  ): ProgramValidationResult {
    const issues: ProgramValidationIssue[] = [];

    if (!program.title.trim()) {
      issues.push({
        path: "title",
        message: "Program title is required",
      });
    }

    if (!program.summary.trim()) {
      issues.push({
        path: "summary",
        message: "Program summary is required",
      });
    }

    if (!program.introduction.trim()) {
      issues.push({
        path: "introduction",
        message: "Program introduction is required",
      });
    }

    if (program.steps.length === 0) {
      issues.push({
        path: "steps",
        message:
          "Program must contain at least one step",
      });
    }

    for (const step of program.steps) {
      if (!step.title.trim()) {
        issues.push({
          path: `steps.${step.id}.title`,
          message: "Step title is required",
        });
      }

      if (step.lessons.length === 0) {
        issues.push({
          path: `steps.${step.id}.lessons`,
          message:
            "Step must contain at least one lesson",
        });
      }

      for (const lesson of step.lessons) {
        if (!lesson.title.trim()) {
          issues.push({
            path: `lessons.${lesson.id}.title`,
            message: "Lesson title is required",
          });
        }

        if (lesson.blocks.length === 0) {
          issues.push({
            path: `lessons.${lesson.id}.blocks`,
            message:
              "Lesson must contain at least one block",
          });
        }
      }
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  async validateProgram(
    id: string,
  ): Promise<ProgramValidationResult> {
    const program = await this.getProgramById(id);

    return this.validateForPublication(program);
  }

  async submitForReview(
    id: string,
    updatedBy: string,
  ): Promise<ProgramBuilderProgram> {
    const program = await this.getProgramById(id);

    if (
      program.status !== EditorialStatus.DRAFT
    ) {
      throw new ConflictError(
        "Only draft programs can be submitted for review",
        {
          id,
          currentStatus: program.status,
        },
      );
    }

    return programRepository.update(id, {
      status: EditorialStatus.IN_REVIEW,
      updatedBy,
    });
  }

  async approveProgram(
    id: string,
    updatedBy: string,
  ): Promise<ProgramBuilderProgram> {
    const program = await this.getProgramById(id);

    if (
      program.status !==
      EditorialStatus.IN_REVIEW
    ) {
      throw new ConflictError(
        "Only programs in review can be approved",
        {
          id,
          currentStatus: program.status,
        },
      );
    }

    return programRepository.update(id, {
      status: EditorialStatus.APPROVED,
      updatedBy,
    });
  }

  async publishProgram(
    id: string,
    updatedBy: string,
  ): Promise<ProgramBuilderProgram> {
    const program = await this.getProgramById(id);

    const validation =
      this.validateForPublication(program);

    if (!validation.valid) {
      throw new ValidationError(
        "Program cannot be published",
        validation.issues,
      );
    }

    if (
      program.status !== EditorialStatus.APPROVED &&
      program.status !== EditorialStatus.SCHEDULED
    ) {
      throw new ConflictError(
        "Program must be approved before publication",
        {
          id,
          currentStatus: program.status,
        },
      );
    }

    return programRepository.update(id, {
      status: EditorialStatus.PUBLISHED,
      publishedAt: new Date(),
      scheduledPublishAt: null,
      publishedVersion: program.draftVersion,
      draftVersion: {
        increment: 1,
      },
      updatedBy,
    });
  }

  async returnToDraft(
    id: string,
    updatedBy: string,
  ): Promise<ProgramBuilderProgram> {
    await this.getProgramById(id);

    return programRepository.update(id, {
      status: EditorialStatus.DRAFT,
      updatedBy,
    });
  }

  async archiveProgram(
    id: string,
  ): Promise<void> {
    await this.getProgramById(id);
    await programRepository.archive(id);
  }
}

export const programService =
  new ProgramService();
