import { requireCurrentUser } from "@/lib/auth/session";
import { programmeAiMissionOneService } from "@/lib/programme/application/programme-ai-mission-one.service";
import { programmeAiMissionsService } from "@/lib/programme/application/programme-ai-missions.service";
import {
  anonymousProgrammeCookie,
  pendingProgrammeClaimCookie,
  privateCookieOptions,
  programmeErrorResponse,
  programmeResponse,
  readProgrammeJson,
  requestCookie,
} from "@/lib/programme/http";
import { assertProgrammeRateLimit } from "@/lib/programme/rate-limit";
import { hashOpaqueToken } from "@/lib/programme/security";
import { assertOnlyKeys, objectInput } from "@/lib/programme/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser(request.headers);
    const claimToken = requestCookie(request, pendingProgrammeClaimCookie);
    assertProgrammeRateLimit(`program-ai:redeem:${user.id}:${hashOpaqueToken(claimToken)}`, {
      limit: 10,
      windowMs: 60_000,
    });
    const body = objectInput(await readProgrammeJson(request));
    assertOnlyKeys(body, ["timeZone", "startingPoint"]);
    await programmeAiMissionOneService.redeemPendingClaim(
      user.id,
      claimToken,
      { timeZone: body.timeZone, startingPoint: body.startingPoint },
    );
    const home = await programmeAiMissionsService.home(user.id);
    const response = programmeResponse({ ok: true, home });
    response.cookies.set(pendingProgrammeClaimCookie, "", {
      ...privateCookieOptions,
      maxAge: 0,
    });
    response.cookies.set(anonymousProgrammeCookie, "", {
      ...privateCookieOptions,
      maxAge: 0,
    });
    return response;
  } catch (error) {
    return programmeErrorResponse(error);
  }
}
