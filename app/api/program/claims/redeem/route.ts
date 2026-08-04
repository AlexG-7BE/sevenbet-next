import { requireCurrentUser } from "@/lib/auth/session";
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
import { programmeFlowService } from "@/lib/services/programme-flow.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser(request.headers);
    const claimToken = requestCookie(request, pendingProgrammeClaimCookie);
    assertProgrammeRateLimit(`redeem:${user.id}:${hashOpaqueToken(claimToken)}`, {
      limit: 10,
      windowMs: 60_000,
    });
    const body = objectInput(await readProgrammeJson(request));
    assertOnlyKeys(body, ["timeZone"]);
    const dashboard = await programmeFlowService.redeemPendingClaim(
      user.id,
      claimToken,
      body.timeZone,
    );
    const response = programmeResponse({ ok: true, dashboard });
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
