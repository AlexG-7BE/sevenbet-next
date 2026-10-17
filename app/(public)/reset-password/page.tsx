import type { Metadata } from "next";

import { PasswordResetExperience } from "@/components/auth/PasswordResetExperience";
import { passwordResetView } from "@/lib/auth/password-reset";
import { safeAuthReturnTo } from "@/lib/auth/return-to";
import { programmeText } from "@/lib/i18n/programme-catalog";
import { programmeLocaleFromPath } from "@/lib/programme/presentation";
import { withSiteName } from "@/lib/site/help-copy";
import { resolveServerSite } from "@/lib/site/server-site";

export const dynamic = "force-dynamic";

type ResetPasswordPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function single(value: string | string[] | undefined) {
  return typeof value === "string" ? value : null;
}

export async function generateMetadata({ searchParams }: ResetPasswordPageProps): Promise<Metadata> {
  const query = await searchParams;
  const locale = programmeLocaleFromPath(safeAuthReturnTo(single(query.returnTo))) ?? "en-GB";
  const site = await resolveServerSite();
  return {
    title: withSiteName(programmeText(locale, "Reset password | B4GAMBLE"), site),
    description: withSiteName(programmeText(locale, "Choose a new password for your B4GAMBLE account."), site),
    robots: { index: false, follow: false },
  };
}

// Requests a reset link, and receives Better Auth's emailed link as
// `?token=…` (or `?error=INVALID_TOKEN` for a used or expired one).
export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const query = await searchParams;
  const returnTo = safeAuthReturnTo(single(query.returnTo));
  const locale = programmeLocaleFromPath(returnTo) ?? "en-GB";
  const view = passwordResetView({ token: single(query.token), error: single(query.error) });

  return <PasswordResetExperience locale={locale} returnTo={returnTo} view={view} />;
}
