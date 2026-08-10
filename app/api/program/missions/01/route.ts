import { requireCurrentUser } from "@/lib/auth/session";
import { missionOneService } from "@/lib/programme/application/mission-01.service";
import {
  programmeErrorResponse,
  programmeResponse,
  readProgrammeJson,
} from "@/lib/programme/http";
import { assertProgrammeRateLimit } from "@/lib/programme/rate-limit";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  try {
    const user = await requireCurrentUser(request.headers);
    assertProgrammeRateLimit(`mission-01:user:${user.id}`, {
      limit: 60,
      windowMs: 60_000,
    });
    const mission = await missionOneService.saveDraft(
      user.id,
      await readProgrammeJson(request),
    );
    return programmeResponse({ ok: true, mission });
  } catch (error) {
    return programmeErrorResponse(error);
  }
}
