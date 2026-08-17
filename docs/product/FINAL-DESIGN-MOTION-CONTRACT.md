# Final Design Motion Contract

## Authority and boundary

This contract records motion detected in `Home.dc.html`, `Hero System.dc.html`, `Best Offers.dc.html`, `Casinos.dc.html`, `Casino Review.dc.html`, `Bonuses.dc.html`, `Learn.dc.html`, `Programme.dc.html` and `support.js` from the supplied final handoff. It is not a motion wish-list.

- **Detected:** page-level handoff files share a `cubic-bezier(0.2, 0.8, 0.2, 1)` reveal language, short 150–250ms control feedback and restrained long image scale.
- **Detected:** `support.js` implements design-canvas helpers, conditional rendering and `style-hover`/`style-active` preview behaviour. Its editor shine/skeleton effects are not public product motion.
- **Detected:** Home has a unique pointer spring, full-screen wheel transition, sticky chapter stack and staggered rise system. Those behaviours remain owned by `HandoffInteractions` and are not duplicated by the shared reveal primitive.
- **Detected:** the Casino Review handoff has a 16-second hero-media scale, a 600ms opening copy entrance, view-linked section reveals, score bars, a fixed decision action and an accordion state. The score bars inherit the verified 700ms section-reveal timing in runtime.
- **Detected:** the Casinos handoff defines the comparison tray entrance as 450ms transform plus 350ms opacity. The contextual dialog/backdrop uses that same entrance family in runtime.
- **Inferred:** where the handoff swaps content without a numeric tween (filters and the bonus calculator), runtime feedback is limited to the detected 150ms control-state transition. Calculated values update directly and remain deterministic.

## Runtime contract

