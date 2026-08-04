import {
  anonymousProgrammeCookie,
  pendingProgrammeClaimCookie,
  privateCookieOptions,
  programmeErrorResponse,
  programmeResponse,
  requestCookie,
} from "@/lib/programme/http";
import { assertProgrammeRateLimit } from "@/lib/programme/rate-limit";
import { hashOpaqueToken, pendingClaimLifetimeMs } from "@/lib/programme/security";
import { programmeSessionService } from "@/lib/programme/application/programme-session.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const token = requestCookie(request, anonymousProgrammeCookie);
    assertProgrammeRateLimit(`claim:${hashOpaqueToken(token)}`, {
      limit: 5,
      windowMs: 60_000,
    });
    const claim = await programmeSessionService.createPendingClaim(token);
    const response = programmeResponse(
      { ok: true, state: "registration_required", expiresAt: claim.expiresAt },
      201,
    );
    response.cookies.set(pendingProgrammeClaimCookie, claim.claimToken, {
      ...privateCookieOptions,
      maxAge: pendingClaimLifetimeMs / 1000,
    });
    return response;
  } catch (error) {
    return programmeErrorResponse(error);
  }
}
