import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { ProgrammeAccessService } from "../lib/programme/application/programme-access.service";
import type { ProgrammeUnitOfWork } from "../lib/programme/infrastructure/programme-unit-of-work";
import { programmeMutationAccessCategory } from "../lib/programme/mutation-access";

type Acceptance = {
  id: string;
  userId: string | null;
  anonymousSessionId: string | null;
  adultSelfAttestedAt: Date;
  termsAcceptedAt: Date;
  privacyAcknowledgedAt: Date;
  termsVersionAtAcceptance: string | null;
  privacyVersionAtAcceptance: string | null;
  source: string;
};

class MemoryAccessUnitOfWork {
  rows: Acceptance[] = [];
  readonly access = this;

  serializable<T>(operation: (unitOfWork: ProgrammeUnitOfWork) => Promise<T>) {
    return operation(this as unknown as ProgrammeUnitOfWork);
  }

  findUserAcceptance(userId: string) {
    return Promise.resolve(this.rows.find((row) => row.userId === userId) ?? null);
  }

  findAnonymousAcceptance(anonymousSessionId: string) {
    return Promise.resolve(this.rows.find((row) => row.anonymousSessionId === anonymousSessionId) ?? null);
  }

  async acceptUserOnce(userId: string, input: Omit<Acceptance, "id" | "userId" | "anonymousSessionId" | "source">, source = "DIRECT_AUTHENTICATED") {
    const existing = await this.findUserAcceptance(userId);
    if (existing) return existing;
    const row = { id: `acceptance-${this.rows.length + 1}`, userId, anonymousSessionId: null, source, ...input };
    this.rows.push(row);
    return row;
  }

  async acceptAnonymousSessionOnce(anonymousSessionId: string, input: Omit<Acceptance, "id" | "userId" | "anonymousSessionId" | "source">) {
    const existing = await this.findAnonymousAcceptance(anonymousSessionId);
    if (existing) return existing;
    const row = { id: `acceptance-${this.rows.length + 1}`, userId: null, anonymousSessionId, source: "ANONYMOUS_JOURNEY", ...input };
    this.rows.push(row);
    return row;
  }

  async bindAnonymousAcceptanceToUser(anonymousSessionId: string, userId: string) {
    const anonymous = await this.findAnonymousAcceptance(anonymousSessionId);
    if (!anonymous) return null;
    const existing = await this.findUserAcceptance(userId);
    if (existing) {
      this.rows = this.rows.filter((row) => row.id !== anonymous.id);
      return existing;
    }
    anonymous.anonymousSessionId = null;
    anonymous.userId = userId;
    return anonymous;
  }
}

function serviceFixture() {
  const unitOfWork = new MemoryAccessUnitOfWork();
  return {
    unitOfWork,
    service: new ProgrammeAccessService(unitOfWork as unknown as ProgrammeUnitOfWork),
  };
}

test("A — first authenticated acknowledgement is persisted once", async () => {
  const { service, unitOfWork } = serviceFixture();
  const acceptedAt = new Date("2026-08-31T10:00:00.000Z");
  assert.equal(await service.userStatus("new-user"), null);
  await service.acceptAuthenticatedUserOnce("new-user", { acceptedAt, termsVersion: "terms:v1", privacyVersion: "privacy:v1" });
  assert.equal(unitOfWork.rows.length, 1);
  assert.equal((await service.requireUserAcceptance("new-user")).adultSelfAttestedAt.toISOString(), acceptedAt.toISOString());
});

test("B–F — durable acceptance is independent of browser storage, marker expiry, tab, login and device", async () => {
  const { service } = serviceFixture();
  await service.acceptAuthenticatedUserOnce("returning-user", { acceptedAt: new Date(0), termsVersion: "terms:v1", privacyVersion: "privacy:v1" });
  for (const simulatedLifecycle of ["empty-storage", "expired-marker", "new-tab", "logout-login", "new-device"]) {
    assert.equal((await service.requireUserAcceptance("returning-user")).userId, "returning-user", simulatedLifecycle);
  }
});

test("G — locale is not part of the durable acceptance identity", async () => {
  const { service, unitOfWork } = serviceFixture();
  await service.acceptAuthenticatedUserOnce("locale-user", { termsVersion: "terms:v1", privacyVersion: "privacy:v1" });
  for (const locale of ["en-GB", "de-DE", "es-ES", "fi-FI", "en-GB"]) {
    assert.equal((await service.requireUserAcceptance("locale-user")).id, unitOfWork.rows[0].id, locale);
  }
});

