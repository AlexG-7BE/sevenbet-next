import { requireCurrentUser } from "@/lib/auth/session";
import { programmeArtefactService } from "@/lib/programme/application/programme-artefact.service";
import {
  programmeErrorResponse,
  programmeResponse,
  readProgrammeJson,
} from "@/lib/programme/http";
import { assertLegacyProgrammeMutationAllowed } from "@/lib/programme/legacy-runtime";
import { assertProgrammeRateLimit } from "@/lib/programme/rate-limit";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  try {
    assertLegacyProgrammeMutationAllowed();
    const user = await requireCurrentUser(request.headers);
    await assertProgrammeRateLimit("PROGRAMME_MUTATION_USER", user.id);
    const urgeLearningRecord = await programmeArtefactService.updateUrgeLearningRecord(
      user.id,
      await readProgrammeJson(request),
    );
    return programmeResponse({ ok: true, urgeLearningRecord });
  } catch (error) {
    return programmeErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireCurrentUser(request.headers);
    await assertProgrammeRateLimit("PROGRAMME_MUTATION_USER", user.id);
    await programmeArtefactService.deleteUrgeLearningRecord(user.id);
    return programmeResponse({ ok: true });
  } catch (error) {
    return programmeErrorResponse(error);
  }
}
