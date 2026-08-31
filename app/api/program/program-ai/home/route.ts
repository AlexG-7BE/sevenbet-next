import { requireProgrammeAcceptedUser } from "@/lib/auth/programme-user-access";
import { programmeAiMissionsService } from "@/lib/programme/application/programme-ai-missions.service";
import { programmeErrorResponse, programmeResponse } from "@/lib/programme/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await requireProgrammeAcceptedUser(request.headers);
    const home = await programmeAiMissionsService.home(user.id);
    return programmeResponse({ ok: true, home });
  } catch (error) {
    return programmeErrorResponse(error);
  }
}
