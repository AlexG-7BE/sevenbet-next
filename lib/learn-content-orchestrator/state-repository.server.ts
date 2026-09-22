import "server-only";

import { randomUUID } from "node:crypto";

import { Prisma, type PrismaClient } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";

import {
  LEARN_CONTENT_ACTIVE_LEASE_HOURS,
  LEARN_CONTENT_MAX_STATE_BYTES,
  LEARN_CONTENT_STATE_KEY,
  type LearnContentLocale,
} from "./config";

const exactTimestampSchema = z.string().refine((value) => {
  const parsed = new Date(value);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString() === value;
});

export const learnContentActiveRunSchema = z.object({
  runId: z.string().uuid(),
  requestId: z.string().regex(/^learn-content:[0-9a-f-]{36}$/),
  sessionId: z.string().min(1).max(200).nullable(),
  language: z.string().min(2).max(20),
  locale: z.string().min(2).max(20),
  model: z.string().min(1).max(120),
  startedAt: exactTimestampSchema,
  leaseUntil: exactTimestampSchema,
  publicationAttempts: z.number().int().min(0).max(3),
}).strict();

export const learnContentOperationalStateSchema = z.object({
  version: z.literal(1),
  nextEligibleAt: exactTimestampSchema.nullable(),
  localeCursor: z.number().int().min(0).max(100),
  consecutiveFailures: z.number().int().min(0).max(100),
  haltedCode: z.string().regex(/^[A-Z0-9_]{1,80}$/).nullable(),
  active: learnContentActiveRunSchema.nullable(),
  last: z.object({
    runId: z.string().uuid(),
    completedAt: exactTimestampSchema,
    result: z.enum(["NO_OP", "PUBLISHED", "BLOCKED", "FAILED"]),
    code: z.string().regex(/^[A-Z0-9_]{1,80}$/),
  }).strict().nullable(),
}).strict();

export type LearnContentActiveRun = z.infer<typeof learnContentActiveRunSchema>;
export type LearnContentOperationalState = z.infer<typeof learnContentOperationalStateSchema>;

export type LearnContentClaim =
  | { action: "LAUNCH" | "RECONCILE"; run: LearnContentActiveRun }
  | { action: "BUSY" | "NOT_DUE" | "HALTED"; code: string };

export interface LearnContentStateRepository {
  claim(input: { now: Date; minIntervalHours: number; locales: readonly LearnContentLocale[]; model: string }): Promise<LearnContentClaim>;
  attachSession(input: { runId: string; sessionId: string; now: Date }): Promise<boolean>;
  touch(input: { runId: string; now: Date }): Promise<boolean>;
  recordPublicationAttempt(input: { runId: string; now: Date }): Promise<number | null>;
  finish(input: {
    runId: string;
    now: Date;
    result: "NO_OP" | "PUBLISHED" | "BLOCKED" | "FAILED";
    code: string;
    halt?: boolean;
  }): Promise<boolean>;
  read(): Promise<LearnContentOperationalState>;
}

function initialState(): LearnContentOperationalState {
  return {
    version: 1,
    nextEligibleAt: null,
    localeCursor: 0,
    consecutiveFailures: 0,
    haltedCode: null,
    active: null,
    last: null,
  };
}

function parseState(value: unknown) {
  if (value === null || value === undefined) return initialState();
  return learnContentOperationalStateSchema.parse(value);
}

function addHours(date: Date, hours: number) {
  return new Date(date.valueOf() + hours * 60 * 60 * 1_000);
}

export function assertBoundedLearnContentState(state: LearnContentOperationalState) {
  const parsed = learnContentOperationalStateSchema.parse(state);
  if (Buffer.byteLength(JSON.stringify(parsed)) > LEARN_CONTENT_MAX_STATE_BYTES) {
    throw new Error("Learn content operational state exceeds its bounded SiteSetting limit");
  }
  return parsed;
}

type TransactionClient = Prisma.TransactionClient;

export class PrismaLearnContentStateRepository implements LearnContentStateRepository {
  constructor(private readonly database: PrismaClient = prisma) {}

