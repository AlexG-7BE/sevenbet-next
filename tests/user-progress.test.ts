import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import type { Prisma } from "@prisma/client";

import { AuthenticationRequiredError } from "../lib/auth/errors";
import {
  assertNoProgressUserOrphans,
  buildProgressOrphanReport,
  ProgressUserOrphanError,
} from "../lib/progress/orphan-check";
import { parseStartProgramBody } from "../lib/progress/input";
import { handleGetProgress } from "../lib/progress/http";
import type {
  PublishedProgramProgressSource,
  RecordUserProgressEventInput,
  StoredProgressEvent,
  UserProgressEnrollment,
  UserProgressStore,
} from "../lib/repositories/user-progress.repository";
import { ValidationError } from "../lib/services/service-error";
import {
  UserProgressService,
} from "../lib/services/user-progress.service";

const ids = {
  program: "10000000-0000-4000-8000-000000000001",
  version: "10000000-0000-4000-8000-000000000002",
  step: "10000000-0000-4000-8000-000000000003",
  lesson: "10000000-0000-4000-8000-000000000004",
  quiz: "10000000-0000-4000-8000-000000000005",
  enrollment: "10000000-0000-4000-8000-000000000006",
  event: "10000000-0000-4000-8000-000000000007",
};

const publishedSnapshot = {
  program: { id: ids.program },
  steps: [
    {
      id: ids.step,
      order: 1,
      lessons: [
        {
          id: ids.lesson,
          required: true,
          blocks: [
            {
              id: ids.quiz,
              type: "QUIZ",
              required: false,
              archived: false,
              data: { options: ["One", "Two"], correctIndex: 1 },
            },
          ],
        },
      ],
    },
  ],
  achievements: [],
  xpRules: [],
} as unknown as Prisma.JsonValue;

class FakeProgressStore implements UserProgressStore {
  enrollment: UserProgressEnrollment | null = null;
  eventSequence = 0;

  readonly source: PublishedProgramProgressSource = {
    programId: ids.program,
    programVersionId: ids.version,
    version: 1,
    snapshot: publishedSnapshot,
  };

  async findPublishedProgram(programId: string) {
    return programId === ids.program ? this.source : null;
  }

  async findEnrollment(userId: string, programId: string) {
    if (
      this.enrollment?.userId === userId &&
      this.enrollment.programId === programId
    ) {
      return this.enrollment;
    }
    return null;
  }

  async getOrCreateEnrollment(input: {
    userId: string;
    programId: string;
    programVersionId: string;
    currentStepId?: string;
  }) {
    if (!this.enrollment) {
      this.enrollment = {
        id: ids.enrollment,
        userId: input.userId,
        programId: input.programId,
        programVersionId: input.programVersionId,
        startedAt: new Date("2026-07-14T00:00:00.000Z"),
        completedAt: null,
        currentStepId: input.currentStepId ?? null,
        programVersion: {
          id: ids.version,
          programId: ids.program,
          version: 1,
          status: "PUBLISHED",
          snapshot: publishedSnapshot,
        },
        progressEvents: [],
      };
    }
    return this.enrollment;
  }

  async setCurrentStep(input: {
    userId: string;
    programId: string;
    enrollmentId: string;
    currentStepId: string;
  }) {
    const enrollment = await this.findEnrollment(input.userId, input.programId);
    if (!enrollment || enrollment.id !== input.enrollmentId) return null;
    enrollment.currentStepId = input.currentStepId;
    return enrollment;
  }

  async recordEvent(input: RecordUserProgressEventInput) {
    const enrollment = await this.findEnrollment(input.userId, input.programId);
    if (!enrollment || enrollment.id !== input.enrollmentId) return null;
    const existing = enrollment.progressEvents.find(
      (event) => event.eventKey === input.eventKey,
    );
    if (existing) return existing;

    this.eventSequence += 1;
    const event: StoredProgressEvent = {
      id: `${ids.event.slice(0, -1)}${this.eventSequence}`,
      enrollmentId: enrollment.id,
      entityId: input.entityId,
      entityType: input.entityType,
      eventType: input.eventType,
      eventKey: input.eventKey,
      metadata: (input.metadata as Prisma.JsonValue | undefined) ?? null,
      createdAt: new Date("2026-07-14T00:01:00.000Z"),
    };
    enrollment.progressEvents.push(event);
    return event;
  }

  async completeEnrollment(input: {
    userId: string;
    programId: string;
    enrollmentId: string;
  }) {
    const enrollment = await this.findEnrollment(input.userId, input.programId);
    if (!enrollment || enrollment.id !== input.enrollmentId) return null;
    enrollment.completedAt ??= new Date("2026-07-14T00:02:00.000Z");
    return enrollment;
  }
}

