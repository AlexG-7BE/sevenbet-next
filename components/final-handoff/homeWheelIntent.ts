/**
 * Founder, 11 Oct 2026: one wheel or trackpad gesture moves desktop Home by one screen, and it
 * has to feel deliberate. The first controller took a quiet 140ms in the wheel stream as the
 * end of a gesture. A macOS trackpad keeps sending inertia for a second or two after the
 * fingers lift, so the next swipes were swallowed whole, a slow drag with short rests ran
 * several screens, and a 3px brush moved a full one.
 *
 * This reads the stream instead of waiting for it to stop. A gesture is travel that adds up
 * (or one wheel detent), and a stream that has already moved a screen may move another only
 * when it shows fresh intent: it went quiet, turned round, or its events dropped and then grew
 * three times in a row. Inertia only ever shrinks, so its tail never moves a second screen,
 * and a flick made straight after another is heard while the last one is still at 60-85% of
 * its peak.
 *
 * Fresh intent is read from the size of the events, not from their timing: timestamps are
 * coarse (1ms in Safari) and bunch up, and a speed worked out from them rose where nothing
 * had. A busy main thread must not look like silence or like a new swipe either. While it is
 * busy the browser holds wheel events back and merges them, so one arrives late and the next
 * carries the travel of every frame that was missed. Silence is therefore counted from when
 * the previous event was handled, and an event that was itself held back is never part of a
 * growing run.
 */
export const HOME_WHEEL_INTENT_PX = 40;
/** A stream that opens at this size is a mouse detent or a flick, not a finger settling on the pad. */
export const HOME_WHEEL_DETENT_PX = 4;
export const HOME_WHEEL_QUIET_MS = 120;
/** Travel short of a gesture stops adding up after this long without input. */
export const HOME_WHEEL_FORGET_MS = 360;

/** Handled this much later than the promptest event of its stream: the page was busy. */
const HELD_BACK_MS = 40;
/** A new swipe over a live stream: this many events in a row, each larger than the one before, */
const GROWING_EVENTS = 3;
/** starting from an event no larger than this share of the largest since the last screen, */
const DROP_SHARE = 0.7;
/** and ending at least this much above where the run started (plus one detent). */
const GROWTH_FACTOR = 1.5;

export type HomeWheelSample = Pick<WheelEvent, "deltaMode" | "deltaY" | "timeStamp">;

export function createHomeWheelIntent(pageHeight: () => number) {
  let direction = 0;
  let lastAt = Number.NEGATIVE_INFINITY;
  let lastHandledAt = Number.NEGATIVE_INFINITY;
  let promptest = Number.POSITIVE_INFINITY;
  let spent = false;
  let travelled = 0;
  // Since the stream last moved a screen: its largest event outside the current run of growing
  // events, and that run's first event, length and travel.
  let largest = 0;
  let previous = 0;
  let runFrom = 0;
  let runLength = 0;
  let runTravel = 0;

  const restartRun = (magnitude: number) => {
    previous = magnitude;
    runFrom = magnitude;
    runLength = 0;
    runTravel = magnitude;
  };

  const spend = (magnitude: number) => {
    spent = true;
    travelled = 0;
    largest = 0;
    restartRun(magnitude);
  };

  const growsAgain = (magnitude: number) => {
    if (magnitude > previous) {
      previous = magnitude;
      runLength += 1;
      runTravel += magnitude;
    } else {
      largest = Math.max(largest, previous);
      restartRun(magnitude);
    }
    return runLength >= GROWING_EVENTS
      && runFrom <= largest * DROP_SHARE
      && magnitude >= runFrom * GROWTH_FACTOR + HOME_WHEEL_DETENT_PX;
  };

  /**
   * Returns 1 (down) or -1 (up) when this event completes a deliberate gesture, otherwise 0.
   * `handledAt` is the clock when the event reaches the page, on the same timeline as `timeStamp`.
   */
  return (sample: HomeWheelSample, handledAt = sample.timeStamp) => {
    if (sample.deltaY === 0) return 0;
    const unit = sample.deltaMode === 1 ? 16 : sample.deltaMode === 2 ? pageHeight() : 1;
    const magnitude = Math.abs(sample.deltaY) * unit;
    const next = sample.deltaY > 0 ? 1 : -1;
    const quietFor = sample.timeStamp - Math.max(lastAt, lastHandledAt);
    const waited = handledAt - sample.timeStamp;
    const turned = next !== direction;
    lastAt = sample.timeStamp;
    lastHandledAt = handledAt;

    if (turned || quietFor >= HOME_WHEEL_QUIET_MS) {
      if (turned || quietFor >= HOME_WHEEL_FORGET_MS) travelled = 0;
      direction = next;
      spent = false;
      promptest = waited;
      if (magnitude >= HOME_WHEEL_DETENT_PX) {
        spend(magnitude);
        return next;
      }
    } else {
      const heldBack = waited > promptest + HELD_BACK_MS;
      promptest = Math.min(promptest, waited);
      if (spent) {
        // A held-back event is left out of the run rather than ending it: a swipe that begins
        // while the page is busy is still heard, and merged events cannot grow one.
        if (heldBack || !growsAgain(magnitude)) return 0;
        spent = false;
        travelled = runTravel - magnitude;
      }
    }

    travelled += magnitude;
    if (travelled < HOME_WHEEL_INTENT_PX) return 0;
    spend(magnitude);
    return next;
  };
}
