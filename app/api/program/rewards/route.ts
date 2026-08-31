import { requireProgrammeAcceptedUser } from "@/lib/auth/programme-user-access";
import { programmeRewardService } from "@/lib/programme/application/programme-reward.service";
import { programmeErrorResponse, programmeResponse } from "@/lib/programme/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await requireProgrammeAcceptedUser(request.headers);
    const rewards = await programmeRewardService.getRewards(user.id);
    return programmeResponse({ ok: true, rewards });
  } catch (error) {
    return programmeErrorResponse(error);
  }
}
