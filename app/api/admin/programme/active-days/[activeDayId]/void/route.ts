import { adminAuthErrorResponse, requireAdminUser } from "@/lib/auth/admin";
import { activeDayService } from "@/lib/programme/application/active-day.service";
import {
  programmeErrorResponse,
  programmeResponse,
  readProgrammeJson,
} from "@/lib/programme/http";
import { assertOnlyKeys, objectInput } from "@/lib/programme/validation";

type Context = { params: Promise<{ activeDayId: string }> };

export async function POST(request: Request, { params }: Context) {
  try {
    const actor = await requireAdminUser(request);
    const body = objectInput(await readProgrammeJson(request));
    assertOnlyKeys(body, ["reason"]);
    await activeDayService.voidActiveDay(
      { id: actor.id, role: actor.role },
      (await params).activeDayId,
      body.reason,
    );
    return programmeResponse({ ok: true });
  } catch (error) {
    return adminAuthErrorResponse(error) ?? programmeErrorResponse(error);
  }
}
