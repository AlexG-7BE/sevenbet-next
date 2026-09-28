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

  run<T>(operation: () => Promise<T>, budgetMs: number): Promise<T> {
    const budget: ReadBudget = { expired: false };
    let timer: ReturnType<typeof setTimeout> | undefined;
    const deadline = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        budget.expired = true;
        reject(new PublicDatabaseReadTimeoutError(budgetMs));
      }, budgetMs);
      timer.unref?.();
    });
    const work = usesSingleConnectionPool() ? this.enqueue(operation, budget, budgetMs) : operation();
    return Promise.race([work, deadline]).finally(() => clearTimeout(timer));
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
 */
export function runPublicDatabaseRead<T>(
  operation: () => Promise<T>,
  options: { budgetMs?: number } = {},
): Promise<T> {
  return publicDatabaseReadCoordinator.run(operation, options.budgetMs ?? PUBLIC_DATABASE_READ_BUDGET_MS);
}
