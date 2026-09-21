import { ServiceError } from "@/lib/services/service-error";

export class LearnApplyError extends ServiceError {
  constructor(message: string, code: string, statusCode = 400, details?: unknown) {
    super(message, code, statusCode, details);
    this.name = "LearnApplyError";
  }
}
