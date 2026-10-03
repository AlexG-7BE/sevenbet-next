import { Pool, type PoolClient } from "pg";

/**
 * Failures while a new connection is being opened, before any statement is sent. The Prisma
 * Postgres pooled endpoint answers "Failed to connect to upstream database" when it cannot reach
 * the database at that moment; the engine reported the same as P1001 "Can't reach database
 * server" (over 1,000 Production log lines in 72 h, 3 October 2026), and the same request
 * succeeded seconds later.
 */
const TRANSIENT_CONNECT_FAILURE = /upstream database|ECONNRESET|ECONNREFUSED|EPIPE|EAI_AGAIN|Connection terminated unexpectedly/i;

export const CONNECT_RETRY_DELAY_MS = 200;

export function isTransientConnectFailure(error: unknown) {
  if (!(error instanceof Error)) return false;
  const code = (error as { code?: unknown }).code;
  return TRANSIENT_CONNECT_FAILURE.test(`${error.message} ${typeof code === "string" ? code : ""}`);
}

type ConnectCallback = (error: Error | undefined, client: PoolClient | undefined, done: (release?: unknown) => void) => void;

/**
 * A `pg` pool that opens a new connection a second time, once, when the first attempt fails
 * transiently. Only connection opening is retried: nothing has run on the connection yet, so the
 * retry cannot repeat a statement. A pool timeout ("timeout exceeded when trying to connect") or
 * a slow connect cut off by `connectionTimeoutMillis` is not retried, so the wait stays bounded.
 */
export class ReconnectingPool extends Pool {
  connect(): Promise<PoolClient>;
  connect(callback: ConnectCallback): void;
  connect(callback?: ConnectCallback): Promise<PoolClient> | void {
    const opened = super.connect().catch(async (error: unknown) => {
      if (this.ending || !isTransientConnectFailure(error)) throw error;
      console.warn("prisma_pg_connect_retry", { message: (error as Error).message.slice(0, 160) });
      await new Promise((resolve) => setTimeout(resolve, CONNECT_RETRY_DELAY_MS));
      return super.connect();
    });
    if (!callback) return opened;
    opened.then(
      (client) => callback(undefined, client, (release) => client.release(release as boolean | Error | undefined)),
      (error: Error) => callback(error, undefined, () => {}),
    );
  }
}
