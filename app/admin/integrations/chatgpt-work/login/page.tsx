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
import { resolveOperationalMcpResourceConfig } from "@/lib/mcp/operational-routing";
import { operationalMcpLabel, operationalMcpPermission } from "@/lib/mcp/operational-policy";

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
  const requestUrl = `${requestHeaders.get("x-forwarded-proto") ?? "https"}://${requestHeaders.get("host") ?? "b4gamble.com"}${returnTo}`;
  const requestedResource = new URL(returnTo, "https://b4gamble.com").searchParams.get("resource");
  const config = resolveOperationalMcpResourceConfig(requestUrl, requestedResource);
  const session = await getServerSession(requestHeaders);
  const staff = await getCurrentStaff(requestHeaders);

  if (staff && config && staff.permissions.includes(operationalMcpPermission(config))) redirect(returnTo);
  if (session && !staff) return <AdminAccessDenied />;
  if (staff) return <AdminPermissionDenied />;

  return (
    <main className="pageShell mcpAuthShell">
      <Container className="narrow">
        <Card className="adminLogin mcpAuthCard">
          <Badge tone="green">Secure staff authorization</Badge>
          <div>
            <p className="mcpAuthEyebrow">B4GAMBLE {config ? operationalMcpLabel(config) : "Operations"}</p>
            <h1>Sign in to continue to ChatGPT Work</h1>
          </div>
          <p className="lead">
            Use the Better Auth account linked to your B4GAMBLE staff profile.
            The exact operational permission is checked before consent and on every tool call.
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
