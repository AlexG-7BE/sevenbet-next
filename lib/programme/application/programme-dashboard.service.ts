import { requireControlProgram } from "@/lib/programme/application/programme-context";
import {
  emptyProgrammeDashboardDto,
  programmeDashboardDto,
} from "@/lib/programme/application/programme-presenters";
import {
  ProgrammeUnitOfWork,
  programmeUnitOfWork,
} from "@/lib/programme/infrastructure/programme-unit-of-work";

export class ProgrammeDashboardService {
  constructor(private readonly unitOfWork = programmeUnitOfWork) {}

  getDashboard(userId: string) {
    return this.unitOfWork.snapshot(async (unitOfWork) => {
      const source = await requireControlProgram(unitOfWork);
      return this.project(unitOfWork, userId, source.program.id);
    });
  }

  async project(
    unitOfWork: ProgrammeUnitOfWork,
    userId: string,
    programId: string,
  ) {
    const data = await unitOfWork.dashboard.findDashboardData(userId, programId);
    if (!data[0]) return emptyProgrammeDashboardDto(programId);
    return programmeDashboardDto(programId, data);
  }
}

export const programmeDashboardService = new ProgrammeDashboardService();
