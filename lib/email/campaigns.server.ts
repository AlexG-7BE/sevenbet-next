import "server-only";

import { createHash, randomUUID } from "node:crypto";
import type { EmailProgrammeSegment, Prisma } from "@prisma/client";

import prisma from "@/lib/db/prisma";
import { analyticsEnvironment } from "@/lib/analytics/identity.server";
import { renderEmailTemplate } from "@/lib/email/templates.server";

export type CampaignFilters = {
  locale: string | null;
  countryCode: string | null;
  programmeSegment: EmailProgrammeSegment;
  inactiveDays: 7 | 30 | null;
  newUsersOnly: boolean;
};

export async function listEmailCampaigns() {
  return prisma.emailCampaign.findMany({
    where: { environment: analyticsEnvironment() },
    include: { template: { select: { key: true, version: true, subject: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

function campaignFilters(value: unknown): CampaignFilters & { name: string; templateId: string; idempotencyKey: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Campaign payload is required");
  const body = value as Record<string, unknown>;
  if (Object.keys(body).some((key) => !["name", "templateId", "idempotencyKey", "locale", "countryCode", "programmeSegment", "inactiveDays", "newUsersOnly"].includes(key))) {
    throw new Error("Campaign contains unsupported filters");
  }
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const templateId = typeof body.templateId === "string" ? body.templateId : "";
  const idempotencyKey = typeof body.idempotencyKey === "string" ? body.idempotencyKey : randomUUID();
  const locale = typeof body.locale === "string" && body.locale ? body.locale : null;
  const countryCode = typeof body.countryCode === "string" && body.countryCode
    ? body.countryCode.trim().toUpperCase() : null;
  const programmeSegment = String(body.programmeSegment ?? "ANY") as EmailProgrammeSegment;
  const inactiveDays = body.inactiveDays === 7 || body.inactiveDays === 30 ? body.inactiveDays : null;
  const newUsersOnly = body.newUsersOnly === true;
  if (!name || name.length > 160 || !/^[0-9a-f-]{36}$/i.test(templateId)
    || !/^[A-Za-z0-9:_-]{16,200}$/.test(idempotencyKey)
    || (locale && !/^[a-z]{2}(?:-[A-Z]{2})?$/.test(locale))
    || (countryCode && !/^[A-Z]{2}$/.test(countryCode))
    || !["ANY", "STARTED", "COMPLETED", "NOT_COMPLETED"].includes(programmeSegment)
    || (body.inactiveDays !== undefined && body.inactiveDays !== null && !inactiveDays)) {
    throw new Error("Campaign fields are invalid");
  }
  return { name, templateId, idempotencyKey, locale, countryCode, programmeSegment, inactiveDays, newUsersOnly };
}

function campaignSegmentWhere(filters: CampaignFilters, now = new Date()): Prisma.UserWhereInput {
  const where: Prisma.UserWhereInput = {};
  if (filters.locale) where.preferredLocale = filters.locale;
  if (filters.countryCode) where.signupCountryCode = filters.countryCode;
  if (filters.newUsersOnly) where.createdAt = { gte: new Date(now.getTime() - 7 * 86_400_000) };
  if (filters.inactiveDays) {
    const before = new Date(now.getTime() - filters.inactiveDays * 86_400_000);
    where.AND = [{ OR: [{ lastSeenAt: { lte: before } }, { lastSeenAt: null, createdAt: { lte: before } }] }];
  }
  if (filters.programmeSegment === "STARTED") where.programEnrollments = { some: {} };
  if (filters.programmeSegment === "COMPLETED") where.programEnrollments = { some: { completedAt: { not: null } } };
  if (filters.programmeSegment === "NOT_COMPLETED") where.programEnrollments = { some: { completedAt: null } };
  return where;
}

export function campaignAudienceWhere(filters: CampaignFilters, now = new Date()): Prisma.UserWhereInput {
  return {
    ...campaignSegmentWhere(filters, now),
    accountState: "ACTIVE",
    emailVerified: true,
    emailPreference: {
      is: { marketingAllowed: true, unsubscribedAt: null, suppressionScope: "NONE" },
    },
  };
}

function filtersFromCampaign(
  campaign: Omit<CampaignFilters, "inactiveDays"> & { inactiveDays: number | null },
): CampaignFilters {
  const inactiveDays = campaign.inactiveDays === 7 || campaign.inactiveDays === 30
    ? campaign.inactiveDays
    : null;
  if (campaign.inactiveDays !== null && inactiveDays === null) {
    throw new Error("Campaign inactivity filter is invalid");
  }
  return {
    locale: campaign.locale,
    countryCode: campaign.countryCode,
    programmeSegment: campaign.programmeSegment,
    inactiveDays,
    newUsersOnly: campaign.newUsersOnly,
  };
}

export function campaignRecipientIdempotencyKey(campaignId: string, userId: string) {
  if (!campaignId || !userId) throw new Error("Campaign recipient idempotency input is invalid");
  const digest = createHash("sha256")
    .update(`b4gamble:campaign-recipient:v1\n${campaignId}\n${userId}`, "utf8")
    .digest("hex");
  return `campaign:${campaignId}:recipient:${digest}`;
}

export async function estimateCampaignAudience(filters: CampaignFilters, now = new Date()) {
  const segment = campaignSegmentWhere(filters, now);
  const [eligible, total, suppressed] = await Promise.all([
    prisma.user.count({ where: campaignAudienceWhere(filters, now) }),
    prisma.user.count({ where: segment }),
    prisma.user.count({
      where: {
        AND: [
          segment,
          {
            emailPreference: {
              is: {
                OR: [
                  { unsubscribedAt: { not: null } },
                  { suppressionScope: { not: "NONE" } },
                ],
              },
            },
          },
        ],
      },
    }),
  ]);
  return { eligible, excluded: Math.max(0, total - eligible), suppressed, total };
}

export async function createEmailCampaign(value: unknown, adminId: string) {
  const input = campaignFilters(value);
  const environment = analyticsEnvironment();
  const template = await prisma.emailTemplate.findUnique({ where: { id: input.templateId } });
  if (!template || !template.active || template.type !== "MARKETING") throw new Error("Campaign requires an active marketing template");
  try {
    return await prisma.$transaction(async (transaction) => {
      const campaign = await transaction.emailCampaign.create({
        data: {
          ...input,
          environment,
          createdByAdminId: adminId,
        },
        include: { template: true },
      });
      await transaction.auditLog.create({
        data: {
          actorId: adminId,
          action: "email-campaign-created",
          entityType: "email-campaign",
          entityId: campaign.id,
          summary: "Created a fixed-segment email campaign draft",
          metadata: {
            templateId: campaign.templateId,
            locale: campaign.locale,
            countryCode: campaign.countryCode,
            programmeSegment: campaign.programmeSegment,
            inactiveDays: campaign.inactiveDays,
            newUsersOnly: campaign.newUsersOnly,
          },
        },
      });
      return campaign;
    });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return prisma.emailCampaign.findUnique({
        where: { environment_idempotencyKey: { environment, idempotencyKey: input.idempotencyKey } },
        include: { template: true },
      });
    }
    throw error;
  }
}

export async function reviewEmailCampaign(campaignId: string, adminId: string) {
  const campaign = await prisma.emailCampaign.findUnique({ where: { id: campaignId } });
  if (!campaign) throw new Error("Campaign not found");
  if (campaign.environment !== analyticsEnvironment()) throw new Error("Campaign not found");
  if (campaign.status === "REVIEWED") {
    return prisma.emailCampaign.findUnique({ where: { id: campaignId }, include: { template: true } });
  }
  if (campaign.status !== "DRAFT") throw new Error("Only a draft campaign can be reviewed");
  const estimate = await estimateCampaignAudience(filtersFromCampaign(campaign));
  return prisma.$transaction(async (transaction) => {
    const reviewedAt = new Date();
    const transition = await transaction.emailCampaign.updateMany({
      where: { id: campaignId, status: "DRAFT" },
      data: {
        status: "REVIEWED",
        reviewedByAdminId: adminId,
        reviewedAt,
        estimatedEligibleCount: estimate.eligible,
        estimatedExcludedCount: estimate.excluded,
        estimatedSuppressedCount: estimate.suppressed,
      },
    });
    const latest = await transaction.emailCampaign.findUnique({ where: { id: campaignId }, include: { template: true } });
    if (!latest) throw new Error("Campaign not found");
    if (transition.count === 0) {
      if (latest.status === "REVIEWED") return latest;
      throw new Error("Only a draft campaign can be reviewed");
    }
    await transaction.auditLog.create({
      data: {
        actorId: adminId,
        action: "email-campaign-reviewed",
        entityType: "email-campaign",
        entityId: campaignId,
        summary: "Reviewed the campaign audience before queueing",
        metadata: { eligible: estimate.eligible, excluded: estimate.excluded, suppressed: estimate.suppressed },
      },
    });
    return latest;
  });
}

export async function queueEmailCampaign(campaignId: string, adminId: string) {
  const campaign = await prisma.emailCampaign.findUnique({
    where: { id: campaignId },
    include: { template: true },
  });
  if (!campaign) throw new Error("Campaign not found");
  const environment = analyticsEnvironment();
  if (campaign.environment !== environment) throw new Error("Campaign not found");
  if (["QUEUED", "SENDING", "COMPLETED", "PARTIALLY_FAILED"].includes(campaign.status)) return campaign;
  if (campaign.status !== "REVIEWED" || !campaign.reviewedAt || !campaign.reviewedByAdminId) {
    throw new Error("Campaign must be reviewed before queueing");
  }
  if (!campaign.template.active || campaign.template.type !== "MARKETING") {
    throw new Error("Campaign template is no longer an active marketing template");
  }
  const audienceWhere = campaignAudienceWhere(filtersFromCampaign(campaign));
  const batchSize = 500;
  let cursor: string | undefined;
  while (true) {
    const users = await prisma.user.findMany({
      where: audienceWhere,
      select: { id: true, name: true, email: true },
      orderBy: { id: "asc" },
      take: batchSize,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    if (!users.length) break;
    const messageRows: Prisma.EmailMessageCreateManyInput[] = [];
    for (const user of users) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email) || user.email.length > 320) continue;
      const common = {
        userId: user.id,
        campaignId: campaign.id,
        templateId: campaign.template.id,
        purpose: "MARKETING_BROADCAST" as const,
        environment,
        locale: campaign.template.locale,
        recipientEmail: user.email.trim().toLowerCase(),
        templateVersion: campaign.template.version,
        idempotencyKey: campaignRecipientIdempotencyKey(campaign.id, user.id),
      };
      try {
        messageRows.push({
          ...common,
          status: "QUEUED",
          subject: renderEmailTemplate(campaign.template, {
            name: user.name,
            action_url: "",
            programme_url: "",
            unsubscribe_url: "",
          }).subject,
        });
      } catch {
        messageRows.push({
          ...common,
          status: "CANCELLED",
          subject: `[UNRENDERABLE] ${campaign.template.key}`,
          deliveryErrorCode: "TEMPLATE_RENDER_INVALID",
        });
      }
    }
    if (messageRows.length) {
      await prisma.emailMessage.createMany({
        data: messageRows,
        skipDuplicates: true,
      });
    }
    cursor = users.at(-1)!.id;
    if (users.length < batchSize) break;
  }
  const [queued, failed] = await Promise.all([
    prisma.emailMessage.count({ where: { campaignId: campaign.id, environment, status: "QUEUED" } }),
    prisma.emailMessage.count({ where: { campaignId: campaign.id, environment, status: "CANCELLED" } }),
  ]);
  return prisma.$transaction(async (transaction) => {
    const queuedAt = new Date();
    const transition = await transaction.emailCampaign.updateMany({
      where: { id: campaign.id, status: "REVIEWED" },
      data: queued > 0
        ? { status: "QUEUED", queuedAt, queuedCount: queued, failedCount: failed }
        : {
            status: failed > 0 ? "PARTIALLY_FAILED" : "COMPLETED",
            queuedAt,
            completedAt: queuedAt,
            queuedCount: 0,
            failedCount: failed,
          },
    });
    const latest = await transaction.emailCampaign.findUnique({ where: { id: campaign.id }, include: { template: true } });
    if (!latest) throw new Error("Campaign not found");
    if (transition.count > 0) {
      await transaction.auditLog.create({
        data: {
          actorId: adminId,
          action: "email-campaign-queued",
          entityType: "email-campaign",
          entityId: campaign.id,
          summary: queued > 0
            ? "Queued the reviewed campaign"
            : failed > 0
              ? "Closed a reviewed campaign whose candidate messages were invalid"
              : "Completed a reviewed campaign with no eligible recipients",
          metadata: { queued, failed },
        },
      });
    }
    return latest;
  });
}

export async function refreshCampaignStates() {
  const environment = analyticsEnvironment();
  const campaigns = await prisma.emailCampaign.findMany({
    where: { environment, status: { in: ["QUEUED", "SENDING"] } },
    select: { id: true },
  });
  for (const campaign of campaigns) {
    const [total, pending, sent, failed] = await Promise.all([
      prisma.emailMessage.count({ where: { campaignId: campaign.id, environment } }),
      prisma.emailMessage.count({
        where: {
          campaignId: campaign.id,
          environment,
          OR: [
            { status: { in: ["QUEUED", "SENDING"] } },
            { status: "FAILED", attemptCount: { lt: 5 }, nextAttemptAt: { not: null } },
          ],
        },
      }),
      prisma.emailMessage.count({ where: { campaignId: campaign.id, environment, sentAt: { not: null } } }),
      prisma.emailMessage.count({
        where: {
          campaignId: campaign.id,
          environment,
          OR: [
            { status: { in: ["BOUNCED", "UNKNOWN", "SUPPRESSED", "CANCELLED"] } },
            { status: "FAILED", OR: [{ attemptCount: { gte: 5 } }, { nextAttemptAt: null }] },
          ],
        },
      }),
    ]);
    await prisma.emailCampaign.update({
      where: { id: campaign.id },
      data: pending > 0
        ? { status: "SENDING", sentCount: sent, failedCount: failed }
        : { status: failed > 0 ? "PARTIALLY_FAILED" : "COMPLETED", sentCount: sent, failedCount: failed, completedAt: new Date(), queuedCount: total },
    });
  }
  return campaigns.length;
}
