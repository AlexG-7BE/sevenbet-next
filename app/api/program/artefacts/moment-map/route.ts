import { requireCurrentUser } from "@/lib/auth/session";
import { programmeArtefactService } from "@/lib/programme/application/programme-artefact.service";
import {
  programmeErrorResponse,
  programmeResponse,
  readProgrammeJson,
} from "@/lib/programme/http";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  try {
    const user = await requireCurrentUser(request.headers);
    const momentMap = await programmeArtefactService.updateMomentMap(
      user.id,
      await readProgrammeJson(request),
    );
    return programmeResponse({ ok: true, momentMap });
  } catch (error) {
    return programmeErrorResponse(error);
  }
}
export async function DELETE(request: Request) {
  try {
    const user = await requireCurrentUser(request.headers);
    await programmeArtefactService.deleteMomentMap(user.id);
    return programmeResponse({ ok: true });
  } catch (error) {
    return programmeErrorResponse(error);
  }
}