| SURFACE | ELEMENT | TRIGGER | START STATE | END STATE | DURATION | EASING | DESKTOP / MOBILE | REDUCED MOTION | RUNTIME OWNER |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Shared public shell | Chameleon header | Explicit themed section crosses the probe below the fixed header; route or layout changes resync | Previous explicit theme | `dark`, `light`, `cream` or `photo`; geometry unchanged | Background/backdrop 400ms; foreground/border 250ms | Standard / linear colour interpolation | Both | 0ms theme swap; no geometry movement | `PublicHeaderThemeController` |
| Shared native surfaces | Eligible off-screen reveal group | Intersection after capable client initialisation | Visible SSR; then off-screen `opacity: 0`, `translateY(24px)` | Visible, `translateY(0)` | 700ms; optional 130ms item stagger | `cubic-bezier(0.2, 0.8, 0.2, 1)` | Both; smaller mobile distance allowed | Always visible, no transform | `SiteMotionController` + page CSS |
| Home | Opening copy | First render | `opacity: 0`, `translateY(8px)` | Visible | 600ms | `cubic-bezier(0.2, 0.8, 0.2, 1)` | Both | Visible immediately | Existing handoff CSS/runtime |
| Home | Editorial photo cards | Fine-pointer movement | Current spring position | Depth-relative target position | Continuous spring; `k=.06`, damping `.8` | Underdamped spring | Desktop fine pointer only | Disabled | `HandoffInteractions` |
| Home | Full-screen chapters | Deliberate vertical wheel gesture | Current chapter stop | Next/previous chapter stop | 600ms | Ease-out quartic | Desktop fine pointer only | Native scroll; no forced tween | `HandoffInteractions` |
| Home | Chapter stack | Scroll through programme story | First sheet grows from .24 scale; later sheets stacked | Full sheet and visible chapter copy | Scroll-linked; copy 450ms | Smoothstep / standard opacity | Desktop; simplified mobile layout | Static full panels | `HandoffInteractions` |
| Home | Rise copy | Section reaches observer threshold | Visible SSR; capable client marks pending at `44px` | Visible, per-item 130ms stagger | 700ms | `cubic-bezier(0.2, 0.8, 0.2, 1)` | Both | Always visible | `HandoffInteractions` |
| Home photo chapters | Background photography | While chapter is present | Scale 1 | Scale 1.06, alternating | 18s | `cubic-bezier(0.2, 0.8, 0.2, 1)` | Both | Static scale 1 | Existing handoff page CSS |
| Casino Review | Opening decision copy | First render | `opacity: 0`, `translateY(8px)` | Visible | 600ms | `cubic-bezier(0.2, 0.8, 0.2, 1)` | Both | Visible immediately | `CasinoProfile.module.css` |
| Casino Review | Hero media | Page present | Scale 1 | Scale 1.06, alternating | 16s | `cubic-bezier(0.2, 0.8, 0.2, 1)` | Both | Static scale 1 | `CasinoProfile.module.css` |
| Casino Review | Read progress and active review section | Scroll | Previous bounded percentage/section | Current bounded percentage/section | Progress 120ms linear; active colour 250ms | Linear / standard | Desktop and mobile | Direct state update | `CasinoProfileInteractions` |
| Casino Review | Decision bar | Natural sticky/fixed transition during review scroll | In-flow desktop bar / fixed mobile action | Stuck below public header / bottom mobile sheet | Browser sticky; visual surface 250ms | Standard | Desktop / mobile-specific placement | No movement animation | CSS + `CasinoProfileInteractions` state |
| Casino Review | 30-second/evidence/editorial/final groups | Group enters viewport | Visible SSR; capable client marks off-screen pending | Visible | 700ms | `cubic-bezier(0.2, 0.8, 0.2, 1)` | Both | Always visible | `SiteMotionController` |
| Casino Review | Score bars | Verdict reveal enters viewport | `scaleX(0)` after capable observer initialises | Runtime score width | 700ms, 90ms row stagger | `cubic-bezier(0.2, 0.8, 0.2, 1)` | Both | Full runtime score width immediately | Shared reveal state + profile CSS |
| Casino Review / Best Offers / Casinos | FAQ answer | Summary activation | Closed row, answer block size 0 and opacity 0 | Open auto block size and opacity 1 | 400ms size, 350ms opacity | `cubic-bezier(0.2, 0.8, 0.2, 1)` | Both | Instant semantic `<details>` state | Native details + surface CSS |
| Bonuses / Casinos / Learn | Filter or tab selector | User selects a control | Previous border/background/foreground | Selected state | 150ms | `cubic-bezier(0.2, 0.8, 0.2, 1)` | Both | Instant | Existing runtime controls + CSS |
| Bonuses | Calculator response | Input/radio/range changes | Previous deterministic result | Recalculated deterministic result | 150ms control/output colour feedback; no number tween | Standard | Both | Instant | `BonusCalculator` |
| Commercial cards | Card hover | Fine-pointer hover/focus | Rest position | Up to `translateY(-6px)` plus deeper shadow | 250ms | `cubic-bezier(0.2, 0.8, 0.2, 1)` | Fine pointer; no required mobile hover | No lift | Surface CSS |
| Shared actions | CTA hover/press | Hover, focus or activation | Rest | Detected colour/filter and at most 1px lift; press returns to rest | 150–160ms | Standard | Both; touch receives press only | Colour change only | Surface CSS / design-system action |
| Casinos comparison | Selection tray | First selection, update or clear | Below viewport and transparent | Centred above bottom edge and opaque | Transform 450ms; opacity 350ms | `cubic-bezier(0.2, 0.8, 0.2, 1)` | Both; reduced bottom offset on mobile | Appears/disappears immediately | `ContextualComparison` CSS |
| Casinos comparison | Modal/sheet and backdrop | Second selection auto-opens or user reopens | Dialog scaled/translated slightly; backdrop transparent | Dialog at rest; backdrop `rgba(16,15,15,.76)` | Dialog 450ms; backdrop 350ms | `cubic-bezier(0.2, 0.8, 0.2, 1)` | Centred desktop / bottom sheet mobile | Opens immediately; no backdrop blur | `ContextualComparison` + CSS |
| Learn / Casino Review imagery | Hero photography | Page present | Scale 1 | Scale 1.06, alternating | 16s | `cubic-bezier(0.2, 0.8, 0.2, 1)` | Both | Static scale 1 | Handoff page CSS / profile CSS |
| Programme | Microphone action | Hover/press and recording state | Idle control | Brightness/pressed or existing recording pulse state | 150–240ms | Standard | Both | State remains visible without pulse | Existing `ProgramAiFinalPresentation` CSS |
| Programme | Waveform/transcript/Starting Point state | Existing Programme state transition | Prior canonical Programme state | Current server-owned/runtime state | Existing bounded presentation timing only | Existing Programme easing | Both | Static readable state | Existing Programme components; architecture unchanged |

## Fail-visible rule

`data-motion-reveal` never means hidden in server HTML. `SiteMotionController` may assign `data-motion-state="pending"` only after confirming `IntersectionObserver` exists, reduced motion is not requested and the element is outside the first viewport. A thrown/missing observer, reduced motion, navigation cleanup or safety timeout sets every enrolled element to `visible`.

## Performance and accessibility gates

- Continuous work is limited to the already approved Home spring/stack and one animation-frame-coalesced header/profile scroll sync.
- Decorative movement uses opacity and transform; header geometry and document flow do not animate.
- Dialog semantics, focus management, native details keyboard behaviour and visible focus remain intact.
- Motion never changes runtime scores, calculator arithmetic, Programme state, availability or commercial truth.
- `prefers-reduced-motion: reduce` disables long image scale, spatial reveals, score growth, tray/dialog travel and non-essential pulses.