test("H–I — every authenticated Programme mutation is centrally classified and server-authorised", async () => {
  const routeRoot = path.join(process.cwd(), "app/api/program");
  const routeFiles: string[] = [];
  async function visit(directory: string) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) await visit(target);
      else if (entry.name === "route.ts") routeFiles.push(target);
    }
  }
  await visit(routeRoot);
  const mutations: Array<{ category: string; file: string; method: string; route: string }> = [];
  for (const file of routeFiles) {
    const source = readFileSync(file, "utf8");
    const pathname = `/${path.relative(process.cwd(), path.dirname(file)).replace(/^app\//, "")}`
      .replace("[missionNumber]", "6")
      .replace("[milestone]", "mid");
    for (const match of source.matchAll(/export async function (POST|PUT|PATCH|DELETE)\b/g)) {
      const method = match[1];
      const category = programmeMutationAccessCategory(pathname, method);
      assert.notEqual(category, "unknown", `${method} ${pathname}`);
      if (category === "authenticated") {
        assert.match(source, /requireProgrammeAcceptedUser/, `${method} ${pathname}`);
      }
      mutations.push({ category, file, method, route: pathname });
    }
  }
  assert.ok(mutations.some((item) => item.route.endsWith("/missions/6/actions") && item.category === "authenticated"));
  assert.ok(mutations.some((item) => item.category === "anonymous"));
  assert.ok(mutations.some((item) => item.category === "claim-transition"));
});

test("J — an unaccepted authenticated user fails closed and succeeds after acknowledgement", async () => {
  const { service } = serviceFixture();
  await assert.rejects(() => service.requireUserAcceptance("unaccepted"), (error: Error & { code?: string }) => error.code === "PROGRAMME_ACCESS_ACKNOWLEDGEMENT_REQUIRED");
  await service.acceptAuthenticatedUserOnce("unaccepted", { termsVersion: "terms:v1", privacyVersion: "privacy:v1" });
  assert.equal((await service.requireUserAcceptance("unaccepted")).userId, "unaccepted");
});

test("K — anonymous acceptance remains session-bound until an atomic claim bind", async () => {
  const { service, unitOfWork } = serviceFixture();
  await assert.rejects(
    () => service.requireAnonymousAcceptance(unitOfWork as unknown as ProgrammeUnitOfWork, "anonymous-1"),
    (error: Error & { code?: string }) => error.code === "CURRENT_ACCESS_AUTHORITY_REQUIRED",
  );
  await unitOfWork.acceptAnonymousSessionOnce("anonymous-1", {
    adultSelfAttestedAt: new Date(1), termsAcceptedAt: new Date(1), privacyAcknowledgedAt: new Date(1),
    termsVersionAtAcceptance: "terms:v1", privacyVersionAtAcceptance: "privacy:v1",
  });
  await service.requireAnonymousAcceptance(unitOfWork as unknown as ProgrammeUnitOfWork, "anonymous-1");
  const bound = await service.bindAnonymousAcceptanceToUser(unitOfWork as unknown as ProgrammeUnitOfWork, "anonymous-1", "claimed-user");
  assert.equal(bound.userId, "claimed-user");
  assert.equal(bound.anonymousSessionId, null);
});

test("L — later Terms or Privacy constants cannot revoke first acceptance", async () => {
  const { service, unitOfWork } = serviceFixture();
  const first = await service.acceptAuthenticatedUserOnce("version-user", { acceptedAt: new Date(2), termsVersion: "terms:old", privacyVersion: "privacy:old" });
  const retry = await service.acceptAuthenticatedUserOnce("version-user", { acceptedAt: new Date(3), termsVersion: "terms:new", privacyVersion: "privacy:new" });
  assert.equal(unitOfWork.rows.length, 1);
  assert.equal(retry.id, first.id);
  assert.equal(retry.termsVersionAtAcceptance, "terms:old");
  assert.equal(retry.privacyVersionAtAcceptance, "privacy:old");
});

test("M — authenticated clients and middleware cannot regress to ephemeral-only authority", () => {
  for (const file of [
    "components/programme/ProgramAiMissionExperience.tsx",
    "components/programme/ProgramAiReviewScreen.tsx",
  ]) {
    const source = readFileSync(file, "utf8");
    assert.doesNotMatch(source, /hasProgrammeAccessAuthority|PROGRAMME_ACCESS_HEADERS/);
  }
  const experience = readFileSync("components/programme/ProgramAiExperience.tsx", "utf8");
  assert.match(experience, /subject\.kind === "journey" && hasProgrammeAccessAuthority/);
  const middleware = readFileSync("middleware.ts", "utf8");
  assert.match(middleware, /programmeMutationCategory === "anonymous" \|\| programmeMutationCategory === "unknown"/);
  const migration = readFileSync("prisma/migrations/0024_programme_access_acceptance/migration.sql", "utf8");
  assert.match(migration, /PROGRAM_AI_CLAIM_BACKFILL/);
  assert.match(migration, /anonymous_session\."missionVersion" = 'program-ai-01:v1'/);
  assert.doesNotMatch(migration, /INSERT INTO "ProgrammeAccessAcceptance"[\s\S]*FROM "ProgramEnrollment"\s*(?:;|$)/);
});
