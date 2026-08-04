import { requireCurrentUser } from "@/lib/auth/session";
import { programmeErrorResponse, programmeResponse } from "@/lib/programme/http";
import { programmeFlowService } from "@/lib/services/programme-flow.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser(request.headers);
    const rewards = await programmeFlowService.getRewards(user.id);
    return programmeResponse({ ok: true, rewards });
  } catch (error) {
    return programmeErrorResponse(error);
  }
}
