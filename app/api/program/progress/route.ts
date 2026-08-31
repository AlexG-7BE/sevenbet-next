import { requireProgrammeAcceptedUser } from "@/lib/auth/programme-user-access";
import { handleGetProgress } from "@/lib/progress/http";
import { userProgressService } from "@/lib/services/user-progress.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return handleGetProgress(request, {
    requireUser: requireProgrammeAcceptedUser,
    service: userProgressService,
  });
}
