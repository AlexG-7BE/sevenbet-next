import { programmeAiMissionOneService } from "@/lib/programme/application/programme-ai-mission-one.service";
import {
  anonymousProgrammeCookie,
  pendingProgrammeClaimCookie,
  privateCookieOptions,
  programmeErrorResponse,
  programmeResponse,
  requestCookie,
} from "@/lib/programme/http";
import { assertAnonymousProgrammeMutationRateLimit } from "@/lib/programme/rate-limit";
import { pendingClaimLifetimeMs } from "@/lib/programme/security";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const token = requestCookie(request, anonymousProgrammeCookie);
    await assertAnonymousProgrammeMutationRateLimit(token);
    const claim = await programmeAiMissionOneService.createPendingClaim(
      token,
    );
    const response = programmeResponse({
      ok: true,
      state: "registration_required",
      expiresAt: claim.expiresAt,
    }, 201);
    response.cookies.set(pendingProgrammeClaimCookie, claim.claimToken, {
      ...privateCookieOptions,
      maxAge: pendingClaimLifetimeMs / 1000,
    });
    return response;
  } catch (error) {
    return programmeErrorResponse(error);
  }
}
