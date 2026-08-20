-- Synthetic identity rows for the isolated post-0020 -> 0021 -> 0022 replay.
INSERT INTO "User" (
  "id", "name", "email", "emailVerified", "createdAt", "updatedAt"
) VALUES
  (
    'ba17-credential-user',
    'Better Auth credential fixture',
    'ba17-credential@invalid.example',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'ba17-google-user',
    'Better Auth Google fixture',
    'ba17-google@invalid.example',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  );

INSERT INTO "Account" (
  "id", "accountId", "providerId", "userId", "password", "createdAt", "updatedAt"
) VALUES
  (
    'ba17-credential-account',
    'ba17-credential-user',
    'credential',
    'ba17-credential-user',
    'synthetic-password-hash',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'ba17-google-account',
    'google-subject-fixture',
    'google',
    'ba17-google-user',
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  );

INSERT INTO "AdminUser" (
  "id", "userId", "email", "name", "role", "createdAt", "updatedAt"
) VALUES (
  '00000000-0000-4000-8000-000000000222',
  'ba17-credential-user',
  'ba17-admin@invalid.example',
  'Better Auth admin fixture',
  'AFFILIATE_MANAGER',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

INSERT INTO "CommercialOpportunity" (
  "id",
  "displayName",
  "normalizedName",
  "organizationType",
  "stage",
  "priority",
  "waitingOn",
  "ownerId",
  "creationIdempotencyKey",
  "createdBy",
  "updatedBy",
  "createdAt",
  "updatedAt"
) VALUES (
  '00000000-0000-4000-8000-000000000223',
  'Better Auth migration commercial fixture',
  'better auth migration commercial fixture',
  'AFFILIATE_NETWORK',
  'PROSPECT',
  'MEDIUM',
  'INTERNAL_ACTION',
  '00000000-0000-4000-8000-000000000222',
  'ba17-migration-commercial-fixture',
  'ba17-migration-fixture',
  'ba17-migration-fixture',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

INSERT INTO "CommercialEvidence" (
  "id",
  "opportunityId",
  "sourceType",
  "classification",
  "category",
  "status",
  "title",
  "claim",
  "observedAt",
  "contentFingerprint",
  "idempotencyKey",
  "recordedBy"
) VALUES (
  '00000000-0000-4000-8000-000000000224',
  '00000000-0000-4000-8000-000000000223',
  'INTERNAL_RECORD',
  'DETECTED',
  'IDENTITY',
  'CURRENT',
  'Synthetic migration preservation evidence',
  'This isolated fixture verifies Commercial data preservation only.',
  CURRENT_TIMESTAMP,
  'ba17-migration-commercial-fixture-fingerprint',
  'ba17-migration-commercial-evidence',
  'ba17-migration-fixture'
);
