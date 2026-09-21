import { prisma } from "@/lib/db/prisma";
import { LearnApplyError } from "@/lib/learn-apply/errors";

export const LEARN_SERVICE_ACTOR_NAME = "B4GAMBLE Content Agent";

type ServiceActorRecord = {
  id: string;
  name: string;
  role: string;
  userId: string | null;
};

type ServiceActorRepository = {
  findById(id: string): Promise<ServiceActorRecord | null>;
};

const defaultRepository: ServiceActorRepository = {
  findById: (id) => prisma.adminUser.findUnique({
    where: { id },
    select: { id: true, name: true, role: true, userId: true },
  }),
};

export async function resolveLearnServiceActor(
  environment: { LEARN_MCP_ACTOR_ID?: string; NODE_ENV?: string } = process.env,
  repository: ServiceActorRepository = defaultRepository,
) {
  const actorId = environment.LEARN_MCP_ACTOR_ID?.trim();
  if (!actorId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(actorId)) {
    throw new LearnApplyError("Learn service actor is not configured.", "SERVICE_ACTOR_NOT_CONFIGURED", 503);
  }
  const actor = await repository.findById(actorId);
  if (
    !actor
    || actor.name !== LEARN_SERVICE_ACTOR_NAME
    || actor.role !== "AUTHOR"
    || actor.userId !== null
  ) {
    throw new LearnApplyError("Learn service actor configuration does not match the provisioned actor.", "SERVICE_ACTOR_INVALID", 503);
  }
  return actor;
}
