import { requireCurrentUser } from "@/lib/auth/session";
import {
  programmeErrorResponse,
  programmeResponse,
  readProgrammeJson,
} from "@/lib/programme/http";
import { programmeFlowService } from "@/lib/services/programme-flow.service";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  try {
    const user = await requireCurrentUser(request.headers);
    const currentGoal = await programmeFlowService.updateCurrentGoal(
      user.id,
      await readProgrammeJson(request),
    );
    return programmeResponse({ ok: true, currentGoal });
  } catch (error) {
    return programmeErrorResponse(error);
  }
}
export async function DELETE(request: Request) {
  try {
    const user = await requireCurrentUser(request.headers);
    await programmeFlowService.deleteCurrentGoal(user.id);
    return programmeResponse({ ok: true });
  } catch (error) {
    return programmeErrorResponse(error);
  }
}
