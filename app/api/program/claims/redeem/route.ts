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
import { assertOnlyKeys, objectInput } from "@/lib/programme/validation";
import { programmeClaimService } from "@/lib/programme/application/programme-claim.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser(request.headers);
    const claimToken = requestCookie(request, pendingProgrammeClaimCookie);
    await assertProgrammeRateLimit("PROGRAMME_MUTATION_USER", user.id);
    const body = objectInput(await readProgrammeJson(request));
    assertOnlyKeys(body, ["timeZone"]);
    const dashboard = await programmeClaimService.redeemPendingClaim(
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
