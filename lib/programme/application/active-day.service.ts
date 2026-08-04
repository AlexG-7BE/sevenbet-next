import {
  ProgrammePermissionError,
  ProgrammeResourceNotFoundError,
} from "@/lib/programme/domain/programme-errors";
import { programmeUnitOfWork } from "@/lib/programme/infrastructure/programme-unit-of-work";
import { ValidationError } from "@/lib/services/service-error";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class ActiveDayService {
  constructor(private readonly unitOfWork = programmeUnitOfWork) {}

  async voidActiveDay(
    actor: { id: string; role: string },
    activeDayId: string,
    reasonValue: unknown,
    now = new Date(),
  ) {
    if (actor.role !== "SUPER_ADMIN") {
      throw new ProgrammePermissionError("SUPER_ADMIN access required");
    }
    if (!uuidPattern.test(activeDayId)) {
      throw new ValidationError("activeDayId must be a valid UUID");
    }
    if (
      typeof reasonValue !== "string"
      || reasonValue.trim().length < 10
      || reasonValue.trim().length > 500
    ) {
      throw new ValidationError("reason must contain 10-500 characters");
    }
    const result = await this.unitOfWork.rewards.voidActiveDay({
      activeDayId,
      adminUserId: actor.id,
      reason: reasonValue.trim(),
      voidedAt: now,
    });
    if (result.count !== 1) throw new ProgrammeResourceNotFoundError("Active day");
  }
}

export const activeDayService = new ActiveDayService();