test("anonymous progress API resolves to 401", async () => {
  const response = await handleGetProgress(
    new Request(`http://localhost/api/program/progress?programId=${ids.program}`),
    {
      requireUser: async () => {
        throw new AuthenticationRequiredError();
      },
      service: {
        getCurrentProgress: async () => null,
        startProgram: async () => {
          throw new Error("not used");
        },
      },
    },
  );
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), {
    ok: false,
    error: "Authentication required",
    code: "AUTHENTICATION_REQUIRED",
  });
});

test("client-supplied userId is rejected", () => {
  assert.throws(
    () => parseStartProgramBody({ programId: ids.program, userId: "other-user" }),
    ValidationError,
  );
});

test("starting a published program is idempotent", async () => {
  const store = new FakeProgressStore();
  const service = new UserProgressService(store);
  const first = await service.startProgram("user-one", { programId: ids.program });
  const second = await service.startProgram("user-one", { programId: ids.program });

  assert.deepEqual(second, first);
  assert.equal(store.enrollment?.userId, "user-one");
  assert.equal(store.enrollment?.currentStepId, ids.step);
});

test("duplicate event keys do not create duplicate progress events", async () => {
  const store = new FakeProgressStore();
  const service = new UserProgressService(store);
  await service.startProgram("user-one", { programId: ids.program });
  const first = await service.completeLesson("user-one", {
    programId: ids.program,
    lessonId: ids.lesson,
  });
  const second = await service.completeLesson("user-one", {
    programId: ids.program,
    lessonId: ids.lesson,
  });

  assert.equal(second.id, first.id);
  assert.equal(store.enrollment?.progressEvents.length, 1);
});

test("an enrollment owned by another user is not accessible", async () => {
  const store = new FakeProgressStore();
  const service = new UserProgressService(store);
  await service.startProgram("user-one", { programId: ids.program });

  await assert.rejects(
    service.completeLesson("user-two", {
      programId: ids.program,
      lessonId: ids.lesson,
    }),
    /Program enrollment not found/,
  );
});

test("invalid lesson and block IDs are rejected", async () => {
  const store = new FakeProgressStore();
  const service = new UserProgressService(store);
  await service.startProgram("user-one", { programId: ids.program });
  const unknownId = "20000000-0000-4000-8000-000000000001";

  await assert.rejects(
    service.completeLesson("user-one", {
      programId: ids.program,
      lessonId: unknownId,
    }),
    /Lesson does not belong to this program/,
  );
  await assert.rejects(
    service.saveQuizResult("user-one", {
      programId: ids.program,
      blockId: unknownId,
      answerIndex: 0,
    }),
    /Block does not belong to this program/,
  );
});

test("orphan preflight fails when a referenced user does not exist", () => {
  const report = buildProgressOrphanReport(
    {
      programEnrollments: ["known-user", "orphan-user"],
      xpEvents: ["orphan-user"],
      achievements: [],
    },
    ["known-user"],
  );

  assert.equal(report.orphanCount, 1);
  assert.equal(report.orphanFingerprints.length, 1);
  assert.throws(
    () => assertNoProgressUserOrphans(report),
    ProgressUserOrphanError,
  );
});

test("migration 0004 adds only compatible TEXT user foreign keys", () => {
  const foundation = readFileSync(
    "prisma/migrations/0002_program_builder/migration.sql",
    "utf8",
  );
  const auth = readFileSync(
    "prisma/migrations/0003_auth_foundation/migration.sql",
    "utf8",
  );
  const migration = readFileSync(
    "prisma/migrations/0004_progress_user_foreign_keys/migration.sql",
    "utf8",
  ).replace(/\s+/g, " ");

  assert.match(auth, /CREATE TABLE "User"[\s\S]*?"id" TEXT NOT NULL/);
  for (const table of ["ProgramEnrollment", "UserXpEvent", "UserAchievement"]) {
    assert.match(
      foundation,
      new RegExp(`CREATE TABLE "${table}"[\\s\\S]*?"userId" TEXT NOT NULL`),
    );
    assert.match(
      migration,
      new RegExp(
        `ALTER TABLE "${table}" ADD CONSTRAINT "${table}_userId_fkey" FOREIGN KEY \\(\\"userId\\"\\) REFERENCES \\"User\\"\\(\\"id\\"\\) ON DELETE CASCADE ON UPDATE CASCADE`,
      ),
    );
  }
  assert.doesNotMatch(migration, /CREATE (UNIQUE )?INDEX/);
  assert.doesNotMatch(migration, /ALTER COLUMN|TYPE UUID/);
});
