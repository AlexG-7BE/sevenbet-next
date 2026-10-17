/**
 * An in-memory Programme unit of work for the Program AI Mission tests: one enrollment, its
 * Mission progress, its XP and progress-event ledgers. `legacy` seeds Missions 01–04 completed
 * under the earlier runtime; `m1Incomplete` leaves Mission 01 half done.
 */
import { actionTaskState, missionsBefore, programAiMissionRegistry } from "../../lib/programme/program-ai/mission-registry";

export type Progress = {
  id: string;
  enrollmentId: string;
  missionNumber: number;
  status: "NOT_STARTED" | "IN_PROGRESS" | "READY_TO_SAVE" | "COMPLETED";
  taskStates: string[];
  draft: Record<string, unknown> | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export function fakeUnitOfWork({ legacy = false, m1Incomplete = false }: { legacy?: boolean; m1Incomplete?: boolean } = {}) {
  const programId = "00000000-0000-4000-8000-000000000010";
  const enrollment = {
    id: "00000000-0000-4000-8000-000000000020",
    userId: "user-a",
    programId,
    programVersionId: "00000000-0000-4000-8000-000000000030",
    currentStepId: "00000000-0000-4000-8000-000000000101",
    timezone: "UTC",
    startedAt: new Date("2026-08-01T10:00:00.000Z"),
    completedAt: null as Date | null,
  };
  const steps = Array.from({ length: 10 }, (_, index) => ({
    id: `00000000-0000-4000-8000-${String(index + 100).padStart(12, "0")}`,
    order: index + 1,
  }));
  const now = new Date("2026-08-11T10:00:00.000Z");
  const progress = new Map<number, Progress>();
  const completedThrough = legacy ? 4 : m1Incomplete ? 0 : 1;
  for (let missionNumber = 1; missionNumber <= completedThrough; missionNumber += 1) {
    progress.set(missionNumber, {
      id: `00000000-0000-4000-8000-${String(missionNumber).padStart(12, "0")}`,
      enrollmentId: enrollment.id,
      missionNumber,
      status: "COMPLETED",
      taskStates: legacy ? [`legacy-mission-${missionNumber}`] : ["program_ai_situation_submitted", "program_ai_starting_point_complete"],
      draft: null,
      completedAt: now,
      createdAt: now,
      updatedAt: now,
    });
  }
  if (m1Incomplete) {
    progress.set(1, { id: "00000000-0000-4000-8000-000000000001", enrollmentId: enrollment.id, missionNumber: 1, status: "IN_PROGRESS", taskStates: ["program_ai_situation_submitted"], draft: null, completedAt: null, createdAt: now, updatedAt: now });
  } else if (!legacy) {
    progress.set(2, { id: "00000000-0000-4000-8000-000000000002", enrollmentId: enrollment.id, missionNumber: 2, status: "IN_PROGRESS", taskStates: [], draft: null, completedAt: null, createdAt: now, updatedAt: now });
  }
  const xpEvents = new Map<string, number>(legacy
    ? [["legacy:m1", 60], ["legacy:m2", 80], ["legacy:m3", 90], ["legacy:m4", 100]]
    : m1Incomplete ? [["programme-ai-m1-situation", 20]] : [["programme-ai-m1", 40]]);
  const progressEvents = new Set<string>();
  let queue = Promise.resolve();
  const source = { program: { id: programId, steps }, version: { id: enrollment.programVersionId, status: "PUBLISHED" } };
  const unit = {
    serializable<T>(operation: (value: unknown) => Promise<T>) {
      const result = queue.then(() => operation(unit));
      queue = result.then(() => undefined, () => undefined);
      return result;
    },
    snapshot<T>(operation: (value: unknown) => Promise<T>) { return operation(unit); },
    progress: {
      findControlProgram: async () => source,
      findEnrollment: async (userId: string) => userId === enrollment.userId ? enrollment : null,
      findMissionProgress: async (_enrollmentId: string, missionNumber: number) => progress.get(missionNumber) ?? null,
      listMissionProgress: async () => [...progress.values()].map(({ missionNumber, status }) => ({ missionNumber, status })),
      upsertMissionProgress: async (input: Omit<Progress, "id" | "createdAt" | "updatedAt">) => {
        const existing = progress.get(input.missionNumber);
        const saved: Progress = {
          id: existing?.id ?? `00000000-0000-4000-8000-${String(input.missionNumber).padStart(12, "0")}`,
          createdAt: existing?.createdAt ?? now,
          updatedAt: now,
          ...input,
          draft: input.draft === undefined ? existing?.draft ?? null : input.draft,
        };
        progress.set(input.missionNumber, saved);
        return saved;
      },
      setEnrollmentCurrentStep: async (_id: string, currentStepId: string) => { enrollment.currentStepId = currentStepId; return enrollment; },
      completeEnrollmentIfOpen: async (_id: string, completedAt: Date) => {
        if (enrollment.completedAt) return { count: 0 };
        enrollment.completedAt = completedAt;
        return { count: 1 };
      },
    },
    rewards: {
      recordProgrammeAiMissionXp: async (input: { awardKey: string; xp: number }) => {
        if (xpEvents.has(input.awardKey)) return { count: 0 };
        xpEvents.set(input.awardKey, input.xp);
        return { count: 1 };
      },
      recordProgressEvent: async (input: { eventKey: string }) => {
        const fresh = !progressEvents.has(input.eventKey);
        progressEvents.add(input.eventKey);
        return { count: fresh ? 1 : 0 };
      },
      recordActiveDay: async () => ({ count: 1 }),
    },
    dashboard: {
      findDashboardData: async () => [],
    },
    programAiMissionOne: {
      home: async (userId: string) => ({
        enrollment: userId === enrollment.userId ? {
          ...enrollment,
          missionProgress: [...progress.values()].sort((a, b) => a.missionNumber - b.missionNumber),
          programmeStartingPoint: {
            startingPoint: "I return quickly after a difficult day.",
            desiredChange: "Pause before deciding.",
            broadContext: "HOME",
            continuationCue: "The quick-return cue.",
            chosenBoundaryAction: null,
          },
        } : null,
        totalXp: userId === enrollment.userId ? [...xpEvents.values()].reduce((sum, value) => sum + value, 0) : 0,
      }),
    },
  };
  return { unit, enrollment, progress, steps, xpEvents, progressEvents };
}

export function readyMissionTen(fake: ReturnType<typeof fakeUnitOfWork>) {
  const now = new Date("2026-08-11T10:00:00.000Z");
  for (const missionNumber of missionsBefore(10).filter((earlier) => earlier !== 1)) {
    fake.progress.set(missionNumber, {
      id: `00000000-0000-4000-8000-${String(missionNumber).padStart(12, "0")}`,
      enrollmentId: fake.enrollment.id,
      missionNumber,
      status: "COMPLETED",
      taskStates: [],
      draft: null,
      completedAt: now,
      createdAt: now,
      updatedAt: now,
    });
  }
  const definition = programAiMissionRegistry.find((mission) => mission.missionNumber === 10)!;
  fake.progress.set(10, {
    id: "00000000-0000-4000-8000-000000000010",
    enrollmentId: fake.enrollment.id,
    missionNumber: 10,
    status: "IN_PROGRESS",
    taskStates: definition.actions.map((action) => actionTaskState(10, action.id)),
    draft: null,
    completedAt: null,
    createdAt: now,
    updatedAt: now,
  });
  return fake.progress.get(10)!;
}
