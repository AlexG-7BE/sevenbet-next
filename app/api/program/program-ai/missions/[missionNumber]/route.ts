import { requireProgrammeAcceptedUser } from "@/lib/auth/programme-user-access";
import { programmeAiMissionsService } from "@/lib/programme/application/programme-ai-missions.service";
import { programmeErrorResponse, programmeResponse } from "@/lib/programme/http";
import { routeMissionNumber } from "@/lib/programme/program-ai/mission-http";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ missionNumber: string }> },
) {
  try {
    const user = await requireProgrammeAcceptedUser(request.headers);
    const mission = await programmeAiMissionsService.mission(
      user.id,
      routeMissionNumber((await context.params).missionNumber),
    );
    return programmeResponse({ ok: true, mission });
  } catch (error) {
    return programmeErrorResponse(error);
  }
}
