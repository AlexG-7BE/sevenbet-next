const OAUTH_ACCOUNT_MATERIAL_FIELDS = [
  "accessToken",
  "refreshToken",
  "idToken",
  "accessTokenExpiresAt",
  "refreshTokenExpiresAt",
  "scope",
] as const;

type AccountWrite = Record<string, unknown>;

function hasOAuthAccountMaterial(account: AccountWrite) {
  return OAUTH_ACCOUNT_MATERIAL_FIELDS.some((field) =>
    Object.prototype.hasOwnProperty.call(account, field),
  );
}

/**
 * Better Auth 1.6.23 passes only partial data to account.update.before, so an
 * OAuth token update does not always carry providerId. Google is the only
 * configured social provider; credential password writes carry no OAuth
 * fields and are explicitly preserved.
 */
export function sanitizeIdentityOnlyOAuthAccount<T extends AccountWrite>(
  account: T,
): T {
  if (account.providerId === "credential") return account;
  if (account.providerId !== "google" && !hasOAuthAccountMaterial(account)) {
    return account;
  }

  return {
    ...account,
    accessToken: null,
    refreshToken: null,
    idToken: null,
    accessTokenExpiresAt: null,
    refreshTokenExpiresAt: null,
    scope: null,
  };
}

export const identityOnlyOAuthAccountDatabaseHooks = {
  account: {
    create: {
      before: async (account: AccountWrite) => ({
        data: sanitizeIdentityOnlyOAuthAccount(account),
      }),
    },
    update: {
      before: async (account: AccountWrite) => ({
        data: sanitizeIdentityOnlyOAuthAccount(account),
      }),
    },
  },
};

export const IDENTITY_ONLY_DISABLED_AUTH_PATHS = [
  "/get-access-token",
  "/refresh-token",
  "/account-info",
] as const;
