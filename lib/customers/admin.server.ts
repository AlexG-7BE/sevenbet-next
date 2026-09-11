import "server-only";

import type { Prisma } from "@prisma/client";

import prisma from "@/lib/db/prisma";
import { analyticsEnvironment } from "@/lib/analytics/identity.server";

export type CustomerListFilters = {
  query?: string;
  accountState?: "ACTIVE" | "SUSPENDED";
  marketing?: "allowed" | "not-allowed" | "suppressed";
  programme?: "started" | "completed" | "not-completed" | "not-started";
};

export function customerWhere(filters: CustomerListFilters): Prisma.UserWhereInput {
  const clauses: Prisma.UserWhereInput[] = [];
  const query = filters.query?.trim().slice(0, 320);
  if (query) {
    clauses.push({ OR: [
      { id: { equals: query } },
      { email: { contains: query, mode: "insensitive" } },
    ] });
  }
  if (filters.accountState) clauses.push({ accountState: filters.accountState });
  if (filters.marketing === "allowed") {
    clauses.push({ emailPreference: { is: { marketingAllowed: true, unsubscribedAt: null, suppressionScope: "NONE" } } });
  } else if (filters.marketing === "suppressed") {
    clauses.push({ emailPreference: { is: { suppressionScope: { not: "NONE" } } } });
  } else if (filters.marketing === "not-allowed") {
    clauses.push({ OR: [
      { emailPreference: { is: null } },
      { emailPreference: { is: { marketingAllowed: false } } },
      { emailPreference: { is: { unsubscribedAt: { not: null } } } },
    ] });
  }
  if (filters.programme === "started") clauses.push({ programEnrollments: { some: {} } });
  if (filters.programme === "completed") clauses.push({ programEnrollments: { some: { completedAt: { not: null } } } });
  if (filters.programme === "not-completed") clauses.push({ programEnrollments: { some: { completedAt: null } } });
  if (filters.programme === "not-started") clauses.push({ programEnrollments: { none: {} } });
  return clauses.length ? { AND: clauses } : {};
}

export async function listCustomers(filters: CustomerListFilters = {}) {
  const where = customerWhere(filters);
  const [total, customers] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        accountState: true,
        preferredLocale: true,
        signupCountryCode: true,
        signupSource: true,
        lastSeenAt: true,
        createdAt: true,
        emailPreference: {
          select: { marketingAllowed: true, unsubscribedAt: true, suppressionScope: true },
        },
        programEnrollments: {
          select: { startedAt: true, completedAt: true },
          orderBy: { startedAt: "desc" },
          take: 1,
        },
      },
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      take: 100,
    }),
  ]);
  return { total, customers, truncated: total > customers.length };
}

export async function customerDetail(userId: string) {
  const environment = analyticsEnvironment();
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      accountState: true,
      preferredLocale: true,
      signupCountryCode: true,
      signupSource: true,
      signupReferrerHost: true,
      signupUtmSource: true,
      signupUtmMedium: true,
      signupUtmCampaign: true,
      signupUtmContent: true,
      signupUtmTerm: true,
      lastSeenAt: true,
      createdAt: true,
      updatedAt: true,
      emailPreference: true,
      consentEvents: {
        select: { id: true, purpose: true, action: true, source: true, policyVersion: true, locale: true, occurredAt: true },
        orderBy: { occurredAt: "desc" },
        take: 20,
      },
      programEnrollments: {
        select: {
          id: true,
          startedAt: true,
          completedAt: true,
          currentStepId: true,
          program: { select: { title: true, slug: true } },
          missionProgress: {
            select: { missionNumber: true, status: true, completedAt: true, updatedAt: true },
            orderBy: { missionNumber: "asc" },
          },
          progressEvents: {
            where: { entityType: { in: ["STEP", "PROGRAM"] } },
            select: { entityType: true, eventType: true, entityId: true, createdAt: true },
            orderBy: { createdAt: "desc" },
            take: 20,
          },
        },
        orderBy: { startedAt: "desc" },
      },
      analyticsEvents: {
        where: { environment, trafficKind: "HUMAN" },
        select: { id: true, type: true, occurredAt: true, pagePath: true, locale: true, countryCode: true, programmeStep: true, casino: { select: { title: true } } },
        orderBy: { occurredAt: "desc" },
        take: 30,
      },
      emailMessages: {
        where: { environment },
        select: {
          id: true,
          purpose: true,
          status: true,
          locale: true,
          subject: true,
          isTest: true,
          queuedAt: true,
          sentAt: true,
          deliveredAt: true,
          bouncedAt: true,
          clickedAt: true,
          unsubscribedAt: true,
          deliveryErrorCode: true,
          template: { select: { key: true, version: true } },
          campaign: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 30,
      },
      outboundClicks: {
        where: { environment, trafficKind: "HUMAN" },
        select: {
          id: true,
          state: true,
          blockedReason: true,
          attemptedAt: true,
          sourcePage: true,
          locale: true,
          countryCode: true,
          placement: true,
          casino: { select: { title: true } },
          affiliateOffer: { select: { publicLabel: true } },
          affiliateNetwork: { select: { name: true } },
        },
        orderBy: { attemptedAt: "desc" },
        take: 30,
      },
    },
  });
}
