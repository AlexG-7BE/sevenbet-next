import { requireCurrentUser } from "@/lib/auth/session";
import { programmeAiMissionOneService } from "@/lib/programme/application/programme-ai-mission-one.service";
import { programmeErrorResponse, programmeResponse } from "@/lib/programme/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser(request.headers);
    const home = await programmeAiMissionOneService.home(user.id);
    return programmeResponse({ ok: true, home });
  } catch (error) {
    return programmeErrorResponse(error);
  }
}
