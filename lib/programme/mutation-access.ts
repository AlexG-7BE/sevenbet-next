export type ProgrammeMutationAccessCategory =
  | "anonymous"
  | "authenticated"
  | "claim-transition"
  | "other"
  | "unknown";

const anonymousRoutes = new Set([
  "/api/program/session",
  "/api/program/session/mission-01",
  "/api/program/session/mission-01/claim",
  "/api/program/program-ai/session",
  "/api/program/program-ai/authority",
  "/api/program/program-ai/turn",
  "/api/program/program-ai/transcription",
  "/api/program/program-ai/starting-point",
  "/api/program/program-ai/support/continue",
  "/api/program/program-ai/claim",
]);

const claimTransitionRoutes = new Set([
  "/api/program/claims/redeem",
  "/api/program/program-ai/claims/redeem",
]);

const authenticatedExactRoutes = new Set([
  "/api/program/dashboard",
  "/api/program/rewards",
  "/api/program/reflections",
  "/api/program/artefacts/moment-map",
  "/api/program/artefacts/current-goal",
  "/api/program/artefacts/urge-learning-record",
  "/api/program/artefacts/active-boundary",
  "/api/program/missions/01",
  "/api/program/missions/01/complete",
  "/api/program/missions/02",
  "/api/program/missions/02/complete",
  "/api/program/missions/03",
  "/api/program/missions/03/complete",
  "/api/program/missions/04",
  "/api/program/missions/04/complete",
  "/api/program/progress",
  "/api/program/progress/start",
  "/api/program/progress/current-step",
  "/api/program/progress/step",
  "/api/program/progress/lesson",
  "/api/program/progress/exercise",
  "/api/program/progress/quiz",
  "/api/program/progress/scenario",
  "/api/program/progress/merge",
  "/api/program/progress/complete",
  "/api/program/program-ai/home",
]);

function isAuthenticatedProgramAiRoute(pathname: string) {
  return /^\/api\/program\/program-ai\/missions\/[2-9]\/actions$/.test(pathname)
    || /^\/api\/program\/program-ai\/missions\/10\/actions$/.test(pathname)
    || /^\/api\/program\/program-ai\/missions\/[2-9]\/complete$/.test(pathname)
    || /^\/api\/program\/program-ai\/missions\/10\/complete$/.test(pathname)
    || /^\/api\/program\/program-ai\/missions\/[2-9]\/guidance$/.test(pathname)
    || /^\/api\/program\/program-ai\/missions\/10\/guidance$/.test(pathname)
    || /^\/api\/program\/program-ai\/missions\/[2-9]$/.test(pathname)
    || /^\/api\/program\/program-ai\/missions\/10$/.test(pathname)
    || /^\/api\/program\/program-ai\/reviews\/(first|mid|full)$/.test(pathname);
}

export function programmeMutationAccessCategory(
  pathname: string,
  method: string,
): ProgrammeMutationAccessCategory {
  if (!pathname.startsWith("/api/program/") || method === "GET" || method === "HEAD") {
    return "other";
  }
  if (pathname === "/api/program/session" && method === "DELETE") return "other";
  if (pathname === "/api/program/reflections" && method === "POST") return "other";
  if (claimTransitionRoutes.has(pathname)) return "claim-transition";
  if (anonymousRoutes.has(pathname)) return "anonymous";
  if (authenticatedExactRoutes.has(pathname) || isAuthenticatedProgramAiRoute(pathname)) {
    return "authenticated";
  }
  return "unknown";
}
