import {
  anonymousProgrammeCookie,
  pendingProgrammeClaimCookie,
  privateCookieOptions,
  programmeErrorResponse,
  programmeResponse,
  requestAddress,
} from "@/lib/programme/http";
import { requireCurrentUser } from "@/lib/auth/session";
import { assertProgrammeRateLimit } from "@/lib/programme/rate-limit";
import { anonymousSessionLifetimeMs } from "@/lib/programme/security";
import { programmeSessionService } from "@/lib/programme/application/programme-session.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    assertProgrammeRateLimit(`session:create:${requestAddress(request)}`, {
      limit: 10,
      windowMs: 60_000,
    });
    const result = await programmeSessionService.createAnonymousSession();
    const response = programmeResponse({ ok: true, session: result.session }, 201);
    response.cookies.set(anonymousProgrammeCookie, result.token, {
      ...privateCookieOptions,
      maxAge: anonymousSessionLifetimeMs / 1000,
    });
    return response;
  } catch (error) {
    return programmeErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    await requireCurrentUser(request.headers);
    const response = programmeResponse({ ok: true });
    response.cookies.set(anonymousProgrammeCookie, "", {
      ...privateCookieOptions,
      maxAge: 0,
    });
    response.cookies.set(pendingProgrammeClaimCookie, "", {
      ...privateCookieOptions,
      maxAge: 0,
    });
    return response;
  } catch (error) {
    return programmeErrorResponse(error);
  }
}
