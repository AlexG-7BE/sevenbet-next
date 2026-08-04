import {
  ConflictError,
  NotFoundError,
  ServiceError,
  ValidationError,
} from "@/lib/services/service-error";

export class ProgrammeResourceNotFoundError extends NotFoundError {
  constructor(entity: string, details?: unknown) {
    super(entity, details);
    this.name = "ProgrammeResourceNotFoundError";
  }
}

export class ProgrammeStateConflictError extends ConflictError {
  constructor(message: string, details?: unknown) {
    super(message, details);
    this.name = "ProgrammeStateConflictError";
  }
}

export class MissionLockedError extends ProgrammeStateConflictError {
  constructor(prerequisite: number, missionNumber: number) {
    super(
      `Mission ${String(prerequisite).padStart(2, "0")} must be completed before Mission ${String(missionNumber).padStart(2, "0")}`,
    );
    this.name = "MissionLockedError";
  }
}

export class IncompleteMissionError extends ValidationError {
  constructor(missing: readonly string[]) {
    super("Required mission task states are incomplete", { fields: missing });
    this.name = "IncompleteMissionError";
  }
}

export class ClaimExpiredError extends ServiceError {
  constructor() {
    super("Pending programme claim has expired", "CLAIM_EXPIRED", 410);
    this.name = "ClaimExpiredError";
  }
}

export class ProgrammeSessionExpiredError extends ServiceError {
  constructor() {
    super("Anonymous programme session has expired", "SESSION_EXPIRED", 410);
    this.name = "ProgrammeSessionExpiredError";
  }
}

export class ProgrammePermissionError extends ServiceError {
  constructor(message: string, code = "STAFF_PERMISSION_REQUIRED") {
    super(message, code, 403);
    this.name = "ProgrammePermissionError";
  }
}
