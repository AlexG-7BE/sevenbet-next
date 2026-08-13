import { requireCurrentUser } from "@/lib/auth/session";
import { programmeArtefactService } from "@/lib/programme/application/programme-artefact.service";
import {
  programmeErrorResponse,
  programmeResponse,
} from "@/lib/programme/http";
import { assertLegacyProgrammeMutationAllowed } from "@/lib/programme/legacy-runtime";
import { assertProgrammeRateLimit } from "@/lib/programme/rate-limit";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  try {
    assertLegacyProgrammeMutationAllowed();
    await requireCurrentUser(request.headers);
    return programmeResponse({ ok: false, error: "Moment Map narrative is stored only in this browser session", code: "LOCAL_ONLY_CONTENT" }, 410);
  } catch (error) {
    return programmeErrorResponse(error);
  }
}
export async function DELETE(request: Request) {
  try {
    const user = await requireCurrentUser(request.headers);
    await assertProgrammeRateLimit("PROGRAMME_MUTATION_USER", user.id);
    await programmeArtefactService.deleteMomentMap(user.id);
    return programmeResponse({ ok: true });
  } catch (error) {
    return programmeErrorResponse(error);
  }
}
