import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AdminAccessDenied } from "@/components/admin/AdminAccessDenied";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { AdminPermissionDenied } from "@/components/admin/AdminPermissionDenied";
import { Badge, Button, Card, Container } from "@/components/ui";
import { getServerSession } from "@/lib/auth/session";
import { getCurrentStaff } from "@/lib/auth/staff";
import { safeCommercialMcpReturnTo } from "@/lib/mcp/commercial/ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Authorize ChatGPT Work | B4GAMBLE",
  robots: { index: false, follow: false },
};

export default async function CommercialMcpLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const returnTo = safeCommercialMcpReturnTo((await searchParams).returnTo);
  const requestHeaders = await headers();
  const session = await getServerSession(requestHeaders);
  const staff = await getCurrentStaff(requestHeaders);

  if (staff?.permissions.includes("affiliate.manage")) redirect(returnTo);
  if (session && !staff) return <AdminAccessDenied />;
  if (staff) return <AdminPermissionDenied />;

  return (
    <main className="pageShell mcpAuthShell">
      <Container className="narrow">
        <Card className="adminLogin mcpAuthCard">
          <Badge tone="green">Secure staff authorization</Badge>
          <div>
            <p className="mcpAuthEyebrow">B4GAMBLE Commercial Ops</p>
            <h1>Sign in to continue to ChatGPT Work</h1>
          </div>
          <p className="lead">
            Use the Better Auth account linked to your B4GAMBLE staff profile.
            Commercial permission is checked before consent and on every tool call.
          </p>
          <AdminLoginForm callbackUrl={returnTo} />
          <p className="muted">
            A normal customer account cannot authorize this integration.
          </p>
          <Button href="/admin" variant="ghost">Return to admin</Button>
        </Card>
      </Container>
    </main>
  );
}
