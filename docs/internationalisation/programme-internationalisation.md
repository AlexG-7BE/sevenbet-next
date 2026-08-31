# Programme internationalisation

**Evidence date:** 31 August 2026

**Status:** remediation implemented on `feat/programme-internationalisation`; **PR #106 Preview is on HOLD** pending real hosted Mission 01 and locale-continuity acceptance; not merged or deployed to Production

**Authoritative base:** `f457099390c98ed0fd4613996a706aa728ffbb4c`

**Assurance:** repository, disposable-database and rendered-runtime engineering evidence. This is not legal, regulatory, commercial or indexing approval.

## Authority and historical truth

The current explicit Founder instruction authorises one localized Programme
presentation candidate across the 11 European locales below. It supersedes the
older unprefixed-only Programme presentation boundary for this implementation
scope, but it does not reopen the completed public-site internationalisation
foundation or grant Production deployment authority. The historical
`RELEASE_CHECKPOINT_2026-08-31.md` remains unchanged.

The delivery sequence remains:

`feature branch → implementation → tests → PR → CI → Vercel Preview → real hosted Mission 01 acceptance → Founder review → STOP`

No merge, auto-merge, Production deployment or Production data mutation is
authorised by this record.

## Detected route and locale contract

`lib/programme/presentation.ts` is the single typed contract for Programme
presentation identity, exact canonical routes and transcription language.

| Market | Locale | Canonical Programme route | Transcription language |
| --- | --- | --- | --- |
| GB | `en-GB` | `/program` | `en` |
| DE | `de-DE` | `/de/program` | `de` |
| ES | `es-ES` | `/es/program` | `es` |
| SE | `sv-SE` | `/se/program` | `sv` |
| DK | `da-DK` | `/dk/program` | `da` |
| GR | `el-GR` | `/gr/program` | `el` |
| IT | `it-IT` | `/it/program` | `it` |
| PT | `pt-PT` | `/pt/program` | `pt` |
| NL | `nl-NL` | `/nl/program` | `nl` |
| FI | `fi-FI` | `/fi/program` | `fi` |
| NO | `nb-NO` | `/no/program` | `no` |

The route parser accepts only this exact family. Valid localized requests are
rewritten to the one `app/program` renderer. Unknown descendants reach the
shared localized Programme not-found boundary; encoded path separators and
unrelated localized routes fail closed.

Middleware establishes a signed, request-local `programme-v1` presentation
context distinct from `public-v1`. It removes client-authored internal
presentation headers, binds the context to the exact origin, path, query,
market, locale and issuance time, and gives RootLayout enough trusted evidence
to emit the correct `<html lang>`. Programme routing does not read or mutate
the public presentation preference and does not use geo fallback to reinterpret
an explicit Programme URL.

## Detected language-neutral state invariant

There is still one Programme and one language-neutral state per user. Locale,
language and route-market presentation do not enter:

- user or anonymous subject identity;
- `ProgramEnrollment` or Programme version identity;
- `ProgrammeMissionProgress`, action or completion identity;
- Starting Point or artefact ownership;
- pending claim identity;
- XP, achievement, active-day or idempotency keys; or
- prerequisite, progress, resume and Review rules.

The existing unique constraints remain:

- `ProgramEnrollment @@unique([userId, programId])`
- `ProgrammeMissionProgress @@unique([enrollmentId, missionNumber])`

The rendered same-user test captures exact enrollment, mission-progress,
task-state, completion, Starting Point and XP records before and after
`en-GB → de-DE → fi-FI → en-GB`. It also proves that the local subject and
browser-local narrative remain byte-for-byte unchanged and that switching
locale does not create a second anonymous journey.

**Migration impact: NONE.** There is no Prisma schema change, new migration,
locale-specific Program/Version/Step record, backfill or persisted-content
translation.

## Detected catalogue and user-content policy

`lib/i18n/programme-catalog.ts` is the repository-controlled typed catalogue.
English `en-GB` is the semantic source baseline. The catalogue covers the
Programme shell, metadata, access, Mission 01, authentication transitions,
Home, Missions 02–10, every action/field/option, progress and validation,
voice, completion, Reviews, artifact/final-plan presentation, empty/error/
not-found states, Help boundaries, logout, accessibility text and responsive
states.

Runtime identifiers remain untranslated. The structural Mission registry
contains IDs, ordering, prerequisites, artifact versions and XP only;
presentation is resolved separately. Input-control labels are also separate
from saved-artifact summary labels so localization cannot silently change the
English interaction baseline.

