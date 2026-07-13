# SevenBet CMS Phase 2: Program Builder

## Existing Phase 1 Infrastructure Reused

Phase 2 keeps the Phase 1 admin middleware, role model, workflow helpers, audit log, revision service, public APIs, seed content and Prisma contract. The generic CMS repository remains the shared write path. No duplicate permission or editorial workflow system was introduced.

Phase 1 placeholders still present:

- preview-token authentication instead of named production sessions;
- in-memory repository instead of PostgreSQL persistence;
- schema and SQL migrations are prepared, but Prisma packages and a database are not connected;
- analytics are represented by read-only placeholders.

## Admin Architecture

Program management routes:

- `/admin/programs`
- `/admin/programs/new`
- `/admin/programs/:programId`
- `/admin/programs/:programId/builder`
- `/admin/programs/:programId/preview`
- `/admin/programs/:programId/revisions`
- `/admin/achievements`
- `/admin/xp-rules`
- `/admin/program-settings`

The builder uses three panels: a structure tree, selected-item editor and contextual validation/metadata. Laptop layouts retain all three panels; tablet and mobile layouts stack them. Every ordering operation has visible move-up and move-down controls, so no drag-only interaction is required.

## Content Model

The editable hierarchy is `Program -> ProgramStep -> Lesson -> LessonBlock`. IDs are stable; `order` uses spaced integer positions and is normalized on save. Moving or renaming an item never changes its ID.

Supported blocks:

`TEXT`, `HEADING`, `CALLOUT`, `IMAGE`, `VIDEO`, `QUOTE`, `CHECKLIST`, `QUIZ`, `SCENARIO`, `EXERCISE`, `REFLECTION`, `PRACTICAL_TASK`, `RESOURCE_LINK`, `SUMMARY`, `DIVIDER`, `RESPONSIBLE_GAMBLING_NOTICE`, and `RELATED_COMPARISON`.

Block content is structured JSON. Raw JavaScript and `javascript:` URLs are rejected by validation. Image blocks require alt text. Related comparisons require an internal affiliate-link ID; raw affiliate destinations do not belong in educational blocks.

## Quiz, Scenario and Exercise Configuration

Quiz blocks store structured questions and answer options. Publication validation checks required prompts, answer counts, exactly one correct single-choice answer, at least one correct multiple-choice answer, achievable scores and educational explanations.

Scenario blocks store choices, feedback and a preferred or safer choice. Branch targets are modeled in structured data and circular branches are rejected.

Exercise blocks define instructions, type, validation, save behavior, privacy notice and takeaway. User responses are not CMS content and are never exposed to editors. The current public program continues to save reflections locally in the browser.

## Completion and Prerequisites

Completion rules support required blocks, quiz completion or score, scenario answers, exercise submission, takeaway acknowledgement and all required lessons. AND rules are the default; limited OR behavior is represented explicitly.

Prerequisites reference stable entity IDs. Validation rejects missing references and cycles. Archiving uses soft deletion so progress and historical versions can keep their references.

## XP and Achievements

XP rules include an immutable `awardKey`, event type, value, activation state and effective dates. The production schema makes `(userId, awardKey)` unique, preventing duplicate awards. Rule changes apply to future events only and do not rewrite historical XP.

Achievements use structured triggers and idempotent award keys. No trigger rewards gambling activity, deposits, losses or casino registrations.

## Draft, Review and Publication

Workflow:

`DRAFT -> IN_REVIEW -> APPROVED -> SCHEDULED or PUBLISHED -> ARCHIVED`

Request-changes transitions return content to draft. Each meaningful save creates entity revisions and audit records. Critical validation errors prevent publication. Public program reads use a separate published snapshot, so saving a draft cannot leak it to the public renderer.

## Versioning and Progress Safety

Published programs have explicit draft and published version numbers. The database contract pins each `ProgramEnrollment` to a `ProgramVersion`. Progress and XP are append-only events keyed to stable entities.

Behavior by change type:

- rename or reorder: safe; stable IDs preserve progress;
- move lesson: safe; lesson ID remains unchanged;
- archive lesson: old versions keep it, while new enrollments use the new published version;
- change quiz or completion rule: creates a new version; existing enrollments remain pinned;
- change XP value: applies prospectively; earned XP is unchanged;
- breaking replacement: requires an explicit `migrationMap` before affected enrollments move versions.

The existing browser key `sevenbet-program-progress-v1` remains unchanged. Phase 2 adds stable step IDs to that payload and migrates existing day-number completion data on first load, preserving current users.

## Preview and Public Rendering

Draft preview is served only below `/admin`, protected by the existing middleware cookie/token and marked `noindex`. Public `/program` reads the stable published CMS snapshot and falls back to `lib/program.ts` if no snapshot is available. The old source remains in place until database-backed publication is verified.

## Adding a Block Type

1. Add the enum value to `CmsBlockType` and Prisma `CmsBlockType`.
2. Add its editor to `LessonBlockEditor`.
3. Add validation to `program-validation.ts`.
4. Add public rendering behavior or an explicit safe fallback.
5. Add migration SQL and tests.

## Publication Troubleshooting

- Open the validation panel and select each finding to jump to its entity.
- Resolve all errors; warnings do not block publication.
- Save the draft before requesting review.
- The reviewer moves it to `APPROVED`.
- A user with `program.publish` publishes the immutable snapshot.
- A conflict response means another editor saved first; reload before applying changes again.

## Required Production Setup

Install Prisma, configure `DATABASE_URL`, apply migrations `0001` and `0002`, generate the client, replace the in-memory repository with Prisma transactions, and replace preview-token auth with named admin accounts before production editorial use.
