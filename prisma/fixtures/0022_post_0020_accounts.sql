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
