import { requireProgrammeAcceptedUser } from "@/lib/auth/programme-user-access";
import { handleMergeProgress } from "@/lib/progress/http";
import { userProgressService } from "@/lib/services/user-progress.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return handleMergeProgress(request, {
    requireUser: requireProgrammeAcceptedUser,
    service: userProgressService,
  });
}
