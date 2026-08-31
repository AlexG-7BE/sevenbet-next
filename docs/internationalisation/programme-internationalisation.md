# Programme internationalisation

**Evidence date:** 31 August 2026

**Status:** implemented and verified on `feat/programme-internationalisation`; not merged or deployed to Production

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

`feature branch → implementation → tests → PR → CI → Vercel Preview → rendered QA → Founder visual review → STOP`

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
- Catalogue keys: 629
- Checked strings per locale: 649
- Locales passing: 11/11
- Digest: `d46355fba2a6c4783fc93ad71995829923aacc34761f7101273aa5f35405b715`

The report deterministically checks source completeness, non-empty
translations, untranslated source leakage, interpolation integrity, obvious
English and wrong-locale leakage, Unicode and HTML safety, protected names,
semantic-ID separation, established terminology, locale orthography, clinical
claim patterns and commercial-recommendation patterns. It explicitly excludes
user-owned content from system-copy leakage decisions. This bounded AI gate is
not legal, regulatory, commercial or indexing approval.

Verified branch gates at this evidence point:

- `npm run programme:test`: 136/136 passed.
- `npm run program-ai:browser`: 16/16 passed.
- `npm run internationalisation:test`: 56/56 passed.
- `npm run lint`: passed with zero warnings.
- `npm run typecheck`: passed.
- `npm run build`: passed.
- `npm run ci:quality`: passed in full, including Prisma validation and all
  configured structural/runtime/release Node suites.
- `npm run ci:browser`: 245 passed and 3 intentionally skipped in the public
  matrix, then 16/16 passed in the Programme/database-backed matrix.
- `npm run ci:build-secrets`: passed across 807 browser-deliverable files.
- `npm run ci:structural`: passed.
- `npm run ci:migrations`: passed against a disposable PostgreSQL database;
  23 existing migrations, no new migration.

Hosted Preview identifiers, exact-head CI and final rendered Preview evidence
will be recorded after the PR exists; they are not inferred from local passes.

## Founder-gated remainder

The following remain pending and must not be presented as completed:

1. focused PR creation and exact-head remote CI;
2. exact Vercel Preview deployment verification;
3. desktop/mobile rendered Preview QA across all 11 routes;
4. Founder visual acceptance;
5. any merge or Production deployment decision.

Programme localization does not activate non-GB indexing, second-wave public
publication, localized operative legal documents or any commercial action.
