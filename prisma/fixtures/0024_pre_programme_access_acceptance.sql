-- Disposable migration-compatibility fixture only. It contains one claim path
-- that proves prior PROGRAM-AI access and one generic enrollment whose access
-- history is deliberately unknown.
INSERT INTO "User" ("id", "name", "email", "emailVerified", "createdAt", "updatedAt") VALUES
  ('access-safe-user', 'Safe claim fixture', 'access-safe@invalid.example', true, '2026-08-01T00:00:00Z', '2026-08-02T00:00:00Z'),
  ('access-unknown-user', 'Unknown enrollment fixture', 'access-unknown@invalid.example', true, '2026-08-01T00:00:00Z', '2026-08-02T00:00:00Z');

INSERT INTO "Program" (
  "id", "slug", "title", "summary", "status", "publishedVersion", "createdAt", "updatedAt", "createdBy", "updatedBy"
) VALUES (
  '24000000-0000-4000-8000-000000000001', 'access-upgrade-fixture', 'Access upgrade fixture',
  'Disposable Programme migration fixture', 'PUBLISHED', 1, '2026-08-01T00:00:00Z', '2026-08-01T00:00:00Z', 'fixture', 'fixture'
);

INSERT INTO "ProgramStep" (
  "id", "programId", "slug", "title", "status", "order", "estimatedMinutes", "xp", "createdAt", "updatedAt", "createdBy", "updatedBy"
) VALUES
  ('24000000-0000-4000-8000-000000000011', '24000000-0000-4000-8000-000000000001', 'access-fixture-m1', 'Mission 1', 'PUBLISHED', 1, 5, 0, '2026-08-01T00:00:00Z', '2026-08-01T00:00:00Z', 'fixture', 'fixture'),
  ('24000000-0000-4000-8000-000000000012', '24000000-0000-4000-8000-000000000001', 'access-fixture-m2', 'Mission 2', 'PUBLISHED', 2, 5, 0, '2026-08-01T00:00:00Z', '2026-08-01T00:00:00Z', 'fixture', 'fixture');

INSERT INTO "ProgramVersion" (
  "id", "programId", "version", "status", "snapshot", "publishedAt", "createdAt", "createdBy"
) VALUES (
  '24000000-0000-4000-8000-000000000021', '24000000-0000-4000-8000-000000000001', 1,
  'PUBLISHED', '{}'::jsonb, '2026-08-01T00:00:00Z', '2026-08-01T00:00:00Z', 'fixture'
);

INSERT INTO "ProgramEnrollment" (
  "id", "userId", "programId", "programVersionId", "startedAt", "currentStepId", "timezone"
) VALUES
  ('24000000-0000-4000-8000-000000000031', 'access-safe-user', '24000000-0000-4000-8000-000000000001', '24000000-0000-4000-8000-000000000021', '2026-08-02T00:00:00Z', '24000000-0000-4000-8000-000000000012', 'UTC'),
  ('24000000-0000-4000-8000-000000000032', 'access-unknown-user', '24000000-0000-4000-8000-000000000001', '24000000-0000-4000-8000-000000000021', '2026-08-02T00:00:00Z', '24000000-0000-4000-8000-000000000012', 'UTC');

INSERT INTO "ProgrammeMissionProgress" (
  "id", "enrollmentId", "missionNumber", "status", "taskStates", "completedAt", "createdAt", "updatedAt"
) VALUES
  ('24000000-0000-4000-8000-000000000041', '24000000-0000-4000-8000-000000000031', 1, 'COMPLETED', ARRAY['situation_submitted', 'starting_point_confirmed'], '2026-08-02T00:00:00Z', '2026-08-02T00:00:00Z', '2026-08-02T00:00:00Z'),
  ('24000000-0000-4000-8000-000000000042', '24000000-0000-4000-8000-000000000032', 1, 'COMPLETED', ARRAY['legacy_complete'], '2026-08-02T00:00:00Z', '2026-08-02T00:00:00Z', '2026-08-02T00:00:00Z');

INSERT INTO "UserXpEvent" (
  "id", "userId", "programId", "missionNumber", "sourceArtifactType", "sourceArtifactId", "awardKey", "eventType", "xp", "createdAt"
) VALUES
  ('24000000-0000-4000-8000-000000000051', 'access-safe-user', '24000000-0000-4000-8000-000000000001', 1, 'PROGRAM_AI_MISSION_PROGRESS', '24000000-0000-4000-8000-000000000041', 'fixture:safe:xp', 'MISSION_COMPLETION', 40, '2026-08-02T00:00:00Z'),
  ('24000000-0000-4000-8000-000000000052', 'access-unknown-user', '24000000-0000-4000-8000-000000000001', 1, 'PROGRAM_AI_MISSION_PROGRESS', '24000000-0000-4000-8000-000000000042', 'fixture:unknown:xp', 'MISSION_COMPLETION', 60, '2026-08-02T00:00:00Z');

INSERT INTO "AnonymousProgrammeSession" (
  "id", "tokenHash", "missionState", "taskStates", "draft", "missionVersion", "evidenceVersion",
  "expiresAt", "lastActivityAt", "createdAt", "updatedAt", "deletedAt"
) VALUES (
  '24000000-0000-4000-8000-000000000061', 'access-safe-session-token-hash', 'COMPLETED',
  ARRAY['situation_submitted', 'starting_point_confirmed'], NULL, 'program-ai-01:v1', 'program-ai-evidence:v1',
  '2026-08-03T00:00:00Z', '2026-08-02T00:00:00Z', '2026-08-01T12:00:00Z', '2026-08-02T00:00:00Z', '2026-08-02T00:00:00Z'
);

INSERT INTO "PendingProgrammeClaim" (
  "id", "anonymousSessionId", "tokenHash", "expiresAt", "consumedAt", "consumedByUserId", "createdAt"
) VALUES (
  '24000000-0000-4000-8000-000000000071', '24000000-0000-4000-8000-000000000061',
  'access-safe-claim-token-hash', '2026-08-03T00:00:00Z', '2026-08-02T00:00:00Z', 'access-safe-user', '2026-08-01T12:30:00Z'
);

INSERT INTO "ProgrammeStartingPoint" (
  "id", "userId", "enrollmentId", "startingPoint", "desiredChange", "broadContext", "continuationCue",
  "chosenBoundaryAction", "provenance", "version", "confirmedAt", "createdAt", "updatedAt"
) VALUES (
  '24000000-0000-4000-8000-000000000081', 'access-safe-user', '24000000-0000-4000-8000-000000000031',
  'I pause before opening an app.', 'Pause first', 'NOT_SPECIFIED', 'Continue from the pause', NULL,
  'USER_CONFIRMED', 'program-ai-01:v1', '2026-08-02T00:00:00Z', '2026-08-02T00:00:00Z', '2026-08-02T00:00:00Z'
);
