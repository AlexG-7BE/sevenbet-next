import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LoginExperience } from "@/components/auth/LoginExperience";
import { isGoogleAuthAvailable } from "@/lib/auth/google-config";
import { safeAuthReturnTo } from "@/lib/auth/return-to";
import { getServerSession } from "@/lib/auth/session";
import { programmeText } from "@/lib/i18n/programme-catalog";
import { programmeLocaleFromPath, programmePath } from "@/lib/programme/presentation";

export const dynamic = "force-dynamic";

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function single(value: string | string[] | undefined) {
  return typeof value === "string" ? value : null;
}

export async function generateMetadata({ searchParams }: LoginPageProps): Promise<Metadata> {
  const query = await searchParams;
  const returnTo = safeAuthReturnTo(single(query.returnTo));
  const locale = programmeLocaleFromPath(returnTo) ?? "en-GB";
  return {
    title: programmeText(locale, "Log in | B4GAMBLE"),
    description: programmeText(locale, "Access your private B4GAMBLE Programme account."),
    robots: { index: false, follow: true },
  };
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const query = await searchParams;
  const authState = single(query.auth);
  const authError = single(query.error);
  const returnTo = safeAuthReturnTo(single(query.returnTo));
  const locale = programmeLocaleFromPath(returnTo) ?? "en-GB";
  const session = await getServerSession();
  const recovery = (authState === "google-error" && authError === "account_not_linked")
    || authState === "google-link-error";

  if (session?.user && !recovery) redirect(returnTo);

  return <LoginExperience authError={authError} authState={authState} googleAvailable={isGoogleAuthAvailable()} locale={locale} programmePath={programmePath(locale)} returnTo={returnTo} />;
}
