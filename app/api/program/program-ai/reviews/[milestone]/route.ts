import { requireCurrentUser } from "@/lib/auth/session";
import { productAnalyticsServer } from "@/lib/analytics/vercel-product-analytics";
import { programmeAiGuidanceService } from "@/lib/programme/application/programme-ai-guidance.service";
import { programmeErrorResponse, programmeResponse, readProgrammeJson } from "@/lib/programme/http";
import { programmeProviderRateLimitAllowance } from "@/lib/programme/rate-limit";
import { routeReviewMilestone } from "@/lib/programme/program-ai/mission-http";
import { reviewGuidanceOperation } from "@/lib/programme/program-ai/mission-guidance";
import { isProgramAiRealProviderEnabled } from "@/lib/programme/program-ai/runtime-config";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ milestone: string }> },
) {
  try {
    const user = await requireCurrentUser(request.headers);
    const milestone = routeReviewMilestone((await context.params).milestone);
    const review = await programmeAiGuidanceService.review(
      user.id,
      milestone,
      { locale: new URL(request.url).searchParams.get("locale") },
      false,
    );
    return programmeResponse({
      ok: true,
      review: {
        kind: review.kind,
        operation: review.operation,
        title: review.title,
        sections: review.sections,
        generation: review.generation,
      },
    });
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
    const providerConfigured = isProgramAiRealProviderEnabled();
    const providerAllowed = !providerConfigured
      || await programmeProviderRateLimitAllowance("PROGRAMME_REVIEW_USER", user.id);
    const review = await programmeAiGuidanceService.review(
      user.id,
      milestone,
      await readProgrammeJson(request),
      providerAllowed,
    );
    productAnalyticsServer.aiOutcome({
      operation: reviewGuidanceOperation[milestone],
      result: providerConfigured && !providerAllowed
        ? "rate_limited"
        : review.providerOutcome,
    });
    return programmeResponse({
      ok: true,
      review: {
        kind: review.kind,
        operation: review.operation,
        title: review.title,
        sections: review.sections,
        generation: review.generation,
      },
    });
  } catch (error) {
    return programmeErrorResponse(error);
  }
}
