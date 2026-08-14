import { requireCurrentUser } from "@/lib/auth/session";
import { missionFourService } from "@/lib/programme/application/mission-04.service";
import {
  programmeErrorResponse,
  programmeResponse,
  readProgrammeJson,
} from "@/lib/programme/http";
import { assertLegacyProgrammeMutationAllowed } from "@/lib/programme/legacy-runtime";
import { assertProgrammeRateLimit } from "@/lib/programme/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser(request.headers);
    const mission = await missionFourService.getDraft(user.id);
    return programmeResponse({ ok: true, mission });
  } catch (error) {
    return programmeErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    assertLegacyProgrammeMutationAllowed();
    const user = await requireCurrentUser(request.headers);
    await assertProgrammeRateLimit("PROGRAMME_MUTATION_USER", user.id);
    const mission = await missionFourService.saveDraft(
      user.id,
      await readProgrammeJson(request),
    );
    return programmeResponse({ ok: true, mission });
  } catch (error) {
    return programmeErrorResponse(error);
  }
}
