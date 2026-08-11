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
import { assertProgramAiV1Enabled } from "@/lib/programme/program-ai/runtime-config";

type GuidanceAdapter = Pick<OpenAiMissionGuidanceAdapter, "generate">;

export class ProgrammeAiGuidanceService {
  constructor(
    private readonly missions: ProgrammeAiMissionsService = programmeAiMissionsService,
    private readonly adapter?: GuidanceAdapter | null,
  ) {}

  async missionGuidance(userId: string, missionNumber: ProgramAiMissionNumber, value: unknown) {
    assertProgramAiV1Enabled();
    const operation = missionGuidanceOperation[missionNumber];
    if (!operation) {
      throw new ProgrammeStateConflictError("This Mission is deterministic and does not use AI guidance");
    }
    const { localWording } = parseProgramAiLocalWording(value);
    const [mission, home] = await Promise.all([
      this.missions.mission(userId, missionNumber),
      this.missions.home(userId),
    ]);
    const context = {
      operation,
      startingPoint: home.startingPoint,
      mission: {
        missionNumber,
        title: mission.title,
        artifact: mission.artifact,
        actionsCompleted: mission.actionsCompleted,
      },
      ...(localWording ? { localWording } : {}),
    };
    return this.generateOrFallback(operation, context, () => deterministicGuidance(operation, context));
  }

  async review(
    userId: string,
    milestone: ProgramAiReviewMilestone,
    value: unknown,
    allowProvider: boolean,
  ) {
    assertProgramAiV1Enabled();
    const { localWording } = parseProgramAiLocalWording(value);
    const definition = programAiReviewDefinitions[milestone];
    const operation = reviewGuidanceOperation[milestone];
    const reviewContext = await this.missions.reviewContext(userId, definition.unlockMission);
    const context = {
      operation,
      ...reviewContext,
      ...(localWording ? { localWording } : {}),
    };
    const fallback = () => deterministicReview(operation, context);
    const result = allowProvider
      ? await this.generateOrFallback(operation, context, fallback)
      : fallback();
    if (result.kind !== "review" || wordCount(result) > definition.maxWords) return fallback();
    return result;
  }

  private async generateOrFallback<T extends ProgramAiGeneratedResult>(
    operation: T["operation"],
    context: unknown,
    fallback: () => T,
  ): Promise<T> {
    try {
      const adapter = this.adapter === undefined ? missionGuidanceAdapterFromEnvironment() : this.adapter;
      if (!adapter) return fallback();
      return await adapter.generate(operation, context) as T;
    } catch (error) {
      if (error instanceof ProgrammeProviderError) return fallback();
      throw error;
    }
  }
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
