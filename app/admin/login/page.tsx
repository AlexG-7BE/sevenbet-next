import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { Badge, Button, Card, Container } from "@/components/ui";
import { getCurrentStaff } from "@/lib/auth/staff";
import { getSafeAdminCallback } from "@/lib/auth/policy";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "CMS Login | SevenBet",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const callbackUrl = getSafeAdminCallback(
    (await searchParams).callbackUrl,
  );
  const staff = await getCurrentStaff(await headers());

  if (staff) redirect(callbackUrl);

  return (
    <div className="pageShell">
      <Container className="narrow">
        <Card className="adminLogin">
          <Badge tone="green">Secure staff access</Badge>
          <h1>SevenBet CMS Login</h1>
          <p className="lead">
            Sign in with the Better Auth account linked to your SevenBet staff
            profile.
          </p>
          <AdminLoginForm callbackUrl={callbackUrl} />
          <p className="muted">
            Access is checked again on the server for every protected page and
            admin API request.
          </p>
          <Button href="/" variant="ghost">
            Return to site
          </Button>
        </Card>
      </Container>
    </div>
  );
}
