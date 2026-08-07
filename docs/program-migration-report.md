# 10-Step Program Migration Report

## Status

**Historical Phase 2 migration report.** The active `/program` route now renders `ActiveControlProgramme` and uses the approved Mission 01–04 Programme contracts. The `lib/program.ts`, Program Builder and legacy progress routes described below remain repository history/compatibility evidence, not current authority for Mission completion, XP or next-Mission state.

## Source

The original program remains in `lib/program.ts`. Phase 2 seed generation maps it into CMS records at startup.

## Preserved

- program ID: `program_10_step_control`;
- ten step IDs: `program_step_1` through `program_step_10`;
- ten lesson IDs: `lesson_step_1` through `lesson_step_10`;
- lesson text, exercises, scenarios, quizzes, explanations, takeaways and recap content;
- XP values and educational achievements;
- original order;
- the then-current public `/program` route and interactive UX;
- browser progress key `sevenbet-program-progress-v1`.

## Structured Conversion

Each original step becomes one `ProgramStep` and one required `Lesson`. Lesson content is converted into five structured blocks: text, exercise, scenario, quiz and summary. Orders use 1000-point spacing. Scenario choices and quiz options receive stable IDs.

## Progress Migration

Existing day-number completion state is retained. On first Phase 2 load, completed day numbers are also mapped to stable CMS step IDs. Future reordering and renaming use those stable IDs. No automatic progress reset is performed.

## Historical Source of Truth at the Time

At the time of this migration, the published in-memory CMS snapshot was the runtime source for `/program`, with `lib/program.ts` as seed input and fallback. That statement is superseded for the active route by the Mission 01–04 Programme services and server-owned Dashboard/reward contracts.

## Historical Production Cutover Gate

The old source may be retired only after the Prisma repository is connected, migrations and seed run successfully, published snapshot rendering is verified, enrollment version pinning is active, and a rollback rehearsal succeeds.
