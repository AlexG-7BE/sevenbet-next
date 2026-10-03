import { Pool, type PoolClient, type PoolConfig } from "pg";

/**
 * Failures while a new connection is being opened, before any statement is sent. The Prisma
 * Postgres pooled endpoint answers "Failed to connect to upstream database" when it cannot reach
 * the database at that moment; the engine reported the same as P1001 "Can't reach database
 * server" (over 1,000 Production log lines in 72 h, 3 October 2026), and the same request
 * succeeded seconds later. "Connection terminated due to connection timeout" is pg's word for a
 * new connection that took longer than `connectionTimeoutMillis` to open (the first error on
 * Production after the driver change, 3 October 2026, 06:49 UTC); it is retried too. Waiting for
 * a free pooled connection ("timeout exceeded when trying to connect") is not.
 */
const TRANSIENT_CONNECT_FAILURE = /upstream database|ECONNRESET|ECONNREFUSED|EPIPE|EAI_AGAIN|Connection terminated unexpectedly|Connection terminated due to connection timeout/i;

export const CONNECT_RETRY_DELAY_MS = 200;
/** Slack over the idle timeout before an idle client counts as having slept through it. */
export const STALE_IDLE_GRACE_MS = 1_000;

const IDLE_SINCE = Symbol("idleSince");
type TrackedClient = PoolClient & { [IDLE_SINCE]?: number };

export function isTransientConnectFailure(error: unknown) {
  if (!(error instanceof Error)) return false;
  const code = (error as { code?: unknown }).code;
  return TRANSIENT_CONNECT_FAILURE.test(`${error.message} ${typeof code === "string" ? code : ""}`);
}

type ConnectCallback = (error: Error | undefined, client: PoolClient | undefined, done: (release?: unknown) => void) => void;

/**
 * The runtime `pg` pool (Founder, 3 October 2026). Two guards around handing out a connection:
 *
 * - **Stale idle clients are dropped.** An idle client is closed by its idle timer. One that is
 *   still in the pool well past that timeout can only have slept through it: Fluid compute froze
 *   the instance, and the socket behind it is likely dead (the P2024 / "Timed out fetching a new
 *   connection" pattern at one request a minute). Such a client is destroyed and the next one
 *   taken, up to a fresh connection.
 * - **A connection that fails or stalls while opening is opened once more**, after 200 ms.
 *   Nothing has run on it yet, so the retry cannot repeat a statement. A full pool ("timeout
 *   exceeded when trying to connect") is not retried; with the 3 s connect bound a request waits
 *   at most about 6 s.
 */
export class ReconnectingPool extends Pool {
  constructor(config?: PoolConfig) {
    super(config);
    this.on("release", (_error: Error | undefined, client: PoolClient) => {
      (client as TrackedClient)[IDLE_SINCE] = Date.now();
    });
  }

  private async takeLiveClient(): Promise<PoolClient> {
    const idleTimeout = this.options.idleTimeoutMillis;
    for (let attempt = 0; ; attempt++) {
      const client = (await super.connect()) as TrackedClient;
      const idleSince = client[IDLE_SINCE];
      const slept = idleTimeout && idleSince !== undefined && Date.now() - idleSince > idleTimeout + STALE_IDLE_GRACE_MS;
      if (!slept || attempt >= (this.options.max ?? 10)) return client;
      client.release(true);
    }
  }

  connect(): Promise<PoolClient>;
  connect(callback: ConnectCallback): void;
  connect(callback?: ConnectCallback): Promise<PoolClient> | void {
    const opened = this.takeLiveClient().catch(async (error: unknown) => {
      if (this.ending || !isTransientConnectFailure(error)) throw error;
      console.warn("prisma_pg_connect_retry", { message: (error as Error).message.slice(0, 160) });
      await new Promise((resolve) => setTimeout(resolve, CONNECT_RETRY_DELAY_MS));
      return this.takeLiveClient();
    });
    if (!callback) return opened;
    opened.then(
      (client) => callback(undefined, client, (release) => client.release(release as boolean | Error | undefined)),
      (error: Error) => callback(error, undefined, () => {}),
    );
  }
}
