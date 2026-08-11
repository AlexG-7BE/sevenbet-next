DO $$
BEGIN
  IF to_regclass('public."AnonymousProgrammeSession"') IS NULL
    OR to_regclass('public."PendingProgrammeClaim"') IS NULL
  THEN
    RAISE EXCEPTION 'Programme runtime hardening preflight failed: required Programme relations are missing';
  END IF;

  IF to_regclass('public."ProgrammeRuntimeRateLimitBucket"') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conrelid = 'public."ProgrammeRuntimeRateLimitBucket"'::regclass
        AND conname = 'ProgrammeRuntimeRateLimitBucket_scope_check'
        AND pg_get_constraintdef(oid) LIKE '%PROGRAMME_MUTATION_SESSION%'
    ) THEN
      RAISE EXCEPTION 'Programme runtime hardening preflight failed: target table has an incompatible scope contract';
    END IF;

    IF EXISTS (
      SELECT 1
      FROM "ProgrammeRuntimeRateLimitBucket"
      WHERE "count" <= 0 OR "expiresAt" <= "windowStartedAt"
    ) THEN
      RAISE EXCEPTION 'Programme runtime hardening preflight failed: invalid target bucket row detected';
    END IF;
  END IF;
END $$;
