DO $$
BEGIN
  IF to_regclass('public."User"') IS NULL
    OR to_regclass('public."ProgramEnrollment"') IS NULL
    OR to_regclass('public."AnonymousProgrammeSession"') IS NULL
    OR to_regclass('public."UserXpEvent"') IS NULL
  THEN
    RAISE EXCEPTION 'PROGRAM-AI M1 preflight failed: required Programme/identity relations are missing';
  END IF;

  IF (to_regclass('public."ProgrammeSensitiveInputAuthority"') IS NULL)
    <> (to_regclass('public."ProgrammeStartingPoint"') IS NULL)
  THEN
    RAISE EXCEPTION 'PROGRAM-AI M1 preflight failed: partial target schema detected';
  END IF;

  IF to_regclass('public."ProgrammeSensitiveInputAuthority"') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conrelid = 'public."ProgrammeSensitiveInputAuthority"'::regclass
        AND conname = 'ProgrammeSensitiveInputAuthority_subject_check'
        AND pg_get_constraintdef(oid) LIKE '%<>%'
    ) THEN
      RAISE EXCEPTION 'PROGRAM-AI M1 preflight failed: exact-one authority subject constraint is missing';
    END IF;

    IF EXISTS (
      SELECT 1
      FROM "ProgrammeSensitiveInputAuthority"
      WHERE ("anonymousSessionId" IS NOT NULL) = ("userId" IS NOT NULL)
    ) THEN
      RAISE EXCEPTION 'PROGRAM-AI M1 preflight failed: invalid authority subject row detected';
    END IF;
  END IF;
END $$;

SELECT COUNT(*) AS "duplicateUserEnrollments"
FROM (
  SELECT "userId", "programId"
  FROM "ProgramEnrollment"
  GROUP BY "userId", "programId"
  HAVING COUNT(*) > 1
) AS conflicts;