User-authored Starting Point text, local narrative and optional wording are not
system copy. They are preserved verbatim when the surrounding interface
changes language. Browser-local narrative remains in `sessionStorage`; this
work introduces no new persistence of sensitive narrative, audio or transcript.

## Detected selector and authentication contract

`ProgrammeLanguageSelector` is available throughout anonymous, access,
Mission 01, registration, authenticated Home, Mission, Review and completion
states. It exposes exactly the 11 canonical Programme routes and performs a
full-document navigation so request-local language and `<html lang>` change
together. It does not call `/api/presentation`, write the public presentation
cookie, rotate subject identity, clear local content or preserve arbitrary
query data.

Only the four bounded Programme authentication states may survive a locale
switch. Google sign-in and explicit account-link flows use exact allowlisted
success/error callback pairs for every Programme route. Email and Google
identity semantics, Better Auth user/session schema and callback validation
strength are unchanged. Sign-out returns to the same localized Programme
presentation.

## Detected AI locale contract

Locale is mandatory and validated at each Programme AI boundary:

- Mission 01 turn;
- Missions 02–10 guidance;
- Personal Reviews;
- provider adapters; and
- voice transcription multipart input.

Provider prompts explicitly require output in the requested locale. Provider
failure, timeout, invalid output and provider-off execution use deterministic
same-locale fallbacks. User-owned text remains verbatim rather than being
translated or rewritten as system copy. The transcription adapter sends the
explicit ISO 639-1 language shown in the route table rather than hardcoding
English.

Provider output remains subject to strict schemas, size limits, no automatic
retry, local grounding, commercial-firewall checks and multilingual bounded
safety patterns. Locale is not logged with private user input and grants no
new provider authority.

## Detected Help, legal, public and commercial boundaries

- Protected Help remains independently reachable and non-commercial.
- DE/ES/SE/DK/GR may use only their already evidence-approved localized Help
  and ordinary public route presentations.
- IT/PT/NL/FI/NO retain the neutral unprefixed Help and public destinations;
  no regulator, helpline, self-exclusion resource or legal right is invented.
- Operative Terms, Privacy and Affiliate Disclosure bodies remain on the
  existing unprefixed authoritative contract; only surrounding Programme
  labels are localized.
- `/it/program`, `/pt/program`, `/nl/program`, `/fi/program` and
  `/no/program` do not publish the corresponding ordinary public root or add
  those markets to the public Production selector.
- Programme presentation does not enter `JurisdictionResolver`, affiliate
  eligibility, rankings, offer selection, destinations or tracking.
- No AffiliateProgram, AffiliateOffer, AffiliateTrackingLink, licence,
  operator, partner, kill-switch or indexing authority changed.

## Detected QA state

The durable generated report is
`docs/internationalisation/programme-ai-language-qa-report.json`.

- Status: `AI_LANGUAGE_QA_PASSED`
- Catalogue keys: 632
- Checked strings per locale: 652
- Locales passing: 11/11
- Digest: `28c329583f62296a400c8dd82b6391d17edd5442de138b6bafbffa2c42de74a7`

The report deterministically checks source completeness, non-empty
translations, untranslated source leakage, interpolation integrity, obvious
English and wrong-locale leakage, Unicode and HTML safety, protected names,
semantic-ID separation, established terminology, locale orthography, clinical
claim patterns and commercial-recommendation patterns. It explicitly excludes
user-owned content from system-copy leakage decisions. This bounded AI gate is
not legal, regulatory, commercial or indexing approval.

Verified branch gates at this evidence point:

- `npm run programme:test`: 139/139 passed.
- `npm run program-ai:browser`: 16/16 passed.
- `npm run internationalisation:test`: 56/56 passed.
- `npm run lint`: passed with zero warnings.
- `npm run typecheck`: passed.
- `npm run build`: passed.
- `npm run ci:quality`: passed in full, including Prisma validation and all
  configured structural/runtime/release Node suites.
- `npm run ci:browser`: 246 passed and 3 intentionally skipped in the public
  matrix, then 16/16 passed in the Programme/database-backed matrix.
- `npm run ci:build-secrets`: passed across 807 browser-deliverable files.
- `npm run ci:structural`: passed.
- `npm run ci:migrations`: passed against a disposable PostgreSQL database;
  23 existing migrations, no new migration.

## Detected PR, CI and Preview evidence

