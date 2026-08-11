import { requireCurrentUser } from "@/lib/auth/session";
import { programmeAiGuidanceService } from "@/lib/programme/application/programme-ai-guidance.service";
import { programmeErrorResponse, programmeResponse, readProgrammeJson } from "@/lib/programme/http";
import { assertProgrammeRateLimit } from "@/lib/programme/rate-limit";
import { routeReviewMilestone } from "@/lib/programme/program-ai/mission-http";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ milestone: string }> },
) {
  try {
    const user = await requireCurrentUser(request.headers);
    const milestone = routeReviewMilestone((await context.params).milestone);
    const review = await programmeAiGuidanceService.review(user.id, milestone, {}, false);
    return programmeResponse({ ok: true, review });
  } catch (error) {
    return programmeErrorResponse(error);
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ milestone: string }> },
) {
  try {
    const user = await requireCurrentUser(request.headers);
    const milestone = routeReviewMilestone((await context.params).milestone);
    assertProgrammeRateLimit(`program-ai:review:${user.id}:${milestone}`, { limit: 4, windowMs: 60_000 });
    const review = await programmeAiGuidanceService.review(
      user.id,
      milestone,
      await readProgrammeJson(request),
      true,
    );
    return programmeResponse({ ok: true, review });
  } catch (error) {
    return programmeErrorResponse(error);
  }
}
