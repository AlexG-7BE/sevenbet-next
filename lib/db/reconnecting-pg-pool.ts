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
/**
 * How long a new connection may stay unopened before a second one is opened beside it (Founder,
 * 12 October 2026). 1 s: a connect from iad1 normally takes well under a second, and TCP itself
 * resends a lost first packet after 1 s, so an open still pending at 1 s has lost a packet or is
 * stuck at the pooled endpoint. The first open is not cut short; it keeps its full connect bound.
 */
export const CONNECT_SECOND_OPEN_AFTER_MS = 1_000;
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
 * - **A connection still unopened after 1 s gets a second one opened beside it** (Founder,
 *   12 October 2026). Production, 12 October, 11:03:08 UTC: a Programme action waited 3 s for an
 *   open that stalled, then 3 s for the repeat, which stalled too, and answered 500 after 6.3 s.
 *   In the Production log 8–15 requests an hour wait out a stalled open (sampled hours,
 *   4–12 October), and for most of them the repeat at 3.2 s opens at once, which points to a
 *   stall of one connection attempt rather than of the whole endpoint; why an attempt stalls is
 *   not known. The second open therefore starts at 1 s instead of after the first has died at
 *   3 s; whichever opens first serves the request, and one that opens later stays in the pool
 *   as an idle client. Nothing else changes: the first open keeps its 3 s, the repeat after a
 *   failed open stays, so a request gets up to three opens (at 0 s, 1 s and 3.2 s) and still
 *   ends by about 6 s. The second open is skipped when it would take the pool's last free
 *   slot, so a one-connection pool (local, CI) and a busy instance behave as before. Opening a
 *   connection sends no statement, so no query can run twice.
 */
export class ReconnectingPool extends Pool {
  constructor(config?: PoolConfig) {
    super(config);
    this.on("release", (_error: Error | undefined, client: PoolClient) => {
      (client as TrackedClient)[IDLE_SINCE] = Date.now();
    });
  }

  /** An idle client to hand over, or room to open a connection and still leave one slot free. */
  private hasRoomForSecondOpen() {
    return this.idleCount > 0 || this.totalCount + 1 < (this.options.max ?? 10);
  }

  /** The open with its repeat after a failure, plus the second open beside a slow first one. */
  private openLiveClient(): Promise<PoolClient> {
    return new Promise<PoolClient>((resolve, reject) => {
      let handedOut = false;
      let secondOpen: Promise<void> | undefined;
      let secondOpenTimer: ReturnType<typeof setTimeout> | undefined = undefined;
      const handOut = (client: PoolClient) => {
        if (handedOut) {
          // The request already has its connection: this one is kept as an idle client.
          client.release();
          return;
        }
        handedOut = true;
        clearTimeout(secondOpenTimer);
        resolve(client);
      };
      secondOpenTimer = setTimeout(() => {
        if (handedOut || this.ending || !this.hasRoomForSecondOpen()) return;
        console.warn("prisma_pg_connect_second_open", { afterMs: CONNECT_SECOND_OPEN_AFTER_MS });
        // Its own failure is not the request's: the first open and its repeat decide the error.
        secondOpen = this.takeLiveClient().then(handOut, () => undefined);
      }, CONNECT_SECOND_OPEN_AFTER_MS);
      this.takeLiveClient()
        .catch(async (error: unknown) => {
          if (handedOut || this.ending || !isTransientConnectFailure(error)) throw error;
          console.warn("prisma_pg_connect_retry", { message: (error as Error).message.slice(0, 160) });
          await new Promise((wake) => setTimeout(wake, CONNECT_RETRY_DELAY_MS));
          if (handedOut) throw error;
          return this.takeLiveClient();
        })
        .then(handOut, async (error: unknown) => {
          clearTimeout(secondOpenTimer);
          // A second open still on its way may yet serve the request.
          await secondOpen;
          if (!handedOut) reject(error);
        });
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
    const opened = this.openLiveClient();
    if (!callback) return opened;
    opened.then(
      (client) => callback(undefined, client, (release) => client.release(release as boolean | Error | undefined)),
      (error: Error) => callback(error, undefined, () => {}),
    );
  }
}
