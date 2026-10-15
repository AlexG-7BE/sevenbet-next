import { Prisma, type PrismaClient } from "@prisma/client";

import { createCasinoMarket0025AdminClient } from "@/lib/db/casino-market-0025-admin-client";

/**
 * Build-time release verification: one PostgreSQL-enforced read-only, repeatable-read snapshot
 * over the direct database binding, run once more on a fresh connection when an attempt fails
 * to talk to the database (15 October 2026).
 *
 * Why the direct binding: on 14 and 15 October 2026 five Production builds failed in
 * `scripts/logo-only-media-build-preflight.ts production-verify` with "Query read timeout",
 * 25 s (the runtime `socket_timeout`) after the step began. The step read through the runtime
 * client, that is the Prisma Postgres pooled endpoint (PgBouncer in transaction mode), which
 * also serves the live site. In the same seconds Production requests on that endpoint timed out
 * the same way, while `scripts/vercel-build-preflight.ts`, reading the same database through
 * `DIRECT_URL` a moment earlier, finished normally. The pooled endpoint has stalled a few times
 * an hour since at least 11 October 2026; Prisma recommends the direct connection for jobs like
 * this one, and the main build preflight has always used it.
 *
 * Why the repeat does not weaken the check: every attempt runs the whole verification again in
 * a new read-only snapshot, and only a failure to reach or hear from the database is repeated.
 * A failed invariant, a SQL error or a transaction PostgreSQL did not make read-only fails at
 * once. An attempt that hangs is abandoned at a deadline, so a stalled connection cannot hold
 * the build for longer than `attempts × deadline`.
 */

export type ReleaseVerificationClient = Pick<PrismaClient, "$transaction" | "$disconnect">;

export const RELEASE_VERIFICATION_ATTEMPTS = 3;
export const RELEASE_VERIFICATION_RETRY_DELAY_MS = 2_000;
/** Slack over the transaction's own bounds before an attempt is abandoned regardless of the engine. */
export const RELEASE_VERIFICATION_DEADLINE_SLACK_MS = 5_000;
/** A client whose connection hung may never finish disconnecting; the build does not wait for it. */
const DISCONNECT_WAIT_MS = 5_000;

/**
 * Prisma codes for a database that could not be reached, a connection that closed or timed out,
 * and an interactive transaction that could not start or expired: P1001, P1002, P1008, P1017,
 * P2024, P2028.
 */
const TRANSIENT_PRISMA_CODES = new Set(["P1001", "P1002", "P1008", "P1017", "P2024", "P2028"]);
const TRANSIENT_MESSAGE = /Query read timeout|Can't reach database server|Server has closed the connection|Connection terminated|ECONNRESET|ECONNREFUSED|ETIMEDOUT|EPIPE|EAI_AGAIN|upstream database|Timed out fetching a new connection/i;

export class ReleaseVerificationDeadlineError extends Error {
  constructor(release: string, deadlineMs: number) {
    super(`${release}: verification attempt gave no answer within ${deadlineMs} ms`);
    this.name = "ReleaseVerificationDeadlineError";
  }
}

/** True only for a failure to reach or hear from the database; never for a failed invariant. */
export function isTransientReleaseVerificationFailure(error: unknown) {
  if (error instanceof ReleaseVerificationDeadlineError) return true;
  if (!(error instanceof Error)) return false;
  const { code, errorCode } = error as { code?: unknown; errorCode?: unknown };
  if (typeof code === "string" && TRANSIENT_PRISMA_CODES.has(code)) return true;
  if (typeof errorCode === "string" && TRANSIENT_PRISMA_CODES.has(errorCode)) return true;
  return TRANSIENT_MESSAGE.test(error.message);
}

export type ReadOnlyReleaseVerificationOptions<T> = {
  release: string;
  /** Reads and checks; returns what the build record should report. It runs once per attempt. */
  verify: (transaction: Prisma.TransactionClient) => Promise<T>;
  /** Interactive-transaction bounds of one attempt. */
  maxWait: number;
  timeout: number;
  attempts?: number;
  retryDelayMs?: number;
  /** Defaults to `maxWait + timeout + RELEASE_VERIFICATION_DEADLINE_SLACK_MS`. */
  attemptDeadlineMs?: number;
  /** Defaults to a new client on the approved direct binding (`DIRECT_URL`) for every attempt. */
  createClient?: () => ReleaseVerificationClient;
  log?: (payload: Record<string, unknown>) => void;
};

function settleWithin<T>(work: Promise<T>, deadlineMs: number, onDeadline: () => Error) {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      // The abandoned attempt may still settle later; that must not become an unhandled rejection.
      work.catch(() => undefined);
      reject(onDeadline());
    }, deadlineMs);
    work.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function reasonOf(error: unknown) {
  if (!(error instanceof Error)) return String(error).slice(0, 160);
  const { code } = error as { code?: unknown };
  const lastLine = error.message.split("\n").map((line) => line.trim()).filter(Boolean).pop() ?? error.name;
  return `${typeof code === "string" ? `${code} ` : ""}${lastLine}`.slice(0, 160);
}

export async function runReadOnlyReleaseVerification<T>(options: ReadOnlyReleaseVerificationOptions<T>): Promise<T> {
  const { release, verify, maxWait, timeout } = options;
  const attempts = options.attempts ?? RELEASE_VERIFICATION_ATTEMPTS;
  const retryDelayMs = options.retryDelayMs ?? RELEASE_VERIFICATION_RETRY_DELAY_MS;
  const deadlineMs = options.attemptDeadlineMs ?? maxWait + timeout + RELEASE_VERIFICATION_DEADLINE_SLACK_MS;
  const createClient = options.createClient ?? (() => createCasinoMarket0025AdminClient());
  const log = options.log ?? ((payload) => console.info(JSON.stringify(payload)));

  for (let attempt = 1; ; attempt += 1) {
    const client = createClient();
    try {
      return await settleWithin(
        client.$transaction(async (transaction) => {
          await transaction.$executeRawUnsafe("SET TRANSACTION READ ONLY");
          const [transactionSafety] = await transaction.$queryRawUnsafe<Array<{ transaction_read_only: string }>>(
            "SHOW transaction_read_only",
          );
          if (transactionSafety?.transaction_read_only !== "on") {
            throw new Error(`${release}: PostgreSQL did not enforce the read-only verification transaction`);
          }
          return verify(transaction);
        }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead, maxWait, timeout }),
        deadlineMs,
        () => new ReleaseVerificationDeadlineError(release, deadlineMs),
      );
    } catch (error) {
      if (attempt >= attempts || !isTransientReleaseVerificationFailure(error)) throw error;
      log({ event: "release_verification_retry", release, attempt, nextAttempt: attempt + 1, reason: reasonOf(error) });
      await new Promise((wake) => setTimeout(wake, retryDelayMs));
    } finally {
      await settleWithin(client.$disconnect(), DISCONNECT_WAIT_MS, () => new Error("disconnect pending")).catch(() => undefined);
    }
  }
}

/**
 * Ends a verification script once everything it printed has been written. An attempt abandoned
 * at its deadline can leave a client whose connection never answers, and that client would keep
 * the process, and so the build, alive after the result is already decided (seen locally on
 * 15 October 2026 against a connection that never answers).
 */
export function exitWhenOutputIsWritten() {
  const code = Number(process.exitCode ?? 0) || 0;
  process.stdout.write("", () => {
    process.stderr.write("", () => process.exit(code));
  });
}
