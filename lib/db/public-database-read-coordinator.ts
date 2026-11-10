import type { PrismaClient } from "@prisma/client";

import { directReadPrisma } from "@/lib/db/direct-read-prisma";
import { prisma } from "@/lib/db/prisma";
import { usesSingleConnectionPool } from "@/lib/db/prisma-runtime-config";

/**
 * How long a public page or `/r/` may wait for one public read, queueing
 * included. Past it the caller's existing fallback renders instead of the
 * request hanging; the query itself is left to Prisma's pool and socket
 * timeouts, because a started Prisma query cannot be cancelled.
 */
export const PUBLIC_DATABASE_READ_BUDGET_MS = 8_000;

/**
 * The whole-catalogue editorial projections (every published casino snapshot, every offer
 * candidate, a published review) mostly run as background revalidations of the editorial
 * cache. At 8 s they failed several times an hour on Production (28 Sep 2026), which left
 * pages on stale data after a publish or a deploy. They get most of the 30 s function limit.
 */
export const PUBLIC_DATABASE_PROJECTION_BUDGET_MS = 25_000;

/**
 * How long a public read waits on the pooled endpoint before the same read also goes to the
 * direct host (Founder, 10 November 2026). A public read normally answers in about 100 ms; one
 * still open at 2 s is stalled at the pooled endpoint, and a full pool gives up only at its 3 s
 * connect bound, after the fallback has started.
 */
export const PUBLIC_DATABASE_READ_FALLBACK_AFTER_MS = 2_000;

/** The clients a public read runs on: the runtime client, and the direct fallback where there is one. */
export type PublicReadClients = { primary: PrismaClient; fallback: () => PrismaClient | null };

const runtimeClients: PublicReadClients = { primary: prisma, fallback: directReadPrisma };

export class PublicDatabaseReadTimeoutError extends Error {
  readonly code = "PUBLIC_DATABASE_READ_TIMEOUT";

  constructor(readonly budgetMs: number) {
    super(`Public database read exceeded its ${budgetMs} ms budget.`);
    this.name = "PublicDatabaseReadTimeoutError";
  }
}

type ReadBudget = { expired: boolean };

class PublicDatabaseReadCoordinator {
  private tail: Promise<void> = Promise.resolve();

  run<T>(operation: (db: PrismaClient) => Promise<T>, budgetMs: number, clients: PublicReadClients | null): Promise<T> {
    const budget: ReadBudget = { expired: false };
    let timer: ReturnType<typeof setTimeout> | undefined;
    const deadline = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        budget.expired = true;
        reject(new PublicDatabaseReadTimeoutError(budgetMs));
      }, budgetMs);
      timer.unref?.();
    });
    const primary = clients?.primary ?? prisma;
    const work = usesSingleConnectionPool()
      ? this.enqueue(() => operation(primary), budget, budgetMs)
      : clients
        ? this.withFallback(operation, clients, budget)
        : operation(primary);
    return Promise.race([work, deadline]).finally(() => clearTimeout(timer));
  }

  /**
   * The read on the runtime client, and, once it has been open for
   * {@link PUBLIC_DATABASE_READ_FALLBACK_AFTER_MS}, the same read on the direct fallback client
   * beside it. The first answer wins; the read fails only when every copy that started has
   * failed. A failure before the fallback starts is the read's answer, as before. Public reads
   * only select, so running one twice changes nothing.
   */
  private withFallback<T>(operation: (db: PrismaClient) => Promise<T>, clients: PublicReadClients, budget: ReadBudget): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      let started = 1;
      let failed = 0;
      const fail = (error: unknown) => {
        failed += 1;
        if (failed === started) reject(error);
      };
      const timer = setTimeout(() => {
        const fallback = budget.expired ? null : clients.fallback();
        if (!fallback) return;
        started += 1;
        console.warn("public_db_read_fallback", { afterMs: PUBLIC_DATABASE_READ_FALLBACK_AFTER_MS });
        operation(fallback).then((value) => {
          console.warn("public_db_read_fallback_answered");
          resolve(value);
        }, fail);
      }, PUBLIC_DATABASE_READ_FALLBACK_AFTER_MS);
      timer.unref?.();
      operation(clients.primary).then(resolve, fail).finally(() => clearTimeout(timer));
    });
  }

  /**
   * One-connection pools only: reads enter the database one at a time, in
   * arrival order. A read whose budget ran out while queued is skipped, so a
   * backlog drains instead of running work nobody waits for. A running read
   * keeps the slot until it settles, because the connection is still busy.
   */
  private enqueue<T>(operation: () => Promise<T>, budget: ReadBudget, budgetMs: number): Promise<T> {
    const previous = this.tail;
    let release!: () => void;
    this.tail = new Promise<void>((resolve) => { release = resolve; });
    return previous
      .then(() => (budget.expired ? Promise.reject(new PublicDatabaseReadTimeoutError(budgetMs)) : operation()))
      .finally(release);
  }
}

const publicDatabaseReadCoordinator = new PublicDatabaseReadCoordinator();

/**
 * Every public read is bounded by {@link PUBLIC_DATABASE_READ_BUDGET_MS}.
 *
 * Prisma's pool is normally the concurrency authority: the Production pooled
 * URL runs with the multi-connection runtime pool policy
 * (`lib/db/prisma-runtime-config.ts`), so reads go straight to Prisma. Only an
 * effective `connection_limit=1` pool (disposable local/CI databases) shares one
 * process-local FIFO, instead of competing for the single slot until Prisma's
 * pool timeout.
 *
 * The read gets the client to query (`db`) and must use it, not the module-level `prisma`: a
 * read still unanswered after {@link PUBLIC_DATABASE_READ_FALLBACK_AFTER_MS} runs again on the
 * direct host where there is one. `clients: null` runs it on the runtime client only, for a
 * read bound to another client.
 */
export function runPublicDatabaseRead<T>(
  operation: (db: PrismaClient) => Promise<T>,
  options: { budgetMs?: number; clients?: PublicReadClients | null } = {},
): Promise<T> {
  const clients = options.clients === undefined ? runtimeClients : options.clients;
  return publicDatabaseReadCoordinator.run(operation, options.budgetMs ?? PUBLIC_DATABASE_READ_BUDGET_MS, clients);
}
