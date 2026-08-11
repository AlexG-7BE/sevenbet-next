import { programmeAiMissionOneService } from "@/lib/programme/application/programme-ai-mission-one.service";
import { productAnalyticsServer } from "@/lib/analytics/vercel-product-analytics";
import {
  anonymousProgrammeCookie,
  programmeErrorResponse,
  programmeResponse,
  readProgrammeJson,
  requestAddress,
  requestCookie,
} from "@/lib/programme/http";
import {
  assertAnonymousProgrammeMutationRateLimit,
  programmeProviderRateLimitAllowance,
} from "@/lib/programme/rate-limit";
import { hashOpaqueToken } from "@/lib/programme/security";
import { isProgramAiRealProviderEnabled } from "@/lib/programme/program-ai/runtime-config";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const startedAt = performance.now();
  try {
    const token = requestCookie(request, anonymousProgrammeCookie);
    await assertAnonymousProgrammeMutationRateLimit(token);
    const providerConfigured = isProgramAiRealProviderEnabled();
    const providerAllowed = !providerConfigured || (
      await programmeProviderRateLimitAllowance("PROGRAMME_M1_AI_SESSION", hashOpaqueToken(token))
      && await programmeProviderRateLimitAllowance("PROGRAMME_M1_AI_IP", requestAddress(request))
    );
    const turn = await programmeAiMissionOneService.createTurn(
      token,
      await readProgrammeJson(request),
      new Date(),
      providerAllowed,
    );
    if (turn.situationFirstAccepted) {
      productAnalyticsServer.m1SituationSubmitted(turn.inputMode);
    }
    productAnalyticsServer.aiOutcome({
      operation: "programme_ai",
      result: providerConfigured && !providerAllowed
        ? "rate_limited"
        : turn.providerOutcome,
    });
    return programmeResponse({
      ok: true,
      result: turn.result,
      progress: turn.progress,
      inputMode: turn.inputMode,
      situationFirstAccepted: turn.situationFirstAccepted,
      timing: { programmeAiTurnMs: Math.round(performance.now() - startedAt) },
    });
  } catch (error) {
    return programmeErrorResponse(error);
  }
}
