DO $$
BEGIN
  IF to_regclass('public."User"') IS NULL
    OR to_regclass('public."ProgramEnrollment"') IS NULL
    OR to_regclass('public."AnonymousProgrammeSession"') IS NULL
    OR to_regclass('public."UserXpEvent"') IS NULL
  THEN
    RAISE EXCEPTION 'PROGRAM-AI M1 preflight failed: required Programme/identity relations are missing';
  END IF;
END $$;

SELECT COUNT(*) AS "duplicateUserEnrollments"
FROM (
  SELECT "userId", "programId"
  FROM "ProgramEnrollment"
  GROUP BY "userId", "programId"
  HAVING COUNT(*) > 1
) AS conflicts;
