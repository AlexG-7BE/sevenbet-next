# Server XP and Achievement Engines

## Transaction flow

Authenticated completion actions use one Prisma interactive transaction:

```text
validated published snapshot entity
  -> insert ProgramProgressEvent with ON CONFLICT DO NOTHING
  -> evaluate published XpRule records present in the pinned snapshot
  -> insert UserXpEvent with ON CONFLICT DO NOTHING
  -> evaluate active published Achievement records
  -> insert UserAchievement with ON CONFLICT DO NOTHING
  -> insert achievement reward UserXpEvent
  -> read normalized progress, total XP, and unlocked achievements
```

Only a newly inserted progress event creates reward contexts. Duplicate and
concurrent requests therefore converge on the database unique constraints and
return `awardedNow: 0`. Hydration and current-step navigation never create XP.

## Award keys

Progress XP uses a server-generated action prefix plus the immutable rule key:

- `xp:lesson:<lessonId>:completed:<ruleAwardKey>`
- `xp:step:<stepId>:completed:<ruleAwardKey>`
- `xp:quiz:<blockId>:completed:<ruleAwardKey>`
- `xp:quiz:<blockId>:passed:<ruleAwardKey>`
- `xp:scenario:<blockId>:completed:<ruleAwardKey>`
- `xp:exercise:<blockId>:completed:<ruleAwardKey>`
- `xp:program:<programId>:completed:<ruleAwardKey>`

Achievement unlocks use `achievement:<achievementId>:unlocked`. Achievement XP
uses `xp:achievement:<achievementId>:unlocked`. Internal keys and rule IDs are
never included in public DTOs.

## Supported achievement triggers

The engine currently evaluates server-verifiable facts only:

- `FIRST_LESSON`
- `STEP_COMPLETED`
- `PROGRAM_COMPLETED`
- `QUIZ_PASSED`
- `QUIZ_COUNT`

`PLAN_CREATED`, `LEARNING_STREAK`, and `GUIDE_COUNT` are deferred until those
features have authoritative server events. They are not inferred from browser
state. Unknown or malformed trigger configuration is skipped with a diagnostic
containing only the achievement ID and trigger type.

## Quiz safety

The quiz route accepts only `programId`, `blockId`, and `answerIndex`. The server
loads the quiz from the enrollment's pinned published snapshot, validates the
answer index, derives correctness, and creates `QUIZ_PASSED` only for the
configured correct answer. Client `passed`, XP, rule IDs, achievement IDs, and
award keys are rejected as unknown fields.

Anonymous merge does not contain quiz answers. A valid merged quiz ID can earn
quiz completion XP but cannot earn quiz passing XP or a pass achievement.

## Public response

Authenticated progress endpoints return:

```json
{
  "progress": {},
  "xp": { "awardedNow": 0, "total": 0 },
  "achievements": { "newlyUnlocked": [], "allUnlocked": [] },
  "source": "server"
}
```

The response omits user IDs, enrollment IDs, rule IDs, award keys, raw trigger
configuration, and private event metadata. Anonymous users continue using the
existing `sevenbet-program-progress-v1` localStorage fallback.

## Migration 0005

`UserXpEvent.ruleId` was previously mandatory, so an achievement XP reward had
no truthful source column. Migration `0005_xp_achievement_idempotency`:

- makes `ruleId` nullable;
- adds nullable `achievementId`;
- requires exactly one source with a SQL check constraint;
- adds foreign keys to `XpRule`, `Achievement`, and `UserAchievement` sources;
- adds supporting indexes.

The migration is intentionally not applied by this implementation step. Before
deployment, verify that all existing `UserXpEvent.ruleId` and
`UserAchievement.achievementId` values reference valid source rows, then apply
the migration with `prisma migrate deploy` in the target environment.
