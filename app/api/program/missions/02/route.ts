import { requireCurrentUser } from "@/lib/auth/session";
import { missionTwoService } from "@/lib/programme/application/mission-02.service";
import {
  programmeErrorResponse,
  programmeResponse,
  readProgrammeJson,
} from "@/lib/programme/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser(request.headers);
    const mission = await missionTwoService.getDraft(user.id);
    return programmeResponse({ ok: true, mission });
  } catch (error) {
    return programmeErrorResponse(error);
  }
}
export async function PUT(request: Request) {
  try {
    const user = await requireCurrentUser(request.headers);
    const mission = await missionTwoService.saveDraft(
      user.id,
      await readProgrammeJson(request),
    );
    return programmeResponse({ ok: true, mission });
  } catch (error) {
    return programmeErrorResponse(error);
  }
}
