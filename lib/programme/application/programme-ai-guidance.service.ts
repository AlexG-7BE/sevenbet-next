import { ProgrammeAiMissionsService, programmeAiMissionsService } from "@/lib/programme/application/programme-ai-missions.service";
import { ProgrammeStateConflictError } from "@/lib/programme/domain/programme-errors";
import {
  deterministicGuidance,
  deterministicReview,
  missionGuidanceOperation,
  reviewGuidanceOperation,
  type ProgramAiGeneratedResult,
} from "@/lib/programme/program-ai/mission-guidance";
import { parseProgramAiLocalWording } from "@/lib/programme/program-ai/mission-validation";
import {
  programAiReviewDefinitions,
  type ProgramAiMissionNumber,
  type ProgramAiReviewMilestone,
} from "@/lib/programme/program-ai/mission-registry";
import {
  missionGuidanceAdapterFromEnvironment,
  OpenAiMissionGuidanceAdapter,
} from "@/lib/programme/program-ai/openai-mission-guidance";
import { ProgrammeProviderError } from "@/lib/programme/program-ai/provider-errors";
import type { ProgrammeAiProviderOutcome } from "@/lib/programme/program-ai/orchestration";
import { assertProgramAiV1Enabled } from "@/lib/programme/program-ai/runtime-config";
import type { ProgrammeLocale } from "@/lib/programme/presentation";

type GuidanceAdapter = Pick<OpenAiMissionGuidanceAdapter, "generate">;

export class ProgrammeAiGuidanceService {
  constructor(
    private readonly missions: ProgrammeAiMissionsService = programmeAiMissionsService,
    private readonly adapter?: GuidanceAdapter | null,
  ) {}

  async missionGuidance(
    userId: string,
    missionNumber: ProgramAiMissionNumber,
    value: unknown,
    allowProvider = true,
  ) {
    assertProgramAiV1Enabled();
    const operation = missionGuidanceOperation[missionNumber];
    if (!operation) {
      throw new ProgrammeStateConflictError("This Mission is deterministic and does not use AI guidance");
    }
    const { locale, localWording } = parseProgramAiLocalWording(value);
    const mission = await this.missions.mission(userId, missionNumber);
    const context = operation === "M10_FINAL_PLAN"
      ? { ...finalPlanContext(mission), locale }
      : {
          operation,
          locale,
          startingPoint: (await this.missions.home(userId)).startingPoint,
          mission: {
            missionNumber,
            artifact: mission.artifact,
            actionsCompleted: mission.actionsCompleted,
          },
          ...(localWording ? { localWording } : {}),
        };
    return allowProvider
      ? this.generateOrFallback(operation, context, locale, () => deterministicGuidance(operation, context, locale))
      : { ...deterministicGuidance(operation, context, locale), providerOutcome: "fallback" as const };
  }

  async review(
    userId: string,
    milestone: ProgramAiReviewMilestone,
    value: unknown,
    allowProvider: boolean,
  ) {
    assertProgramAiV1Enabled();
    const { locale, localWording } = parseProgramAiLocalWording(value);
    const definition = programAiReviewDefinitions[milestone];
    const operation = reviewGuidanceOperation[milestone];
    const reviewContext = await this.missions.reviewContext(userId, definition.unlockMission);
    const context = {
      operation,
      locale,
      ...reviewContext,
      ...(localWording ? { localWording } : {}),
    };
    const fallback = () => deterministicReview(operation, context, locale);
    const result = allowProvider
      ? await this.generateOrFallback(operation, context, locale, fallback)
      : { ...fallback(), providerOutcome: "fallback" as const };
    if (result.kind !== "review" || wordCount(result) > definition.maxWords) {
      return { ...fallback(), providerOutcome: "invalid_output" as const };
    }
    return result;
  }

  private async generateOrFallback<T extends ProgramAiGeneratedResult>(
    operation: T["operation"],
    context: unknown,
    locale: ProgrammeLocale,
    fallback: () => T,
  ): Promise<T & { providerOutcome: ProgrammeAiProviderOutcome }> {
    try {
      const adapter = this.adapter === undefined ? missionGuidanceAdapterFromEnvironment() : this.adapter;
      if (!adapter) return { ...fallback(), providerOutcome: "fallback" };
      return { ...await adapter.generate(operation, context, locale) as T, providerOutcome: "provider" };
    } catch (error) {
      if (error instanceof ProgrammeProviderError) {
        const providerOutcome = error.providerCode === "PROVIDER_TIMEOUT"
          ? "timeout"
          : error.providerCode === "PROVIDER_INVALID_OUTPUT"
            ? "invalid_output"
            : error.providerCode === "PROVIDER_RATE_LIMIT"
              ? "rate_limited"
              : "provider_error";
        return { ...fallback(), providerOutcome };
      }
      throw error;
    }
  }
}

function finalPlanContext(mission: Awaited<ReturnType<ProgrammeAiMissionsService["mission"]>>) {
  const planPriorityIds = Array.isArray(mission.artifact.planPriorityIds)
    ? mission.artifact.planPriorityIds
    : [];
  if (planPriorityIds.length < 1 || planPriorityIds.length > 3) {
    throw new ProgrammeStateConflictError("Choose the final-plan priorities before building the one-screen plan");
  }
  const programmeFacts = "programmeFacts" in mission ? mission.programmeFacts : undefined;
  return {
    operation: "M10_FINAL_PLAN" as const,
    startingPoint: programmeFacts?.startingPoint ?? null,
    facts: programmeFacts?.facts ?? [],
    planPriorityIds,
  };
}

function wordCount(result: ProgramAiGeneratedResult) {
  if (result.kind !== "review") return 0;
  return [result.title, ...result.sections.flatMap((section) => [section.title, section.body])]
    .join(" ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

export const programmeAiGuidanceService = new ProgrammeAiGuidanceService();
