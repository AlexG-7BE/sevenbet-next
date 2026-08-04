import { requireCurrentUser } from "@/lib/auth/session";
import { programmeDashboardService } from "@/lib/programme/application/programme-dashboard.service";
import { programmeErrorResponse, programmeResponse } from "@/lib/programme/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser(request.headers);
    const dashboard = await programmeDashboardService.getDashboard(user.id);
    return programmeResponse({ ok: true, dashboard });
  } catch (error) {
    return programmeErrorResponse(error);
  }
}
