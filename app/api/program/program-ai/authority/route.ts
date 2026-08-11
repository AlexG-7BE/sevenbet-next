import { programmeAiMissionOneService } from "@/lib/programme/application/programme-ai-mission-one.service";
import {
  anonymousProgrammeCookie,
  programmeErrorResponse,
  programmeResponse,
  readProgrammeJson,
  requestCookie,
} from "@/lib/programme/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const authority = await programmeAiMissionOneService.authorityStatus(
      requestCookie(request, anonymousProgrammeCookie),
    );
    return programmeResponse({ ok: true, authority });
  } catch (error) {
    return programmeErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const token = requestCookie(request, anonymousProgrammeCookie);
    const authority = await programmeAiMissionOneService.confirmAuthority(
      token,
      await readProgrammeJson(request),
    );
    return programmeResponse({ ok: true, authority });
  } catch (error) {
    return programmeErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const token = requestCookie(request, anonymousProgrammeCookie);
    const authority = await programmeAiMissionOneService.withdrawAuthority(
      token,
    );
    return programmeResponse({ ok: true, authority });
  } catch (error) {
    return programmeErrorResponse(error);
  }
}
