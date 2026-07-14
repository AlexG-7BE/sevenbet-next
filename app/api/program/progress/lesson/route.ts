import { requireCurrentUser } from "@/lib/auth/session";
import { handleLessonProgress } from "@/lib/progress/http";
import { userProgressService } from "@/lib/services/user-progress.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return handleLessonProgress(request, {
    requireUser: requireCurrentUser,
    service: userProgressService,
  });
}
