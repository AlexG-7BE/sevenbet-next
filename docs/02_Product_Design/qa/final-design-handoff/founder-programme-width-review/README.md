# Founder Programme and Width Review

- Renderer: **REAL_RUNTIME** (the normal React route and `ProgramAiExperience`; no Programme `HandoffPage`).
- Legacy Programme public reachability: **NONE**. `ActiveControlProgramme` remains non-public legacy code.
- Standard tokens: `--site-gutter: clamp(24px, 5vw, 72px)`, `--site-content-max: 1312px`, `--site-wide-max: 1440px`, `--site-reading-max: 760px`, and `--site-content-width`.
- Expected standard outer edges: 1440 → 72px; 1024 → 51.2px; 430/390 → 24px.
- Exceptions: WIDE/PHOTOGRAPHIC, READING, FOCUSED, FULL-BLEED and OVERLAY are intentional inner/section classifications. They do not replace the standard site chrome or Programme outer frame.
- The six `*-grid-1440.webp` images use the same magenta 72px / 1368px guide lines.

## Route audit

| Route | Classification | Viewport | Left edge | Right edge | Overflow |
| --- | --- | ---: | ---: | ---: | --- |
| / | FULL-BLEED + WIDE/PHOTOGRAPHIC | 1440 | 72.0 | 72.0 | PASS |
| /10-steps | FULL-BLEED + STANDARD | 1440 | 72.0 | 72.0 | PASS |
| /program | STANDARD + FOCUSED | 1440 | 72.0 | 72.0 | PASS |
| /login | FOCUSED | 1440 | 72.0 | 72.0 | PASS |
| /best-offers | STANDARD | 1440 | 72.0 | 72.0 | PASS |
| /casinos | STANDARD | 1440 | 72.0 | 72.0 | PASS |
| /casino/demo-northstar | STANDARD + WIDE/PHOTOGRAPHIC | 1440 | 72.0 | 72.0 | PASS |
| /bonuses | STANDARD | 1440 | 72.0 | 72.0 | PASS |
| /bonus-guide | READING | 1440 | 72.0 | 72.0 | PASS |
| /learn | STANDARD | 1440 | 72.0 | 72.0 | PASS |
| /learn/casino-bonuses/welcome-bonus-terms | READING + WIDE/PHOTOGRAPHIC | 1440 | 72.0 | 72.0 | PASS |
| /responsible-gambling | STANDARD + FULL-BLEED | 1440 | 72.0 | 72.0 | PASS |
| /help | STANDARD + FULL-BLEED | 1440 | 72.0 | 72.0 | PASS |
| /methodology | STANDARD | 1440 | 72.0 | 72.0 | PASS |
| /about | STANDARD + FULL-BLEED | 1440 | 72.0 | 72.0 | PASS |
| /faq | READING | 1440 | 72.0 | 72.0 | PASS |
| /affiliate-disclosure | READING | 1440 | 72.0 | 72.0 | PASS |
| /contact | STANDARD + FOCUSED | 1440 | 72.0 | 72.0 | PASS |
| /privacy | READING | 1440 | 72.0 | 72.0 | PASS |
| /terms | READING | 1440 | 72.0 | 72.0 | PASS |
| / | FULL-BLEED + WIDE/PHOTOGRAPHIC | 1024 | 51.2 | 51.2 | PASS |
| /10-steps | FULL-BLEED + STANDARD | 1024 | 51.2 | 51.2 | PASS |
| /program | STANDARD + FOCUSED | 1024 | 51.2 | 51.2 | PASS |
| /login | FOCUSED | 1024 | 51.2 | 51.2 | PASS |
| /best-offers | STANDARD | 1024 | 51.2 | 51.2 | PASS |
| /casinos | STANDARD | 1024 | 51.2 | 51.2 | PASS |
| /casino/demo-northstar | STANDARD + WIDE/PHOTOGRAPHIC | 1024 | 51.2 | 51.2 | PASS |
| /bonuses | STANDARD | 1024 | 51.2 | 51.2 | PASS |
| /bonus-guide | READING | 1024 | 51.2 | 51.2 | PASS |
| /learn | STANDARD | 1024 | 51.2 | 51.2 | PASS |
| /learn/casino-bonuses/welcome-bonus-terms | READING + WIDE/PHOTOGRAPHIC | 1024 | 51.2 | 51.2 | PASS |
| /responsible-gambling | STANDARD + FULL-BLEED | 1024 | 51.2 | 51.2 | PASS |
| /help | STANDARD + FULL-BLEED | 1024 | 51.2 | 51.2 | PASS |
| /methodology | STANDARD | 1024 | 51.2 | 51.2 | PASS |
| /about | STANDARD + FULL-BLEED | 1024 | 51.2 | 51.2 | PASS |
| /faq | READING | 1024 | 51.2 | 51.2 | PASS |
| /affiliate-disclosure | READING | 1024 | 51.2 | 51.2 | PASS |
| /contact | STANDARD + FOCUSED | 1024 | 51.2 | 51.2 | PASS |
| /privacy | READING | 1024 | 51.2 | 51.2 | PASS |
| /terms | READING | 1024 | 51.2 | 51.2 | PASS |
| / | FULL-BLEED + WIDE/PHOTOGRAPHIC | 430 | 24.0 | 24.0 | PASS |
| /10-steps | FULL-BLEED + STANDARD | 430 | 24.0 | 24.0 | PASS |
| /program | STANDARD + FOCUSED | 430 | 24.0 | 24.0 | PASS |
| /login | FOCUSED | 430 | 24.0 | 24.0 | PASS |
| /best-offers | STANDARD | 430 | 24.0 | 24.0 | PASS |
| /casinos | STANDARD | 430 | 24.0 | 24.0 | PASS |
| /casino/demo-northstar | STANDARD + WIDE/PHOTOGRAPHIC | 430 | 24.0 | 24.0 | PASS |
| /bonuses | STANDARD | 430 | 24.0 | 24.0 | PASS |
| /bonus-guide | READING | 430 | 24.0 | 24.0 | PASS |
| /learn | STANDARD | 430 | 24.0 | 24.0 | PASS |
| /learn/casino-bonuses/welcome-bonus-terms | READING + WIDE/PHOTOGRAPHIC | 430 | 24.0 | 24.0 | PASS |
| /responsible-gambling | STANDARD + FULL-BLEED | 430 | 24.0 | 24.0 | PASS |
| /help | STANDARD + FULL-BLEED | 430 | 24.0 | 24.0 | PASS |
| /methodology | STANDARD | 430 | 24.0 | 24.0 | PASS |
| /about | STANDARD + FULL-BLEED | 430 | 24.0 | 24.0 | PASS |
| /faq | READING | 430 | 24.0 | 24.0 | PASS |
| /affiliate-disclosure | READING | 430 | 24.0 | 24.0 | PASS |
| /contact | STANDARD + FOCUSED | 430 | 24.0 | 24.0 | PASS |
| /privacy | READING | 430 | 24.0 | 24.0 | PASS |
| /terms | READING | 430 | 24.0 | 24.0 | PASS |
| / | FULL-BLEED + WIDE/PHOTOGRAPHIC | 390 | 24.0 | 24.0 | PASS |
| /10-steps | FULL-BLEED + STANDARD | 390 | 24.0 | 24.0 | PASS |
| /program | STANDARD + FOCUSED | 390 | 24.0 | 24.0 | PASS |
| /login | FOCUSED | 390 | 24.0 | 24.0 | PASS |
| /best-offers | STANDARD | 390 | 24.0 | 24.0 | PASS |
| /casinos | STANDARD | 390 | 24.0 | 24.0 | PASS |
| /casino/demo-northstar | STANDARD + WIDE/PHOTOGRAPHIC | 390 | 24.0 | 24.0 | PASS |
| /bonuses | STANDARD | 390 | 24.0 | 24.0 | PASS |
| /bonus-guide | READING | 390 | 24.0 | 24.0 | PASS |
| /learn | STANDARD | 390 | 24.0 | 24.0 | PASS |
| /learn/casino-bonuses/welcome-bonus-terms | READING + WIDE/PHOTOGRAPHIC | 390 | 24.0 | 24.0 | PASS |
| /responsible-gambling | STANDARD + FULL-BLEED | 390 | 24.0 | 24.0 | PASS |
| /help | STANDARD + FULL-BLEED | 390 | 24.0 | 24.0 | PASS |
| /methodology | STANDARD | 390 | 24.0 | 24.0 | PASS |
| /about | STANDARD + FULL-BLEED | 390 | 24.0 | 24.0 | PASS |
| /faq | READING | 390 | 24.0 | 24.0 | PASS |
| /affiliate-disclosure | READING | 390 | 24.0 | 24.0 | PASS |
| /contact | STANDARD + FOCUSED | 390 | 24.0 | 24.0 | PASS |
| /privacy | READING | 390 | 24.0 | 24.0 | PASS |
| /terms | READING | 390 | 24.0 | 24.0 | PASS |

## Voice-first entry

- /program: renderer REAL_RUNTIME; voice PASS; text fallback PASS; legacy NONE.
- /program?entry=start: renderer REAL_RUNTIME; voice PASS; text fallback PASS; legacy NONE.
- Home CTA: renderer REAL_RUNTIME; voice PASS; text fallback PASS; legacy NONE.
- 10 Steps CTA: renderer REAL_RUNTIME; voice PASS; text fallback PASS; legacy NONE.
