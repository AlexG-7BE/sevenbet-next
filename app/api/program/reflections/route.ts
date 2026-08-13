import { requireCurrentUser } from "@/lib/auth/session";
import {
  programmeErrorResponse,
  programmeResponse,
  readProgrammeJson,
} from "@/lib/programme/http";
import { assertLegacyProgrammeMutationAllowed } from "@/lib/programme/legacy-runtime";
import { assertProgrammeRateLimit } from "@/lib/programme/rate-limit";
import { assertOnlyKeys, objectInput } from "@/lib/programme/validation";
import { ValidationError } from "@/lib/services/service-error";
import { programReflectionService } from "@/lib/services/program-reflection.service";

export const dynamic = "force-dynamic";

function requiredString(value: unknown, field: string) {
  if (typeof value !== "string" || !value.trim()) throw new ValidationError(`${field} is required`);
  return value.trim();
}

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser(request.headers);
    const programId = requiredString(new URL(request.url).searchParams.get("programId"), "programId");
    const reflections = await programReflectionService.list(user.id, programId);
    return programmeResponse({ ok: true, reflections: reflections.map(({ id, blockId, content, createdAt, updatedAt }) => ({ id, blockId, content, createdAt: createdAt.toISOString(), updatedAt: updatedAt.toISOString() })) });
  } catch (error) { return programmeErrorResponse(error); }
}

export async function POST(request: Request) {
  try {
    assertLegacyProgrammeMutationAllowed();
    await requireCurrentUser(request.headers);
    return programmeResponse({ ok: false, error: "Programme reflections are stored only in this browser session", code: "LOCAL_ONLY_CONTENT" }, 410);
  } catch (error) { return programmeErrorResponse(error); }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireCurrentUser(request.headers);
    await assertProgrammeRateLimit("PROGRAMME_MUTATION_USER", user.id);
    const value = objectInput(await readProgrammeJson(request));
    assertOnlyKeys(value, ["programId", "blockId"]);
    await programReflectionService.delete(user.id, { programId: requiredString(value.programId, "programId"), blockId: requiredString(value.blockId, "blockId") });
    return programmeResponse({ ok: true });
  } catch (error) { return programmeErrorResponse(error); }
}
