import { CONTROL_PROGRAM_SLUG } from "@/lib/programme/contract";
import {
  ProgrammeResourceNotFoundError,
  ProgrammeStateConflictError,
} from "@/lib/programme/domain/programme-errors";
import { ProgrammeUnitOfWork } from "@/lib/programme/infrastructure/programme-unit-of-work";

export async function requireControlProgram(unitOfWork: ProgrammeUnitOfWork) {
  const source = await unitOfWork.progress.findControlProgram();
  if (!source) {
    throw new ProgrammeResourceNotFoundError("Published Control Program", {
      slug: CONTROL_PROGRAM_SLUG,
    });
  }
  if (source.program.steps.length < 10) {
    throw new ProgrammeStateConflictError(
      "Published Control Program must contain ten missions",
    );
  }
  return source;
}

export async function requireEnrollment(
  unitOfWork: ProgrammeUnitOfWork,
  userId: string,
) {
  const source = await requireControlProgram(unitOfWork);
  const enrollment = await unitOfWork.progress.findEnrollment(userId, source.program.id);
  if (!enrollment) throw new ProgrammeResourceNotFoundError("Program enrollment");
  return { source, enrollment };
}
