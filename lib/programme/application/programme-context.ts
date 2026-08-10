import {
  ProgrammeDefinitionUnavailableError,
  ProgrammeResourceNotFoundError,
} from "@/lib/programme/domain/programme-errors";
import { ProgrammeUnitOfWork } from "@/lib/programme/infrastructure/programme-unit-of-work";

export async function requireControlProgram(unitOfWork: ProgrammeUnitOfWork) {
  const source = await unitOfWork.progress.findControlProgram();
  if (!source) {
    throw new ProgrammeDefinitionUnavailableError();
  }
  if (source.program.steps.length < 10) throw new ProgrammeDefinitionUnavailableError();
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