- PR [#106](https://github.com/AlexG-7BE/sevenbet-next/pull/106) is open
  from `feat/programme-internationalisation` to `main`. Its exact base is
  `f457099390c98ed0fd4613996a706aa728ffbb4c`; the implementation evidence head
  before this documentation update is
  `7ddd12268e05483f46bfb5166bbd939c9d24cba1`.
- GitHub Actions run
  [33374528878](https://github.com/AlexG-7BE/sevenbet-next/actions/runs/33374528878)
  passed at that exact head. `Agent Core`, `Quality`,
  `Database / Migration Verification` and `Build / Browser` all completed
  successfully, including the full browser and typography stages.
- Vercel deployment `dpl_Ht18HWwzv5BmnJ3TWZhKH9tryDup` is a `READY` Preview
  whose Git source is that exact head. Its immutable URL is
  `https://sevenbet-next-ac72ikjfw-alexg-7bes-projects.vercel.app`; the branch
  alias is
  `https://sevenbet-next-git-feat-programme-int-041e2b-alexg-7bes-projects.vercel.app`.

Authenticated rendered QA on the exact deployment covered every Programme
route at both `1440 × 1000` and `390 × 844`, for 22 route/viewport
combinations. Every combination had the exact document language and canonical
path, 12 alternate-language links, localized H1 copy, no representative
English leakage outside `en-GB`, no unresolved interpolation token, no
horizontal overflow and no clipped interactive control. The responsive
selector exposed exactly the 11 canonical routes with the active route marked;
Greek glyph rendering and the Norwegian mobile menu bounds were inspected
directly. `/it/` retained `noindex, follow` and rendered no Programme runtime,
confirming that Italian Programme availability did not grant ordinary
second-wave public publication authority. Unsigned headless requests stopped
at Vercel deployment protection and were excluded from application QA rather
than misclassified as application failures.

That earlier route/rendering pass did not prove real hosted Mission 01 session
creation. It must not be used as evidence that the first Programme mutation is
available in Preview.

## Detected runtime acceptance finding and remediation

The Founder reproduced the missing runtime path on the later exact PR head
`41d4728387b130e7c0a265a1dfbed9224b4dbc9b`: access-authority creation returned
`200`, the immediately following Program AI session request returned `404`, and
the interface reported an authority-verification failure. Repository and Vercel
configuration evidence identified configuration drift: the session service
fails closed with stable code `PROGRAM_AI_DISABLED` unless
`PROGRAM_AI_V1_ENABLED` is exact `true`, while the PR browser configuration
forces that value for local Playwright. The affected branch had no branch-bound
Preview value before remediation.

Before enabling the flag, provider evidence established that Preview and
Production are attached to different Prisma Postgres resources:

- Preview: `sevenbet-preview`, provider resource
  `store_hLPkkgamL7rJNmCe`, attached only to `preview`;
- Production: `prisma-postgres-cobalt-school`, provider resource
  `store_1I4F54ETrwSKS42o`, attached only to `production`.

The immutable resource IDs and mutually exclusive environment attachments are
the isolation proof. No database value, credential or connection string is
recorded here. After that proof, `PROGRAM_AI_V1_ENABLED=true` was added only to
the Preview environment for exact branch
`feat/programme-internationalisation`. The existing Production-scoped flag was
not edited.

Implementation commit `c70c7663e4565c9241b9fd8a0eec74d18da19633`
adds four bounded controls:

1. access-authority failure, disabled/unavailable Mission 01, and general
   session-creation failure now resolve to distinct repository-controlled copy;
2. all three messages are localized across all 11 Programme locales and raw
   server codes, statuses and details are not rendered;
3. a route regression proves a valid signed access request receives stable
   server code `PROGRAM_AI_DISABLED` with `404` before session creation when the
   runtime is disabled; and
4. Vercel Preview builds for this exact release branch fail unless the runtime
   flag is exact `true`. Other Preview branches and Production are outside this
   temporary release-candidate guard.

Local browser tests use controlled routing and therefore validate presentation
and error mapping, not hosted runtime availability. A fresh protected-Preview
browser attempt was rejected by the Codex app security layer; no alternate
access path was used. Real hosted acceptance remains pending and must cover:

- access confirmation through `Enter Mission 01`, authority `200`, successful
  session creation, and rendered intake without API interception; and
- `en-GB → de-DE → fi-FI → en-GB` in one browser subject/journey.

## Founder-gated remainder

The following remain pending and must not be presented as completed:

1. real hosted Mission 01 and locale-continuity acceptance on the new exact
   remediation deployment;
2. Founder acceptance;
3. any merge decision;
4. any Production deployment, Production data, indexing, ordinary second-wave
   publication or commercial-authority decision.

**PR #106 PREVIEW: HOLD.**

Programme localization does not activate non-GB indexing, second-wave public
publication, localized operative legal documents or any commercial action.