  private async locked<T>(work: (transaction: TransactionClient) => Promise<T>): Promise<T | null> {
    return this.database.$transaction(async (transaction) => {
      const rows = await transaction.$queryRaw<Array<{ locked: boolean }>>`
        SELECT pg_try_advisory_xact_lock(hashtextextended(${LEARN_CONTENT_STATE_KEY}, 0)) AS locked
      `;
      if (!rows[0]?.locked) return null;
      return work(transaction);
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  private async current(transaction: TransactionClient) {
    const record = await transaction.siteSetting.findUnique({ where: { key: LEARN_CONTENT_STATE_KEY }, select: { value: true } });
    return parseState(record?.value);
  }

  private async save(transaction: TransactionClient, state: LearnContentOperationalState) {
    const bounded = assertBoundedLearnContentState(state);
    await transaction.siteSetting.upsert({
      where: { key: LEARN_CONTENT_STATE_KEY },
      create: { key: LEARN_CONTENT_STATE_KEY, value: bounded as Prisma.InputJsonValue },
      update: { value: bounded as Prisma.InputJsonValue },
    });
  }

  async claim(input: { now: Date; minIntervalHours: number; locales: readonly LearnContentLocale[]; model: string }): Promise<LearnContentClaim> {
    const claimed = await this.locked(async (transaction): Promise<LearnContentClaim> => {
      const state = await this.current(transaction);
      if (state.haltedCode) return { action: "HALTED", code: state.haltedCode };

      if (state.active) {
        if (new Date(state.active.leaseUntil) > input.now) {
          return { action: state.active.sessionId ? "RECONCILE" : "LAUNCH", run: state.active };
        }
        state.last = {
          runId: state.active.runId,
          completedAt: input.now.toISOString(),
          result: "FAILED",
          code: "ACTIVE_LEASE_EXPIRED",
        };
        state.consecutiveFailures = Math.min(100, state.consecutiveFailures + 1);
        state.active = null;
        await this.save(transaction, state);
      }

      if (state.nextEligibleAt && new Date(state.nextEligibleAt) > input.now) {
        return { action: "NOT_DUE", code: "MINIMUM_INTERVAL_ACTIVE" };
      }
      if (!input.locales.length) return { action: "HALTED", code: "NO_ALLOWED_LOCALES" };

      const selected = input.locales[state.localeCursor % input.locales.length];
      const runId = randomUUID();
      const run: LearnContentActiveRun = {
        runId,
        requestId: `learn-content:${runId}`,
        sessionId: null,
        language: selected.language,
        locale: selected.locale,
        model: input.model,
        startedAt: input.now.toISOString(),
        leaseUntil: addHours(input.now, LEARN_CONTENT_ACTIVE_LEASE_HOURS).toISOString(),
        publicationAttempts: 0,
      };
      state.active = run;
      state.localeCursor = (state.localeCursor + 1) % input.locales.length;
      state.nextEligibleAt = addHours(input.now, input.minIntervalHours).toISOString();
      await this.save(transaction, state);
      return { action: "LAUNCH", run };
    });
    return claimed ?? { action: "BUSY", code: "ORCHESTRATOR_LOCK_BUSY" };
  }

  async attachSession(input: { runId: string; sessionId: string; now: Date }) {
    const updated = await this.locked(async (transaction) => {
      const state = await this.current(transaction);
      if (!state.active || state.active.runId !== input.runId) return false;
      if (state.active.sessionId && state.active.sessionId !== input.sessionId) return false;
      state.active.sessionId = input.sessionId;
      state.active.leaseUntil = addHours(input.now, LEARN_CONTENT_ACTIVE_LEASE_HOURS).toISOString();
      await this.save(transaction, state);
      return true;
    });
    return updated ?? false;
  }

  async touch(input: { runId: string; now: Date }) {
    const updated = await this.locked(async (transaction) => {
      const state = await this.current(transaction);
      if (!state.active || state.active.runId !== input.runId) return false;
      state.active.leaseUntil = addHours(input.now, LEARN_CONTENT_ACTIVE_LEASE_HOURS).toISOString();
      await this.save(transaction, state);
      return true;
    });
    return updated ?? false;
  }

  async recordPublicationAttempt(input: { runId: string; now: Date }) {
    const updated = await this.locked(async (transaction) => {
      const state = await this.current(transaction);
      if (!state.active || state.active.runId !== input.runId) return null;
      state.active.publicationAttempts += 1;
      state.active.leaseUntil = addHours(input.now, LEARN_CONTENT_ACTIVE_LEASE_HOURS).toISOString();
      await this.save(transaction, state);
      return state.active.publicationAttempts;
    });
    return updated ?? null;
  }

  async finish(input: {
    runId: string;
    now: Date;
    result: "NO_OP" | "PUBLISHED" | "BLOCKED" | "FAILED";
    code: string;
    halt?: boolean;
  }) {
    const updated = await this.locked(async (transaction) => {
      const state = await this.current(transaction);
      if (!state.active || state.active.runId !== input.runId) return false;
      state.last = {
        runId: input.runId,
        completedAt: input.now.toISOString(),
        result: input.result,
        code: input.code,
      };
      state.active = null;
      state.consecutiveFailures = input.result === "FAILED" ? Math.min(100, state.consecutiveFailures + 1) : 0;
      if (input.halt) state.haltedCode = input.code;
      await this.save(transaction, state);
      return true;
    });
    return updated ?? false;
  }

  async read() {
    const record = await this.database.siteSetting.findUnique({ where: { key: LEARN_CONTENT_STATE_KEY }, select: { value: true } });
    return parseState(record?.value);
  }
}
