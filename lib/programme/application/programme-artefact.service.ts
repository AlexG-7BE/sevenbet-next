import { requireEnrollment } from "@/lib/programme/application/programme-context";
import {
  activeBoundaryDto,
  currentGoalDto,
  urgeLearningRecordDto,
} from "@/lib/programme/application/programme-presenters";
import { ProgrammeResourceNotFoundError } from "@/lib/programme/domain/programme-errors";
import { programmeUnitOfWork } from "@/lib/programme/infrastructure/programme-unit-of-work";
import {
  parseActiveBoundary,
  parseCurrentGoal,
  parseEarlySignalChoice,
} from "@/lib/programme/validation";
import { ServiceError, ValidationError } from "@/lib/services/service-error";

export class ProgrammeArtefactService {
  constructor(private readonly unitOfWork = programmeUnitOfWork) {}

  async updateMomentMap(_userId: string, _value: unknown): Promise<never> {
    throw new ServiceError(
      "Moment Map narrative is stored only in this browser session",
      "LOCAL_ONLY_CONTENT",
      410,
    );
  }

  async deleteMomentMap(userId: string, now = new Date()) {
    const { enrollment } = await requireEnrollment(this.unitOfWork, userId);
    const momentMap = await this.unitOfWork.artefacts.findMomentMap(enrollment.id);
    if (!momentMap || momentMap.deletedAt) {
      throw new ProgrammeResourceNotFoundError("Moment Map");
    }
    await this.unitOfWork.artefacts.eraseMomentMap(momentMap.id, now);
  }

  async updateCurrentGoal(userId: string, value: unknown, now = new Date()) {
    const { enrollment } = await requireEnrollment(this.unitOfWork, userId);
    const currentGoal = await this.unitOfWork.artefacts.findCurrentGoal(enrollment.id);
    if (!currentGoal || currentGoal.deletedAt) {
      throw new ProgrammeResourceNotFoundError("Current Goal");
    }
    const input = parseCurrentGoal(value, { now });
    if (
      input.sourceMomentMapId
      && input.sourceMomentMapId !== currentGoal.sourceMomentMapId
    ) {
      throw new ValidationError("sourceMomentMapId cannot be changed");
    }
    const data = {
      ...(input.direction ? { direction: input.direction } : {}),
      ...(input.reviewAt ? { reviewAt: input.reviewAt } : {}),
      ...(input.confidence !== undefined ? { confidence: input.confidence } : {}),
      ...(input.status ? { status: input.status } : {}),
    };
    if (!Object.keys(data).length) {
      throw new ValidationError("At least one Current Goal field is required");
    }
    const updated = await this.unitOfWork.artefacts.updateCurrentGoal(
      currentGoal.id,
      data,
    );
    return currentGoalDto(updated);
  }

  async deleteCurrentGoal(userId: string, now = new Date()) {
    const { enrollment } = await requireEnrollment(this.unitOfWork, userId);
    const currentGoal = await this.unitOfWork.artefacts.findCurrentGoal(enrollment.id);
    if (!currentGoal || currentGoal.deletedAt) {
      throw new ProgrammeResourceNotFoundError("Current Goal");
    }
    await this.unitOfWork.artefacts.eraseCurrentGoal(currentGoal.id, now);
  }

  async updateUrgeLearningRecord(userId: string, value: unknown) {
    const { enrollment } = await requireEnrollment(this.unitOfWork, userId);
    const record = await this.unitOfWork.artefacts.findUrgeLearningRecord(enrollment.id);
    if (!record || record.deletedAt) {
      throw new ProgrammeResourceNotFoundError("Urge Learning Record");
    }
    const input = parseEarlySignalChoice(value);
    const updated = await this.unitOfWork.artefacts.updateUrgeLearningRecord(record.id, {
      earlySignalCategory: null,
      earlySignalText: null,
      notNow: input.signalChoice === "not_now",
    });
    return urgeLearningRecordDto(updated);
  }

  async deleteUrgeLearningRecord(userId: string, now = new Date()) {
    const { enrollment } = await requireEnrollment(this.unitOfWork, userId);
    const record = await this.unitOfWork.artefacts.findUrgeLearningRecord(enrollment.id);
    if (!record || record.deletedAt) {
      throw new ProgrammeResourceNotFoundError("Urge Learning Record");
    }
    await this.unitOfWork.artefacts.eraseUrgeLearningRecord(record.id, now);
  }

  async updateActiveBoundary(userId: string, value: unknown, now = new Date()) {
    const { enrollment } = await requireEnrollment(this.unitOfWork, userId);
    const current = await this.unitOfWork.artefacts.findActiveBoundary(enrollment.id);
    if (!current || current.deletedAt) {
      throw new ProgrammeResourceNotFoundError("Active Boundary");
    }
    const input = parseActiveBoundary(value, { now });
    const data = {
      ...(input.category ? { category: input.category } : {}),
      ...(input.triggerType ? { triggerType: input.triggerType } : {}),
      ...(input.limitValue !== undefined ? { limitValue: input.limitValue } : {}),
      ...(input.executionMethod ? { executionMethod: input.executionMethod } : {}),
      ...(input.reviewAt ? { reviewAt: input.reviewAt } : {}),
      ...(input.status ? { status: input.status } : {}),
    };
    if (!Object.keys(data).length) {
      throw new ValidationError("At least one Active Boundary field is required");
    }
    const updated = await this.unitOfWork.artefacts.updateActiveBoundary(current.id, data);
    return activeBoundaryDto(updated);
  }

  async deleteActiveBoundary(userId: string, now = new Date()) {
    const { enrollment } = await requireEnrollment(this.unitOfWork, userId);
    const current = await this.unitOfWork.artefacts.findActiveBoundary(enrollment.id);
    if (!current || current.deletedAt) {
      throw new ProgrammeResourceNotFoundError("Active Boundary");
    }
    await this.unitOfWork.artefacts.eraseActiveBoundary(current.id, now);
  }
}

export const programmeArtefactService = new ProgrammeArtefactService();
