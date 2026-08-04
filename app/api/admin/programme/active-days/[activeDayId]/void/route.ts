import { adminAuthErrorResponse, requireAdminUser } from "@/lib/auth/admin";
import {
  programmeErrorResponse,
  programmeResponse,
  readProgrammeJson,
} from "@/lib/programme/http";
import { assertOnlyKeys, objectInput } from "@/lib/programme/validation";
import { programmeFlowService } from "@/lib/services/programme-flow.service";

type Context = { params: Promise<{ activeDayId: string }> };

export async function POST(request: Request, { params }: Context) {
  try {
    const actor = await requireAdminUser(request);
    const body = objectInput(await readProgrammeJson(request));
    assertOnlyKeys(body, ["reason"]);
    await programmeFlowService.voidActiveDay(
      { id: actor.id, role: actor.role },
      (await params).activeDayId,
      body.reason,
    );
    return programmeResponse({ ok: true });
  } catch (error) {
    return adminAuthErrorResponse(error) ?? programmeErrorResponse(error);
  }
}
