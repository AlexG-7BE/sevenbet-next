type GoogleAuthEnvironment = {
  [key: string]: string | undefined;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
};

export type GoogleAuthConfig = {
  clientId: string;
  clientSecret: string;
};

export function resolveGoogleAuthConfig(
  environment: GoogleAuthEnvironment = process.env,
): GoogleAuthConfig | null {
  const clientId = environment.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = environment.GOOGLE_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) return null;

  return { clientId, clientSecret };
}

export function isGoogleAuthAvailable(
  environment: GoogleAuthEnvironment = process.env,
) {
  return resolveGoogleAuthConfig(environment) !== null;
}
