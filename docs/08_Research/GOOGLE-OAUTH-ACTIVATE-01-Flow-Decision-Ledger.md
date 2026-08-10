# GOOGLE-OAUTH-ACTIVATE-01 Flow Decision Ledger

Status: implementation evidence for RFC-021. Repository root confirmed as `/Users/alex/Documents/Codex/2026-07-09/ns/sevenbet-next` on 2026-08-10. Source scan excluded dependencies, generated output, build artefacts, caches, test output and `tsconfig.tsbuildinfo`.

## Brief

Designing a corrected Programme access and authentication journey for adults using B4GAMBLE on the web. Goal: establish the required current-tab controls once, preserve anonymous Mission 01, and make successful authentication resolve visibly to the user’s Programme home. Tone: calm, direct and high-trust. Main risk: reducing repeated friction must not weaken server enforcement or merge access authority with private Programme claims. Constraints: existing Programme visual system, two checkboxes, one primary action, Protected Help, no redesign, no schema or dependency change.

## Detected defects

| Defect | Repository evidence | Classification |
| --- | --- | --- |
| Repeated 18+ | `AgeGate` collects 18+, then `Registration` collects it again for signup; journey→user transition previously depended on content-claim migration. | **Detected** |
| Fragmented Terms flow | The initial gate has no legal-copy acknowledgement; the later account form owns Terms/Privacy. | **Detected** |
| Authenticated `Log in` | `MissionShell` treats Mission 01 as logged out and several screens render `Header` without authenticated state. | **Detected** |
| My Programme opens Mission 01 | The client initializes `view` as Mission 01; a dashboard `404` for an authenticated user with no enrollment is silently ignored. | **Detected** |

## Research summary

- Styles reviewed: Vectary, N26 and imgs.so Sign in.
- Screens reviewed: ElevenLabs account creation and Fingerprint authentication.
- Flows reviewed: Pattern Brands account creation→profile, Cohere sign-in→dashboard and Duolingo earned work→profile→learning dashboard.
- v2.1 state references reviewed: Brilliant empty learning home and Duolingo first-lesson course paths with an explicit active start action.

### Reference lock

Primary reference/direction: the existing B4GAMBLE Active Control Programme and FE-DS-01 visual system.

Preserve: current canvas and type, Programme form proportions, high-contrast controls, existing focus treatment, photo-theatre role, compact compliance copy and Protected Help separation.

Borrow only:

- from Vectary/N26/imgs.so: restrained color, single-column decision hierarchy, one dominant action and flat high-contrast form controls;
- from ElevenLabs/Fingerprint: provider choice separated clearly from email/password without competing primary actions;
- from Pattern Brands/Cohere: successful auth immediately updates visible account navigation and lands in a personal surface;
- from Duolingo: earned work may precede profile creation, but the post-auth destination is the authenticated learning home rather than replayed onboarding.

Role rules: existing B4GAMBLE accent remains the action color; external reference colors, typefaces, shadows and radii are not imported. Google branding remains provider identity only. Legal links remain links, not accent decoration.

Media strategy: reuse the existing Programme photo theatre; no generated or new imagery.

Reject: new modal/card language, marketing-style hero treatment, three legal checkboxes, separate age and legal screens, dense explanatory copy, post-auth onboarding replay and false anonymous header states.

## Decision ledger

| Decision | Source | Rule / role | Why |
| --- | --- | --- | --- |
| One access screen with two controls | Founder Office RFC-021; Refero compact form references | One decision cluster, one primary action | Removes repeated friction while keeping each legal meaning explicit. |
| Keep existing Programme shell | Founder Office no-redesign constraint; FE-DS-01 | Existing product system is primary visual authority | Prevents unapproved design drift. |
| Account screen contains auth methods only | RFC-021; ElevenLabs/Fingerprint | Provider and email are alternative methods after access authority exists | Avoids duplicating compliance controls. |
| Header reads settled Better Auth session | RFC-021; Pattern Brands/Cohere flows | Successful auth must visibly change global account treatment | Prevents authenticated users seeing `Log in`. |
| Fresh authenticated user gets empty Programme home | RFC-002 Dashboard authority; Duolingo post-profile flow | Personal home precedes explicit first-task start | Preserves My Programme semantics and user agency. |
| Zero progress names only the active first step | Founder Office v2.1; Brilliant empty home; Duolingo first-lesson paths | `0 XP`, zero complete, Mission 01 current and one explicit start action | Prevents locked downstream work or achievements from reading as current progress. |
| Server-signed access proof replaces static auth authority | Founder Office v2.1; RFC-021 | HMAC proof binds fixed purpose, current copy, exact journey and original 60-minute lifetime | Makes manually selected header values insufficient while retaining stateless self-attestation. |
| Access and content claim markers remain separate | RFC-017, RFC-018, RFC-021 | Compliance authority cannot imply private-content migration | Preserves privacy and exact-claim isolation. |

## Implementation classification boundary

- **Detected:** subject-isolated session storage, Better Auth session, exact Google callback allow-list, age header enforcement, server Dashboard projection, RFC-020 identity-only hardening.
- **Inferred:** a 60-minute same-tab TTL is the smallest bounded interval that accommodates the approved 17–22 minute Mission 01 plus account/OAuth transition without becoming device-persistent.
- **Detected in this v2.1 branch:** purpose-separated server HMAC proof, exact signed-journey verification, current-copy/original-lifetime enforcement and a Mission-01-only fresh Dashboard treatment.
- **Detected in the v2 baseline and retained:** versioned browser access marker, empty authenticated Dashboard DTO, shared session-derived Programme header and browser regressions.
- **Not detected / not claimed:** durable acceptance ledger, DOB/KYC, Production Google activation, Production credential mutation, commercial activation or real Preview E2E on the new branch alias.
