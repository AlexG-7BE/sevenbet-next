import "server-only";

import prisma from "@/lib/db/prisma";
import { queueEmailMessage } from "@/lib/email/service.server";
import { sanitizeEmailTemplate } from "@/lib/email/templates.server";

export async function listEmailTemplates() {
  return prisma.emailTemplate.findMany({
    orderBy: [{ key: "asc" }, { locale: "asc" }, { version: "desc" }],
  });
}

export async function queueEmailTemplateTest(templateId: string, actorUserId: string, actorId: string) {
  const template = await prisma.emailTemplate.findUnique({ where: { id: templateId } });
  if (!template) return null;
  const message = await queueEmailMessage({
    userId: actorUserId,
    templateKey: template.key,
    templateId: template.id,
    idempotencyKey: `test:${actorId}:${template.id}:${crypto.randomUUID()}`,
    isTest: true,
  });
  if (message) {
    await prisma.auditLog.create({
      data: {
        actorId,
        action: "email-template-test-queued",
        entityType: "email-message",
        entityId: message.id,
        summary: `Queued an internal test for ${template.key} ${template.locale} v${template.version}`,
        metadata: { templateId: template.id, templateVersion: template.version, isTest: true },
      },
    });
  }
  return message;
}

export async function createEmailTemplateVersion(value: unknown, actorId: string, activate = false) {
  const input = sanitizeEmailTemplate(value);
  return prisma.$transaction(async (transaction) => {
    const latest = await transaction.emailTemplate.findFirst({
      where: { key: input.key, locale: input.locale },
      orderBy: { version: "desc" },
      select: { version: true },
    });
    if (activate) {
      await transaction.emailTemplate.updateMany({
        where: { key: input.key, locale: input.locale, active: true },
        data: { active: false, updatedBy: actorId },
      });
    }
    const template = await transaction.emailTemplate.create({
      data: {
        ...input,
        version: (latest?.version ?? 0) + 1,
        active: activate,
        createdBy: actorId,
        updatedBy: actorId,
      },
    });
    await transaction.auditLog.create({
      data: {
        actorId,
        action: "email-template-version-created",
        entityType: "email-template",
        entityId: template.id,
        summary: `Created ${template.key} ${template.locale} v${template.version}${template.active ? " and activated it" : ""}`,
        metadata: { key: template.key, locale: template.locale, version: template.version, active: template.active },
      },
    });
    return template;
  });
}

export async function setEmailTemplateActive(templateId: string, active: boolean, actorId: string) {
  return prisma.$transaction(async (transaction) => {
    const template = await transaction.emailTemplate.findUnique({ where: { id: templateId } });
    if (!template) throw new Error("Template not found");
    if (active) {
      await transaction.emailTemplate.updateMany({
        where: { key: template.key, locale: template.locale, active: true, id: { not: template.id } },
        data: { active: false, updatedBy: actorId },
      });
    }
    const updated = await transaction.emailTemplate.update({
      where: { id: templateId },
      data: { active, updatedBy: actorId },
    });
    await transaction.auditLog.create({
      data: {
        actorId,
        action: active ? "email-template-activated" : "email-template-deactivated",
        entityType: "email-template",
        entityId: updated.id,
        summary: `${active ? "Activated" : "Deactivated"} ${updated.key} ${updated.locale} v${updated.version}`,
        metadata: { key: updated.key, locale: updated.locale, version: updated.version, active },
      },
    });
    return updated;
  });
}
