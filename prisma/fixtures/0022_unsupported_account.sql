-- Synthetic unsupported legacy provider used only to prove that 0022 refuses
-- unknown issuer state without changing the existing Account row.
INSERT INTO "User" (
  "id", "name", "email", "emailVerified", "createdAt", "updatedAt"
) VALUES (
  'ba17-unsupported-user',
  'Better Auth unsupported provider fixture',
  'ba17-unsupported@invalid.example',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

INSERT INTO "Account" (
  "id", "accountId", "providerId", "userId", "createdAt", "updatedAt"
) VALUES (
  'ba17-unsupported-account',
  'unsupported-subject',
  'unsupported-provider',
  'ba17-unsupported-user',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);
