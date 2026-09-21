import { LEARN_SERVICE_ACTOR_NAME } from "../lib/learn-apply/service-actor";
import { prisma } from "../lib/db/prisma";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

async function provision() {
  const email = required("LEARN_MCP_ACTOR_EMAIL").toLowerCase();
  const requestedId = process.env.LEARN_MCP_ACTOR_ID?.trim() || null;
  if (!emailPattern.test(email)) throw new Error("LEARN_MCP_ACTOR_EMAIL must be a valid service email");
  if (requestedId && !uuidPattern.test(requestedId)) throw new Error("LEARN_MCP_ACTOR_ID must be a valid UUID when supplied");

  const matches = await prisma.adminUser.findMany({
    where: { email: { equals: email, mode: "insensitive" } },
    take: 2,
    select: { id: true, email: true, name: true, role: true, userId: true },
  });
  if (matches.length > 1) throw new Error("Multiple AdminUser records match the normalized service email");
  const existing = matches[0] ?? null;
  if (existing && requestedId && existing.id !== requestedId) throw new Error("Existing service actor does not match LEARN_MCP_ACTOR_ID");
  if (existing && (existing.name !== LEARN_SERVICE_ACTOR_NAME || existing.role !== "AUTHOR" || existing.userId !== null)) {
    throw new Error("Existing AdminUser does not match the dedicated Learn service actor contract");
  }
  const actor = existing ?? await prisma.adminUser.create({
    data: {
      ...(requestedId ? { id: requestedId } : {}),
      email,
      name: LEARN_SERVICE_ACTOR_NAME,
      role: "AUTHOR",
      userId: null,
    },
    select: { id: true, email: true, name: true, role: true, userId: true },
  });
  process.stdout.write(`${JSON.stringify({
    event: "learn_service_actor_provisioned",
    created: !existing,
    actorId: actor.id,
    name: actor.name,
    role: actor.role,
    linkedUser: actor.userId !== null,
  })}\n`);
}

provision()
  .catch((error: unknown) => {
    process.stderr.write(`${JSON.stringify({
      event: "learn_service_actor_provision_failed",
      error: error instanceof Error ? error.message : "Unknown actor provisioning failure",
    })}\n`);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
