# Founder Interaction Review

These frames are captured from the normal React runtime. The deterministic `visualFixture` query changes data only; it does not change the renderer, component tree, CSS, or interactions. Casino Review uses `CasinoProfile`, Bonuses uses the bonus-directory runtime, comparison uses `ContextualComparison`, and Programme uses `ProgramAiExperience`.

Static screenshots cannot prove motion acceptance. The motion, scroll reversal, dialog, reduced-motion and fail-visible results are enforced separately by `tests/founder-interaction-browser.spec.ts`.

| INTERACTION | TRIGGER | EXPECTED RESULT | ACTUAL RESULT | PASS / FAIL | RUNTIME COMPONENT |
| --- | --- | --- | --- | --- | --- |
| Casino Review hero | Initial route load | Premium decision hero, photo/dark header and real availability state | Real profile renderer opens with the shared header and governed action state | PASS | `CasinoProfile` |
| Casino Review section progression | Scroll through overview, offer, editorial, score and final action | Sections reveal, decision bar stays below the global header, active link and header theme follow the current region | Scroll and reverse-scroll assertions pass; score bars finish visible | PASS | `CasinoProfileInteractions` + `SiteMotionController` |
| Casino Review FAQ | Activate the native summary twice | Accordion closes and reopens without moving focus or hiding content | Native `details` state changes and the handoff timing is applied | PASS | `CasinoProfile` |
| Bonuses chameleon header | Scroll dark hero → light shortlist → cream directory → dark calculator, then reverse | One shared header changes visual treatment in both directions without changing geometry | Exact theme attributes reverse correctly | PASS | `PublicHeaderThemeController` |
| Bonuses selectors and calculator | Change a shortlist tab and deterministic calculator inputs | Selection state updates; calculations change without animated or fabricated precision | Selected state and €70,000 effective turnover are verified | PASS | `CuratedBonusShortlist` + `BonusCalculator` |
| Contextual comparison | Select first, second and third casinos; close and reopen | Tray appears after one, sheet auto-opens after two, selection caps at three | Tray/sheet state, reopen and cap assertions pass | PASS | `ContextualComparison` |
| Programme recording | Enter Mission 01, grant the task authority and activate microphone | Canonical voice-first intake enters recording and shows the approved waveform | Recording state and waveform are visible in the real Programme renderer | PASS | `ProgramAiExperience` + `ProgramAiFinalPresentation` |
| Reduced motion | Emulate `prefers-reduced-motion: reduce` | Non-essential movement is removed while content stays visible | Reveals are visible and Programme waveform animation is disabled by CSS | PASS | Shared and Programme motion CSS |
| Fail-visible | Remove `IntersectionObserver` before load | Server-rendered content remains readable; no pending reveal can strand content | Every enrolled reveal remains visible | PASS | `SiteMotionController` |

Captured artefacts:

- Casino Review: hero, overview, offer, editorial, score, final action at 1440 px; full page at 390 px.
- Bonuses: initial dark header, light header, dark-again calculator state and calculated output at 1440 px.
- Casinos: comparison tray closed and modal open at 1440 px.
- Programme: active recording state at 1440 px.
