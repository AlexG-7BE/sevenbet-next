export const ADMIN_MFA_MANAGEMENT_PATHS = [
  "/two-factor/enable",
  "/two-factor/generate-backup-codes",
  "/two-factor/get-totp-uri",
] as const;

export const ADMIN_SESSION_CREATION_PATHS = [
  "/sign-in/email",
  "/two-factor/verify-totp",
  "/two-factor/verify-backup-code",
] as const;

export function isAdminMfaManagementPath(path?: string | null) {
  return ADMIN_MFA_MANAGEMENT_PATHS.some((candidate) => candidate === path);
}

export function isAllowedAdminSessionCreationPath(path?: string | null) {
  return ADMIN_SESSION_CREATION_PATHS.some((candidate) => candidate === path);
}
