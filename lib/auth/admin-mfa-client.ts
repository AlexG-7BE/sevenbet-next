type AdminMfaClientError = {
  code?: string;
  status?: number;
};

export function adminMfaVerificationErrorMessage(error: AdminMfaClientError) {
  if (
    error.status === 429
    || error.code === "ACCOUNT_TEMPORARILY_LOCKED"
    || error.code === "TOO_MANY_ATTEMPTS_REQUEST_NEW_CODE"
  ) {
    return "Verification is temporarily limited. Wait before trying again; do not submit repeated codes.";
  }

  if (
    error.code === "INVALID_TWO_FACTOR_COOKIE"
    || error.code === "ADMIN_AUTH_REQUIRED"
  ) {
    return "Your sign-in session is no longer valid. Sign in again, then restart setup.";
  }

  if (error.code === "INVALID_CODE") {
    return "This code does not match the current setup. Confirm your phone uses automatic date and time, scan the current QR code, then enter one fresh code.";
  }

  return "Verification could not be completed. Sign in again, then restart setup.";
}
