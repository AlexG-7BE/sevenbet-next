import { requireProgrammeAcceptedUser } from "@/lib/auth/programme-user-access";
import { missionOneService } from "@/lib/programme/application/mission-01.service";
import {
  programmeErrorResponse,
  programmeResponse,
  readProgrammeJson,
} from "@/lib/programme/http";
import { assertProgrammeRateLimit } from "@/lib/programme/rate-limit";
import { assertLegacyProgrammeMutationAllowed } from "@/lib/programme/legacy-runtime";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  try {
    assertLegacyProgrammeMutationAllowed();
    const user = await requireProgrammeAcceptedUser(request.headers);
    await assertProgrammeRateLimit("PROGRAMME_MUTATION_USER", user.id);
    const mission = await missionOneService.saveDraft(
      user.id,
      await readProgrammeJson(request),
    );
    return programmeResponse({ ok: true, mission });
  } catch (error) {
    return programmeErrorResponse(error);
  }
}
