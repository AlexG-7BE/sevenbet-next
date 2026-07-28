import { programReflectionRepository } from "@/lib/repositories/program-reflection.repository";
import { userProgressRepository } from "@/lib/repositories/user-progress.repository";
import { NotFoundError, ValidationError } from "./service-error";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function validateId(value: string, field: string) {
  if (!uuidPattern.test(value)) throw new ValidationError(`${field} must be a valid UUID`);
}

function isReflectionBlock(enrollment: Awaited<ReturnType<typeof userProgressRepository.findEnrollment>>, blockId: string) {
  const snapshot = enrollment?.programVersion.snapshot as unknown as {
    steps?: Array<{ lessons?: Array<{ blocks?: Array<{ id: string; type: string; archived?: boolean }> }> }>;
  };
  return snapshot.steps?.some((step) => step.lessons?.some((lesson) =>
    lesson.blocks?.some((block) => block.id === blockId && !block.archived && ["EXERCISE", "REFLECTION", "PRACTICAL_TASK"].includes(block.type)),
  )) ?? false;
}

export class ProgramReflectionService {
  async list(userId: string, programId: string) {
    validateId(programId, "programId");
    const enrollment = await userProgressRepository.findEnrollment(userId, programId);
    if (!enrollment) throw new NotFoundError("Program enrollment", { programId });
    return programReflectionRepository.list(enrollment.id);
  }

  async save(userId: string, input: { programId: string; blockId: string; content: string }) {
    validateId(input.programId, "programId");
    validateId(input.blockId, "blockId");
    const content = input.content.trim();
    if (!content || content.length > 4000) throw new ValidationError("Reflection must contain 1-4000 characters");
    const enrollment = await userProgressRepository.findEnrollment(userId, input.programId);
    if (!enrollment) throw new NotFoundError("Program enrollment", { programId: input.programId });
    if (!isReflectionBlock(enrollment, input.blockId)) {
      throw new ValidationError("Block does not support private reflections", { blockId: input.blockId });
    }
    return programReflectionRepository.upsert(enrollment.id, input.blockId, content);
  }

  async delete(userId: string, input: { programId: string; blockId: string }) {
    validateId(input.programId, "programId");
    validateId(input.blockId, "blockId");
    const enrollment = await userProgressRepository.findEnrollment(userId, input.programId);
    if (!enrollment) throw new NotFoundError("Program enrollment", { programId: input.programId });
    await programReflectionRepository.delete(enrollment.id, input.blockId);
  }
}

export const programReflectionService = new ProgramReflectionService();
