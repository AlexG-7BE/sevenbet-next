/**
 * Founder, 11 Oct 2026: one wheel or trackpad gesture moves desktop Home by one screen, and it
 * has to feel deliberate. The first controller took a quiet 140ms in the wheel stream as the
 * end of a gesture. A macOS trackpad keeps sending inertia for a second or two after the
 * fingers lift, so the next swipes were swallowed whole, a slow drag with short rests ran
 * several screens, and a 3px brush moved a full one.
 *
 * This reads the stream instead of waiting for it to stop. A gesture is travel that adds up
 * (or one wheel detent), and a stream that has already moved a screen may move another only
 * when it shows fresh intent: it went quiet, turned round, or slowed down and then sped up
 * again. Inertia only ever slows down, so its tail never moves a second screen.
 *
 * A busy main thread must not look like silence or like a new swipe. While it is busy the
 * browser holds wheel events back and merges them, so one arrives late and the next carries
 * the travel of every frame that was missed. Silence is therefore counted from when the
 * previous event was handled, speed is travel over time across several events, and an event
 * that was itself held back is never the one that decides.
 */
export const HOME_WHEEL_INTENT_PX = 40;
/** A stream that opens at this size is a mouse detent or a flick, not a finger settling on the pad. */
export const HOME_WHEEL_DETENT_PX = 4;
export const HOME_WHEEL_QUIET_MS = 120;
/** Travel short of a gesture stops adding up after this long without input. */
export const HOME_WHEEL_FORGET_MS = 360;

const FRAME_MS = 1000 / 60;
const SPEED_WINDOW_MS = 64;
const SPEED_EVENTS = 16;
/** Handled this much later than the promptest event of its stream: the page was busy. */
const HELD_BACK_MS = 40;
/** Speed has to climb this far above its slowest, in px per ms, to count as rising: 4px a frame at 60Hz. */
const RISE_MARGIN = HOME_WHEEL_DETENT_PX / FRAME_MS;

export type HomeWheelSample = Pick<WheelEvent, "deltaMode" | "deltaY" | "timeStamp">;

export function createHomeWheelIntent(pageHeight: () => number) {
  let direction = 0;
  let lastAt = Number.NEGATIVE_INFINITY;
  let lastHandledAt = Number.NEGATIVE_INFINITY;
  let promptest = Number.POSITIVE_INFINITY;
  let spent = false;
  let travelled = 0;
  let peak = 0;
  let slowed = false;
  let trough = Number.POSITIVE_INFINITY;
  let rises = 0;
  const recent: Array<{ ms: number; px: number }> = [];

  const spend = () => {
    spent = true;
    travelled = 0;
    peak = 0;
    slowed = false;
    trough = Number.POSITIVE_INFINITY;
    rises = 0;
  };

  const recentTravel = () => {
    let ms = 0;
    let px = 0;
    for (let index = recent.length - 1; index >= 0 && ms < SPEED_WINDOW_MS; index -= 1) {
      ms += recent[index].ms;
      px += recent[index].px;
    }
    return { px, speed: px / Math.max(ms, FRAME_MS) };
  };

  // Clearly faster than its slowest on two of the last three events: a new swipe keeps climbing.
  const risesAgain = (speed: number) => {
    peak = Math.max(peak, speed);
    if (speed <= peak / 2) slowed = true;
    if (!slowed) return false;
    const rising = speed >= trough * 1.5 + RISE_MARGIN;
    trough = Math.min(trough, speed);
    rises = ((rises << 1) | (rising ? 1 : 0)) & 0b111;
    return rises === 0b011 || rises === 0b101 || rises === 0b110 || rises === 0b111;
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
    const since = sample.timeStamp - lastAt;
    const waited = handledAt - sample.timeStamp;
    const turned = next !== direction;
    lastAt = sample.timeStamp;
    lastHandledAt = handledAt;

    if (turned || quietFor >= HOME_WHEEL_QUIET_MS) {
      if (turned || quietFor >= HOME_WHEEL_FORGET_MS) travelled = 0;
      direction = next;
      spent = false;
      promptest = waited;
      recent.length = 0;
      recent.push({ ms: FRAME_MS, px: magnitude });
      if (magnitude >= HOME_WHEEL_DETENT_PX) {
        spend();
        return next;
      }
    } else {
      recent.push({ ms: Math.min(250, Math.max(1, since)), px: magnitude });
      if (recent.length > SPEED_EVENTS) recent.shift();
      const heldBack = waited > promptest + HELD_BACK_MS;
      promptest = Math.min(promptest, waited);
      if (spent) {
        const { px, speed } = recentTravel();
        if (heldBack || !risesAgain(speed)) return 0;
        spent = false;
        travelled = px - magnitude;
      }
    }

    travelled += magnitude;
    if (travelled < HOME_WHEEL_INTENT_PX) return 0;
    spend();
    return next;
  };
}
