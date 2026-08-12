import { requireCurrentUser } from "@/lib/auth/session";
import { productAnalyticsServer } from "@/lib/analytics/vercel-product-analytics";
import { programmeAiGuidanceService } from "@/lib/programme/application/programme-ai-guidance.service";
import { programmeErrorResponse, programmeResponse, readProgrammeJson } from "@/lib/programme/http";
import { programmeProviderRateLimitAllowance } from "@/lib/programme/rate-limit";
import { routeMissionNumber } from "@/lib/programme/program-ai/mission-http";
import { missionGuidanceOperation } from "@/lib/programme/program-ai/mission-guidance";
import { isProgramAiRealProviderEnabled } from "@/lib/programme/program-ai/runtime-config";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ missionNumber: string }> },
) {
  try {
    const user = await requireCurrentUser(request.headers);
    const missionNumber = routeMissionNumber((await context.params).missionNumber);
    const providerConfigured = isProgramAiRealProviderEnabled();
    const providerAllowed = !providerConfigured
      || await programmeProviderRateLimitAllowance("PROGRAMME_MISSION_GUIDANCE_USER", user.id);
    const guidance = await programmeAiGuidanceService.missionGuidance(
      user.id,
      missionNumber,
      await readProgrammeJson(request),
      providerAllowed,
    );
    const operation = missionGuidanceOperation[missionNumber];
    if (operation) {
      productAnalyticsServer.aiOutcome({
        operation,
        result: providerConfigured && !providerAllowed
          ? "rate_limited"
          : guidance.providerOutcome,
      });
    }
    return programmeResponse({
      ok: true,
      guidance: {
        kind: guidance.kind,
        operation: guidance.operation,
        title: guidance.title,
        summary: guidance.summary,
        options: guidance.options,
        generation: guidance.generation,
      },
    });
  } catch (error) {
    return programmeErrorResponse(error);
  }
}
