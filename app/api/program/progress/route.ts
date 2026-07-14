import { requireCurrentUser } from "@/lib/auth/session";
import { handleGetProgress } from "@/lib/progress/http";
import { userProgressService } from "@/lib/services/user-progress.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return handleGetProgress(request, {
    requireUser: requireCurrentUser,
    service: userProgressService,
  });
}
