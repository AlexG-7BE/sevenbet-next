import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AdminMfaChallengeForm } from "@/components/admin/AdminMfaChallengeForm";
import { Badge, Button, Card, Container } from "@/components/ui";
import { getSafeAdminCallback } from "@/lib/auth/policy";
import { getCurrentStaff } from "@/lib/auth/staff";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Verify Admin sign-in | B4GAMBLE",
  robots: { index: false, follow: false },
};

export default async function AdminTwoFactorPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const callbackUrl = getSafeAdminCallback((await searchParams).callbackUrl);
  const staff = await getCurrentStaff(await headers());
  if (staff?.user.twoFactorEnabled === true) redirect(callbackUrl);
  if (staff) redirect(`/admin/security/enroll?callbackUrl=${encodeURIComponent(callbackUrl)}`);

  return (
    <main className="pageShell">
      <Container className="narrow">
        <Card className="adminLogin">
          <Badge tone="green">Second-factor check</Badge>
          <h1>Verify Admin sign-in</h1>
          <p className="lead">Enter the current code from your authenticator app. This browser will not be remembered as trusted.</p>
          <AdminMfaChallengeForm callbackUrl={callbackUrl} />
          <Button href="/" variant="ghost">Return to site</Button>
        </Card>
      </Container>
    </main>
  );
}
