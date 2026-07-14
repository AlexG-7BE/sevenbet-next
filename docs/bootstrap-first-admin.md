# Bootstrap the first Better Auth staff user

This one-time CLI flow creates or reuses a Better Auth email/password user and
links it to one existing `AdminUser` staff profile. It does not create staff
profiles, change roles, replace the preview-token authentication, or modify
admin routes.

## Prerequisites

- Migration `0003_auth_foundation` must already be applied.
- `DATABASE_URL`, `BETTER_AUTH_SECRET`, and `BETTER_AUTH_URL` must be configured
  in the local environment files used by the project.
- The target `AdminUser` must already exist.
- The password must contain at least 12 characters.

Confirm migration state before continuing:

```bash
npx prisma migrate status
```

The expected result includes three applied migrations and `Database schema is
up to date!`.

## Find the existing staff profile UUID

Use the PostgreSQL console provided by the database host and run this read-only
query:

```sql
SELECT id, email, name, role, "userId"
FROM "AdminUser"
ORDER BY "createdAt";
```

Copy the exact `id` UUID for the intended profile. Do not use a Better Auth
`User.id`; `BOOTSTRAP_ADMIN_PROFILE_ID` specifically expects `AdminUser.id`.

If the intended profile does not exist, stop. This bootstrap intentionally does
not create `AdminUser` records.

## Run once without storing bootstrap secrets

Read the values into non-exported shell variables. The password prompt is
silent, so the password is not written to shell history:

```bash
read -r "BOOTSTRAP_ADMIN_EMAIL?Admin email: "
read -r "BOOTSTRAP_ADMIN_NAME?Admin name: "
read -r "BOOTSTRAP_ADMIN_PROFILE_ID?AdminUser UUID: "
read -rs "BOOTSTRAP_ADMIN_PASSWORD?Admin password: "; echo

env \
  BOOTSTRAP_ADMIN_EMAIL="$BOOTSTRAP_ADMIN_EMAIL" \
  BOOTSTRAP_ADMIN_NAME="$BOOTSTRAP_ADMIN_NAME" \
  BOOTSTRAP_ADMIN_PASSWORD="$BOOTSTRAP_ADMIN_PASSWORD" \
  BOOTSTRAP_ADMIN_PROFILE_ID="$BOOTSTRAP_ADMIN_PROFILE_ID" \
  npm run auth:bootstrap-admin

unset BOOTSTRAP_ADMIN_EMAIL BOOTSTRAP_ADMIN_NAME \
  BOOTSTRAP_ADMIN_PASSWORD BOOTSTRAP_ADMIN_PROFILE_ID
```

The npm command loads `.env` and `.env.local` when those files exist. Inline
environment values take precedence and are available only to that command.

Do not put the bootstrap password in `.env`, `.env.local`, a command argument,
documentation, a ticket, or a Git-tracked file. If a real secret was typed
directly into a previous shell command, remove that history entry according to
the shell's history policy and rotate the password.

## What the command checks

The command:

1. validates all four bootstrap variables, the email, the UUID, and password
   length;
2. selects exactly one existing `AdminUser` by UUID;
3. rejects conflicting staff email or user links;
4. reuses an existing Better Auth user only when the normalized email matches
   and exactly one credential account exists;
5. otherwise calls Better Auth's official email/password signup API;
6. links `AdminUser.userId` in a serializable Prisma transaction; and
7. reads both records again and prints only non-secret identifiers, email, and
   role.

Better Auth signup runs with automatic sign-in disabled for this CLI. The
command does not print or persist a session token. It never creates an Account
or password hash directly through Prisma.

The flow is idempotent. Running it again with the same email and profile UUID
reuses the same `User`, credential `Account`, and staff link.

## Verify the link

Run this read-only query in the database console, replacing the placeholder
with the selected `AdminUser.id`:

```sql
SELECT
  au.id AS "adminUserId",
  au.email AS "staffProfileEmail",
  au.role,
  au."userId",
  u.email AS "betterAuthEmail"
FROM "AdminUser" AS au
LEFT JOIN "User" AS u ON u.id = au."userId"
WHERE au.id = '<ADMIN_USER_UUID>'::uuid;
```

`AdminUser.userId` should match the joined Better Auth user ID. The legacy
preview-token authentication remains active after this bootstrap; switching
admin login and permissions to Better Auth is a separate phase.
