import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AdminMfaEnrollmentForm } from "@/components/admin/AdminMfaEnrollmentForm";
import { AdminAccessDenied } from "@/components/admin/AdminAccessDenied";
import { Badge, Card, Container } from "@/components/ui";
import {
  getSafeAdminCallback,
  isAdminAuthError,
} from "@/lib/auth/policy";
import { requireStaff } from "@/lib/auth/staff";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Secure Admin account | B4GAMBLE",
  robots: { index: false, follow: false },
};

export default async function AdminMfaEnrollmentPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const callbackUrl = getSafeAdminCallback((await searchParams).callbackUrl);
  const requestHeaders = await headers();
  let staff;
  try {
    staff = await requireStaff({
      allowMfaEnrollment: true,
      callbackUrl,
      headers: requestHeaders,
      onUnauthenticated: "redirect",
    });
  } catch (error) {
    if (isAdminAuthError(error) && error.statusCode === 403) {
      return <AdminAccessDenied />;
    }
    throw error;
  }
  if (staff.user.twoFactorEnabled === true) redirect(callbackUrl);

  return (
    <main className="pageShell">
      <Container className="narrow">
        <Card className="adminLogin">
          <Badge tone="warning">Required security setup</Badge>
          <h1>Secure your Admin account</h1>
          <p className="lead">B4GAMBLE Admin requires a password plus a time-based code. Complete this setup before entering the CMS.</p>
          <AdminMfaEnrollmentForm callbackUrl={callbackUrl} />
          <p className="muted">No authenticator secret or backup code is sent to analytics or application logs.</p>
        </Card>
      </Container>
    </main>
  );
}
