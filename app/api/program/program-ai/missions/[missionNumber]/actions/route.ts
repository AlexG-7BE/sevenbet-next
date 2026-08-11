import { requireCurrentUser } from "@/lib/auth/session";
import { productAnalyticsServer } from "@/lib/analytics/vercel-product-analytics";
import { programmeAiMissionsService } from "@/lib/programme/application/programme-ai-missions.service";
import { programmeErrorResponse, programmeResponse, readProgrammeJson } from "@/lib/programme/http";
import { assertProgrammeRateLimit } from "@/lib/programme/rate-limit";
import { routeMissionNumber } from "@/lib/programme/program-ai/mission-http";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ missionNumber: string }> },
) {
  try {
    const user = await requireCurrentUser(request.headers);
    const missionNumber = routeMissionNumber((await context.params).missionNumber);
    await assertProgrammeRateLimit("PROGRAMME_MUTATION_USER", user.id);
    const result = await programmeAiMissionsService.recordAction(
      user.id,
      missionNumber,
      await readProgrammeJson(request),
    );
    if (result.xpAwarded > 0 && result.actionPosition) {
      productAnalyticsServer.missionActionCompleted(missionNumber, result.actionPosition);
    }
    return programmeResponse({ ok: true, ...result });
  } catch (error) {
    return programmeErrorResponse(error);
  }
}
