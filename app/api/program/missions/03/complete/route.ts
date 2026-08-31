import { requireProgrammeAcceptedUser } from "@/lib/auth/programme-user-access";
import { missionThreeService } from "@/lib/programme/application/mission-03.service";
import { programmeErrorResponse, programmeResponse } from "@/lib/programme/http";
import { assertProgrammeRateLimit } from "@/lib/programme/rate-limit";
import { assertLegacyProgrammeMutationAllowed } from "@/lib/programme/legacy-runtime";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    assertLegacyProgrammeMutationAllowed();
    const user = await requireProgrammeAcceptedUser(request.headers);
    await assertProgrammeRateLimit("PROGRAMME_MUTATION_USER", user.id);
    const dashboard = await missionThreeService.complete(user.id);
    return programmeResponse({ ok: true, dashboard });
  } catch (error) {
    return programmeErrorResponse(error);
  }
}
