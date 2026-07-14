import { requireCurrentUser } from "@/lib/auth/session";
import { handleStepProgress } from "@/lib/progress/http";
import { userProgressService } from "@/lib/services/user-progress.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return handleStepProgress(request, {
    requireUser: requireCurrentUser,
    service: userProgressService,
  });
}
