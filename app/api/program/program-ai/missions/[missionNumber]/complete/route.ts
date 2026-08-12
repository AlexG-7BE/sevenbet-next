import { requireCurrentUser } from "@/lib/auth/session";
import { productAnalyticsServer } from "@/lib/analytics/vercel-product-analytics";
import { programmeAiMissionsService } from "@/lib/programme/application/programme-ai-missions.service";
import { programmeErrorResponse, programmeResponse, readProgrammeJson } from "@/lib/programme/http";
import { assertProgrammeRateLimit } from "@/lib/programme/rate-limit";
import { routeMissionNumber } from "@/lib/programme/program-ai/mission-http";
import { assertOnlyKeys, objectInput } from "@/lib/programme/validation";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ missionNumber: string }> },
) {
  try {
    const user = await requireCurrentUser(request.headers);
    const missionNumber = routeMissionNumber((await context.params).missionNumber);
    await assertProgrammeRateLimit("PROGRAMME_MUTATION_USER", user.id);
    const body = objectInput(await readProgrammeJson(request));
    assertOnlyKeys(body, []);
    const result = await programmeAiMissionsService.complete(user.id, missionNumber);
    if (result.xpAwarded > 0) {
      productAnalyticsServer.missionCompleted(missionNumber);
      if (missionNumber === 10) productAnalyticsServer.programmeCompleted();
    }
    return programmeResponse({ ok: true, ...result });
  } catch (error) {
    return programmeErrorResponse(error);
  }
}
