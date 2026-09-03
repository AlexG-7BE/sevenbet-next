export const PARTNER_PREVIEW_COOKIE = "b4gamble_partner_preview";

export type PartnerPreviewEnvironment = {
  NODE_ENV?: string;
  VERCEL_ENV?: string;
  SEVENBET_PARTNER_PREVIEW_TOKEN?: string;
  SEVENBET_ADMIN_PREVIEW_TOKEN?: string;
};

export function partnerPreviewEnabled(environment: PartnerPreviewEnvironment = process.env) {
  return environment.VERCEL_ENV === "preview"
    || (!environment.VERCEL_ENV && environment.NODE_ENV === "development");
}

export function partnerPreviewConfiguredToken(environment: PartnerPreviewEnvironment = process.env) {
  const token = environment.SEVENBET_PARTNER_PREVIEW_TOKEN?.trim()
    || environment.SEVENBET_ADMIN_PREVIEW_TOKEN?.trim()
    || null;
  return token && token.length >= 24 ? token : null;
}

export function partnerPreviewAuthorized(providedToken: string | null | undefined, environment: PartnerPreviewEnvironment = process.env) {
  const configured = partnerPreviewConfiguredToken(environment);
  return partnerPreviewEnabled(environment) && Boolean(configured && providedToken && configured === providedToken);
}
