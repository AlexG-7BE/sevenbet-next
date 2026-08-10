import { requireCurrentUser } from "@/lib/auth/session";
import { missionOneService } from "@/lib/programme/application/mission-01.service";
import {
  programmeErrorResponse,
  programmeResponse,
  readProgrammeJson,
} from "@/lib/programme/http";
import { assertProgrammeRateLimit } from "@/lib/programme/rate-limit";
import { assertOnlyKeys, objectInput } from "@/lib/programme/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser(request.headers);
    assertProgrammeRateLimit(`mission-01:complete:${user.id}`, {
      limit: 10,
      windowMs: 60_000,
    });
    const body = objectInput(await readProgrammeJson(request));
    assertOnlyKeys(body, ["timeZone"]);
    const dashboard = await missionOneService.complete(user.id, body.timeZone);
    return programmeResponse({ ok: true, dashboard });
  } catch (error) {
    return programmeErrorResponse(error);
  }
}
