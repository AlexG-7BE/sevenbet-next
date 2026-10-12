import {
  PENDING_CLAIM_FRESH_FOR_GOOGLE_MS,
  pendingClaimIsFresh,
} from "@/lib/programme/program-ai/pending-claim-client";

/**
 * Founder decision, 12 Oct 2026: a press on "Continue with Google" leaves for
 * Google at once. While the screen with the button is on, the Google address
 * (the same sign-in request, answered without a redirect) and the pending claim
 * are kept ready behind it. Nothing is sent to Google before the press: the
 * address is only held in memory.
 */

/**
 * How long a sign-in started on this site can be finished at Google. Better
 * Auth 1.7.1 with a database keeps the signed `state` cookie for 300 seconds
 * (the stored state row and its payload for 10 minutes); the auth configuration
 * sets no other value. `tests/google-press.test.ts` reads the installed library
 * and fails if this changes.
 */
export const GOOGLE_SIGN_IN_STATE_LIFETIME_MS = 5 * 60 * 1000;

/**
 * A prepared address is used only this long, so the person keeps at least four
 * of those five minutes at Google. It is renewed sooner than that.
 */
export const PREPARED_GOOGLE_ADDRESS_FRESH_FOR_MS = 60 * 1000;
export const PREPARED_GOOGLE_ADDRESS_RENEW_AFTER_MS = 45 * 1000;

/** The claim is renewed before a Google press would find it too old to reuse. */
export const PENDING_CLAIM_RENEW_FOR_GOOGLE_AFTER_MS = 4 * 60 * 1000;

/** How often an open, visible screen looks at what is due. Looking sends nothing. */
export const GOOGLE_PREPARATION_CHECK_EVERY_MS = 5 * 1000;

/** After a failed attempt the next one waits; the press meanwhile works as it always did. */
export const GOOGLE_PREPARATION_RETRY_AFTER_MS = 30 * 1000;

/** A screen nobody has touched for this long stops preparing until it is touched again. */
export const GOOGLE_PREPARATION_IDLE_AFTER_MS = 15 * 60 * 1000;

/** Still on the page this long after a press: the button comes back with the error text. */
export const GOOGLE_PRESS_NOT_LEFT_AFTER_MS = 10 * 1000;

/**
 * The address from a sign-in request that asked for no redirect. Anything else
 * (a refusal, a redirecting answer, a non-web address) is not an address to hold.
 */
export function preparedGoogleAddress(value: unknown): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const { url, redirect } = value as { url?: unknown; redirect?: unknown };
  if (redirect !== false || typeof url !== "string") return null;
  try {
    const { protocol } = new URL(url);
    return protocol === "https:" || protocol === "http:" ? url : null;
  } catch {
    return null;
  }
}

export function preparedGoogleAddressIsFresh(preparedAt: unknown, now = Date.now()) {
  return typeof preparedAt === "number"
    && Number.isFinite(preparedAt)
    && preparedAt <= now
    && now - preparedAt < PREPARED_GOOGLE_ADDRESS_FRESH_FOR_MS;
}

/** The pending claim a Google return must find, and the way to make it again. */
export type GooglePressClaim = {
  /** When the claim was last made, as remembered for the journey. */
  readyAt: unknown;
  /** Makes the claim and remembers when. Rejects when it could not be made. */
  make: () => Promise<void>;
};

export type GooglePreparationSource = {
  /**
   * Asks the server for the Google address without leaving the page. Resolves
   * with the sign-in answer, or with null when there is nothing to ask with.
   */
  prepareAddress: () => Promise<unknown>;
  /** Null when this sign-up needs no claim (it starts without a Starting Point). */
  claim: () => GooglePressClaim | null;
  now?: () => number;
};

export type GooglePreparation = ReturnType<typeof createGooglePreparation>;

/**
 * Keeps the Google address and the claim ready while a screen is on, and tells
 * a press whether it can leave at once. It owns no timer and no browser API:
 * the hook calls `check` on a timer and reports what the tab and the person do.
 *
 * The browser keeps one sign-in state per site, so only the newest address is
 * valid. That is why address requests never overlap, why a tab that was hidden
 * forgets its address (another tab may have asked for a newer one), and why a
 * press waits for a request in flight instead of leaving beside it.
 */
