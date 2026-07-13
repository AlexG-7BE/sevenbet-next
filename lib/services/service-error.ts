export class ServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 400,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ServiceError";
  }
}

export class NotFoundError extends ServiceError {
  constructor(entity: string, details?: unknown) {
    super(
      `${entity} not found`,
      "NOT_FOUND",
      404,
      details,
    );

    this.name = "NotFoundError";
  }
}

export class ConflictError extends ServiceError {
  constructor(message: string, details?: unknown) {
    super(
      message,
      "CONFLICT",
      409,
      details,
    );

    this.name = "ConflictError";
  }
}

export class ValidationError extends ServiceError {
  constructor(message: string, details?: unknown) {
    super(
      message,
      "VALIDATION_ERROR",
      422,
      details,
    );

    this.name = "ValidationError";
  }
}
