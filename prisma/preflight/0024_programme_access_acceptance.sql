DO $$
DECLARE
  migration_applied BOOLEAN;
BEGIN
  IF to_regclass('"User"') IS NULL
    OR to_regclass('"AnonymousProgrammeSession"') IS NULL
    OR to_regclass('"PendingProgrammeClaim"') IS NULL
    OR to_regclass('"ProgrammeStartingPoint"') IS NULL
    OR to_regclass('"ProgramEnrollment"') IS NULL
  THEN
    RAISE EXCEPTION '0024 preflight failed: required Programme relations are missing';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM "_prisma_migrations"
    WHERE "migration_name" = '0024_programme_access_acceptance'
      AND "finished_at" IS NOT NULL
      AND "rolled_back_at" IS NULL
  ) INTO migration_applied;

  IF migration_applied THEN
    IF to_regclass('"ProgrammeAccessAcceptance"') IS NULL
      OR NOT EXISTS (
        SELECT 1 FROM pg_type
        JOIN pg_namespace ON pg_namespace.oid = pg_type.typnamespace
        WHERE pg_type.typname = 'ProgrammeAccessAcceptanceSource'
          AND pg_namespace.nspname = current_schema()
      )
    THEN
      RAISE EXCEPTION '0024 preflight failed: applied migration objects are incomplete';
    END IF;
    RETURN;
  END IF;

  IF to_regclass('"ProgrammeAccessAcceptance"') IS NOT NULL
    OR EXISTS (
      SELECT 1 FROM pg_type
      JOIN pg_namespace ON pg_namespace.oid = pg_type.typnamespace
      WHERE pg_type.typname = 'ProgrammeAccessAcceptanceSource'
        AND pg_namespace.nspname = current_schema()
    )
  THEN
    RAISE EXCEPTION '0024 preflight failed: Programme access acceptance objects already exist';
  END IF;
END $$;