export function createGooglePreparation(source: GooglePreparationSource) {
  const now = source.now ?? Date.now;
  let address: { url: string; at: number } | null = null;
  let addressFlight: Promise<void> | null = null;
  let addressFailedAt: number | null = null;
  let claimFlight: Promise<void> | null = null;
  let claimFailedAt: number | null = null;
  // An address asked for before the tab was hidden or a press was released is not kept.
  let generation = 0;
  let running = false;
  let visible = true;
  let held = false;
  let pressed = false;
  let activeAt = now();

  const rested = (failedAt: number | null, at: number) => failedAt === null
    || at < failedAt
    || at - failedAt >= GOOGLE_PREPARATION_RETRY_AFTER_MS;

  function forgetAddress() {
    generation += 1;
    address = null;
    addressFailedAt = null;
  }

  function renewAddress() {
    const asked = generation;
    // Counted from before the request, so the address is never taken for younger than it is.
    const at = now();
    addressFlight = (async () => {
      try {
        const url = preparedGoogleAddress(await source.prepareAddress());
        if (!url) throw new Error("GOOGLE_ADDRESS_NOT_PREPARED");
        if (asked === generation) { address = { url, at }; addressFailedAt = null; }
      } catch {
        // A failed request may still have replaced the sign-in state: the older address goes too.
        if (asked === generation) { address = null; addressFailedAt = now(); }
      } finally {
        addressFlight = null;
        check();
      }
    })();
  }

  function renewClaim(claim: GooglePressClaim) {
    claimFlight = (async () => {
      try {
        await claim.make();
        claimFailedAt = null;
      } catch {
        claimFailedAt = now();
      } finally {
        claimFlight = null;
      }
    })();
  }

  /** Starts whatever is due. Sends nothing while hidden, held, pressed, idle or stopped. */
  function check() {
    if (!running || !visible || held || pressed) return;
    const at = now();
    if (at - activeAt >= GOOGLE_PREPARATION_IDLE_AFTER_MS) return;
    const claim = source.claim();
    if (claim && !claimFlight && rested(claimFailedAt, at)
      && !pendingClaimIsFresh(claim.readyAt, PENDING_CLAIM_RENEW_FOR_GOOGLE_AFTER_MS, at)) renewClaim(claim);
    if (!addressFlight && rested(addressFailedAt, at)
      && (!address || address.at > at || at - address.at >= PREPARED_GOOGLE_ADDRESS_RENEW_AFTER_MS)) renewAddress();
  }

  /** The address a press may leave with now, or null when the press must do the work itself. */
  function readyAddress() {
    if (!address || addressFlight || claimFlight) return null;
    const at = now();
    if (!preparedGoogleAddressIsFresh(address.at, at)) return null;
    const claim = source.claim();
    // Google leaves the page before the claim is redeemed, so it must have most of its time left.
    if (claim && !pendingClaimIsFresh(claim.readyAt, PENDING_CLAIM_FRESH_FOR_GOOGLE_MS, at)) return null;
    return address.url;
  }

  return {
    check,
    /** The screen is on. A press already under way stays in charge until it is released. */
    start(tabVisible = true) {
      running = true;
      visible = tabVisible;
      activeAt = now();
      check();
    },
    /** The screen was left: nothing is kept and nothing more is asked. */
    stop() {
      running = false;
      forgetAddress();
    },
    /** The tab was hidden. Requests in flight finish; no new one starts. */
    hide() {
      visible = false;
    },
    /** The tab is visible again, or the page came back from the browser's page cache. */
    resume() {
      visible = true;
      activeAt = now();
      forgetAddress();
      check();
    },
    /** The person did something on the page. */
    touch() {
      const wasIdle = now() - activeAt >= GOOGLE_PREPARATION_IDLE_AFTER_MS;
      activeAt = now();
      if (wasIdle) check();
    },
    /** Another action (email, saving) is in flight: nothing new starts beside it. */
    hold(on: boolean) {
      held = on;
      if (!on) check();
    },
    /** A press on Google. Nothing new starts after it; returns the address if all is ready. */
    press() {
      pressed = true;
      return readyAddress();
    },
    /** Resolves when nothing is in flight, with the address if all is ready by then. */
    async settled() {
      while (addressFlight || claimFlight) await Promise.all([addressFlight, claimFlight]);
      return readyAddress();
    },
    /** The press did not leave the page: forget the address it may have used and go on. */
    release() {
      pressed = false;
      forgetAddress();
      check();
    },
  };
}
