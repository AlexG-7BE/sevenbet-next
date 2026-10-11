# Desktop Home moves one screen per gesture, and reads the gesture properly

**Status:** ACCEPTED

**Decision authority:** explicit Founder instruction, 11 October 2026. The report: on a MacBook trackpad Home "lags, sometimes does not scroll when it should, sometimes scrolls a lot at once". After the cause was shown: one screen per gesture is right, "только должен делать это хорошо, как у tilt https://tilt.com/". Of the three options offered he chose "as tilt does it, without the double step". The same day he compared this with a free-scrolling variant (PR #477, closed) and kept paging, with one condition: the landing "должен быть супер плавный".

This record replaces, for the fine-pointer wheel controller only, the 19 August 2026 disposition in [RFC-035](../06_RFC/RFC-035-Home-Performance-and-Motion-Polish.md) ("groups a momentum stream for 140ms … no accumulator"). The landing itself stays the browser's native smooth scroll, as RFC-035 had it. It is also an explicit exception to the frozen desktop Home: nothing on the page changes except how the wheel and the trackpad move it.

## What was wrong

The controller cancelled every vertical wheel event and started the browser's own smooth scroll to the next screen on the first pixel. It accepted the next gesture only after the wheel stream had been silent for 140ms and the landing had finished.

- **Swallowed swipes.** A macOS trackpad keeps sending inertia for one to two and a half seconds after the fingers lift. The stream is never silent in that time, so a second and a third swipe were dropped together with their own inertia.
- **Runs of screens.** A slow drag with rests longer than 140ms counted every rest as a new gesture: 144px of finger travel moved four screens.
- **No threshold.** A 3px brush of the trackpad moved a full screen.

## Decision

- **One gesture, one screen, unchanged order.** Hero, Recognition, A plan you can see, the three Mission chapters, Built from evidence, Why trust, Final CTA and the footer end.
- **A gesture is deliberate travel.** Trackpad travel has to add up to 40px, within 360ms pauses, before the page moves. A stream that opens with 4px or more in one event (a mouse detent, a flick) moves it at once.
- **Inertia never moves a second screen.** After a stream has moved a screen it can move another only on fresh intent: it went silent for 120ms, it turned round, or its events dropped and then grew three times in a row. Inertia only shrinks.
- **The next swipe is heard at once.** A swipe made while the previous one's inertia is still arriving is recognised by its rising speed. Made while a screen is still travelling, it follows that screen; only one is held this way.
- **Turning back is immediate.** The opposite gesture retargets the page mid-travel.
- **The landing is the browser's own smooth scroll.** It runs off the main thread, so a busy page cannot stall it. A landing moved by script, 750ms on its own curve, was built first and rejected by the Founder as rough: measured at Retina resolution with the GPU, it froze for 50–150ms at the start or the end of most landings, wherever the main thread was busy, while the browser's own scroll drew every frame. The cost is that the duration and the curve are the browser's (about half a second in Chromium).
- **The first chapter is pinned, not chased.** It grows out of "A plan you can see" over one screen. It used to be held in place by a transform that followed the scroll position, a frame behind a scroll the browser runs off the main thread. It now sits one screen earlier in the flow and sticky positioning holds it. Where the browser supports scroll-driven animations (Chromium, Safari 26) its growth is one of them, with the script's own curve, so it too runs off the main thread; elsewhere the script scales it as before. The script keeps the fade and the corners. Stop positions and every resting frame are unchanged.
- **A chapter is one layer, and nothing in it changes while the page moves.** With the landing smooth, the Founder still found the chapter screens (01–03 to 08–10) rough in both directions, and after a first round of fixes rougher still when flicking fast: "they have to be exactly like the others". Measured in his own Chrome 154 at his full window (1792×860 CSS px at 2x), every other screen costs the GPU one pass a frame; a chapter cost up to 3.3. Each chapter was three or four full-screen layers (its own box, the photo, a gradient with the words, the progress dot) under rounded corners, and rounded corners over several layers force an off-screen pass. Now:
  - the photo is no longer lifted onto a layer of its own, so a chapter is a single picture;
  - the words of the first chapter are part of that picture from the start, instead of fading in 450ms after it has opened; they grow with the card;
  - each chapter shows its own place on the progress track (first, middle, last), instead of one dot sliding under the reader's scroll;
  - corners change only while the page rests on a chapter, or once the chapter is out of sight: a corner change redraws the whole picture. A chapter passed without stopping keeps its rounded corners until the page rests;
  - the first chapter grows in step with the scroll, with no curve of its own. With a smoothstep on top of the browser's own ease, nothing showed for 150ms and then the card went from 29% to 89% in another 150ms;
  - a waiting first chapter is drawn at 0.001 opacity, so it is rasterised ahead; a sheet at rest over another is 0.999 opaque, so the one beneath stays rasterised for the way back up;
  - on a desktop the three chapter photos are fetched and decoded while the reader is still on the opening screens, instead of lazily on arrival.
- **Flicks made one straight after another are each heard.** A flick every 180–280ms starts while the last one's inertia is still at 60–85% of its peak. The reader waited for the stream to slow to half its peak, so such flicks were swallowed: fourteen fast flicks moved one screen. It now reads the size of the events instead of a speed worked out from their timestamps: fresh intent is three events in a row, each larger than the one before, starting from a drop to 70% or less of the largest since the last screen. Timestamps are coarse (1ms in Safari) and bunch up; a speed computed from them rose where nothing had.
- **A list that scrolls on its own keeps its wheel.** The language menu holds twelve languages in a 440px list. The controller cancelled the wheel over it too, so the list could not be scrolled on Home and the page moved behind it. The wheel now scrolls the list, and at the list's end the page stays where it is.
- **A busy page is not a pause.** When the main thread is busy the browser holds wheel events back and merges them. Silence is counted from when the previous event was handled, and an event that was itself held back is never part of a growing run.

## Unchanged

- Native `scroll-snap-type: y mandatory` on fine pointers, `y proximity` on coarse pointers, none under reduced motion and below 760px.
- The native scrollbar and the keyboard: either takes the page over mid-landing, as with any browser scroll.
- Phones, touch, reduced motion, every other route.
- No idle animation frame and no timer; nothing animates the scroll position from script.

## Evidence

The same modelled gestures were replayed in headless Chromium and WebKit at 1440×900 against a local build, before and after, and against tilt.com.

| Gesture | Before | After | tilt.com |
| --- | --- | --- | --- |
| 3px brush | 1 screen | none | none |
| One swipe with inertia | 1 screen | 1 screen | 1 screen |
| Two swipes, the second 350ms after lifting | 1 screen | 2 screens | 2 screens |
| Three such swipes | 1 screen | 3 screens | 2 screens |
| One strong swipe, 2.5s of inertia | 1 screen | 1 screen | 2 screens |
| Slow drag with rests, 144px | 4 screens | 2 screens | 1 screen |
| Mouse wheel, one detent | 1 screen | 1 screen | 1 screen |
| Swipe down, then up at once | back to start | back to start | back to start |

- **DETECTED:** Chromium and WebKit give the same landings after the change.
- **DETECTED:** nine landings in a row at 2880×1800 with the GPU, frames the compositor drew: the script-driven landing had a gap of 34–156ms in seven of nine; the browser's own smooth scroll had none above 30ms.
- **DETECTED, on the Founder's own display** (16-inch MacBook Pro, 3072×1920, Chromium window, charging): sixteen landings down and up. Before the chapter changes every chapter landing had two to four late frames, up to 82ms, and no other landing had any. After them, across two passes of sixteen, four landings had a single frame of 26–35ms and the rest drew every frame.
- **DETECTED:** on battery at or below 20% the same Mac draws every landing at about 30 frames a second in any build: the browser's energy saver caps the frame rate. Nothing on the page can change that.
- **DETECTED, fast flicks in the Founder's Chrome 154** (1792×860 at 2x, a flick every 280ms, first pass down the page, profile with a warm GPU cache): before the single-layer chapters, Plan → 01–03 and 01–03 → 04–07 had 6 late frames each, up to 42ms, 3 frames presented with missing content and 8 dropped, at 1.9–3.3 GPU passes a frame; the screens without photos had 0–1. After: 0 late frames, 0 with missing content and 0 dropped on every stretch in both directions, at 1.0 passes a frame or fewer, also with a flick every 220ms.
- **DETECTED:** earlier measurements in this record were taken with one gesture every 1.25s in a 1440×873 window, which is 40% fewer pixels than his window and leaves the browser idle time to prepare the next chapter. They missed what he saw.
- **DETECTED:** with wheel events held back for up to 396ms and 154 events merged into 116, a strong swipe still moved one screen.
- **UNKNOWN:** the streams are models of a trackpad (a ramp under the fingers, then decaying inertia), not recordings from the Founder's MacBook, and the landings above were started by a scripted wheel. The feel is his to confirm by hand.

Tests: `tests/home-performance.test.ts` replays wheel streams through `components/final-handoff/homeWheelIntent.ts` (inertia of any length, swipes over live inertia, brushes, mouse detents, held-back and unevenly timed events). `tests/home-performance-browser.spec.ts` checks the landing, the brush, a strong swipe, a second swipe over inertia, a key pressed mid-landing, the pinned first chapter, the chapters' still parts and corners, the photos warmed ahead and the language menu, next to the existing adjacent-landing sequence.

## Tuning it

`HOME_WHEEL_INTENT_PX`, `HOME_WHEEL_DETENT_PX`, `HOME_WHEEL_QUIET_MS` and `HOME_WHEEL_FORGET_MS` in `homeWheelIntent.ts` are the thresholds above. The duration of a landing is the browser's and cannot be set; a slower glide would mean moving the screens as GPU layers, as tilt.com does, which is a rebuild of the page's scrolling.
