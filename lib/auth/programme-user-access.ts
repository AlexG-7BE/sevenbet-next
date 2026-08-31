import "server-only";

import { requireCurrentUser } from "@/lib/auth/session";
import { programmeAccessService } from "@/lib/programme/application/programme-access.service";

export async function requireProgrammeAcceptedUser(requestHeaders?: Headers) {
  const user = await requireCurrentUser(requestHeaders);
  await programmeAccessService.requireUserAcceptance(user.id);
  return user;
}
