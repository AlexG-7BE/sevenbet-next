import { requireCurrentUser } from "@/lib/auth/session";
import {
  programmeErrorResponse,
  programmeResponse,
  readProgrammeJson,
} from "@/lib/programme/http";
import { programmeFlowService } from "@/lib/services/programme-flow.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser(request.headers);
    const mission = await programmeFlowService.getMissionTwoDraft(user.id);
    return programmeResponse({ ok: true, mission });
  } catch (error) {
    return programmeErrorResponse(error);
  }
}
export async function PUT(request: Request) {
  try {
    const user = await requireCurrentUser(request.headers);
    const mission = await programmeFlowService.saveMissionTwoDraft(
      user.id,
      await readProgrammeJson(request),
    );
    return programmeResponse({ ok: true, mission });
  } catch (error) {
    return programmeErrorResponse(error);
  }
}
