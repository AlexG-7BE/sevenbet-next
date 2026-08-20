import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminAccessDenied } from "@/components/admin/AdminAccessDenied";
import { AdminPermissionDenied } from "@/components/admin/AdminPermissionDenied";
import { Badge, Card, Container } from "@/components/ui";
import { getServerSession } from "@/lib/auth/session";
import { getCurrentStaff } from "@/lib/auth/staff";
import { commercialMcpDisabledResponse, resolveCommercialMcpConfig } from "@/lib/mcp/commercial/config";
import { getCommercialMcpConsent } from "@/lib/mcp/commercial/oauth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Commercial Ops Consent | B4GAMBLE",
  robots: { index: false, follow: false },
};

export default async function CommercialMcpConsentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const requestHeaders = await headers();
  const session = await getServerSession(requestHeaders);
  const staff = await getCurrentStaff(requestHeaders);
  const oauthQuery = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) value.forEach((item) => oauthQuery.append(key, item));
    else if (value) oauthQuery.set(key, value);
  }
  const returnTo = `/admin/integrations/chatgpt-work/consent?${oauthQuery}`;

  if (!session) redirect(`/admin/integrations/chatgpt-work/login?returnTo=${encodeURIComponent(returnTo)}`);
  if (!staff) return <AdminAccessDenied />;
  if (!staff.permissions.includes("affiliate.manage")) return <AdminPermissionDenied />;

  const requestUrl = `${requestHeaders.get("x-forwarded-proto") ?? "https"}://${requestHeaders.get("host") ?? "b4gamble.com"}${returnTo}`;
  const config = resolveCommercialMcpConfig(requestUrl);
  if (!config) {
    const response = commercialMcpDisabledResponse();
    return <CommercialMcpConsentError message={(await response.json()).error_description} />;
  }
  let consent;
  try {
    consent = await getCommercialMcpConsent(oauthQuery.toString(), session.user.id, config, requestHeaders);
  } catch {
    return <CommercialMcpConsentError message="This authorization request is invalid, expired, or does not belong to this staff account." />;
  }

  return (
    <main className="pageShell mcpAuthShell">
      <Container className="narrow">
        <Card className="adminLogin mcpAuthCard">
          <Badge tone="green">Delegated commercial access</Badge>
          <div>
            <p className="mcpAuthEyebrow">{consent.client.name ?? "ChatGPT Work"}</p>
            <h1>Allow access to B4GAMBLE Commercial Ops?</h1>
          </div>
          <p className="lead">
            Signed in as {staff.name}. This grants the integration only the
            explicitly listed, staff-delegated CRM capabilities.
          </p>

          <section className="mcpPermissionList" aria-labelledby="mcp-permissions-title">
            <h2 id="mcp-permissions-title">Requested access</h2>
            {consent.scopes.includes("commercial:read") ? (
              <article>
                <strong>Read Commercial CRM research</strong>
                <span>List and inspect opportunities, evidence, contacts, tasks, drafts, and possible duplicates.</span>
              </article>
            ) : null}
            {consent.scopes.includes("commercial:safe_write") ? (
              <article>
                <strong>Write bounded research bundles</strong>
                <span>Create or update prospects, provenance, notes, tasks, next actions, drafts, evidenced received terms, and review proposals.</span>
              </article>
            ) : null}
            {consent.scopes.includes("offline_access") ? (
              <article>
                <strong>Stay connected</strong>
                <span>Use a revocable refresh token for this integration without storing your password.</span>
              </article>
            ) : null}
          </section>

          <aside className="mcpAuthorityBoundary">
            <strong>Not granted</strong>
            <p>Approval, ACTIVE status, sending, submission, terms acceptance, tracking activation, Production administration, and Programme/private data.</p>
          </aside>

          <form className="mcpConsentActions" action="/api/mcp/oauth/consent" method="post">
            <input name="oauth_query" type="hidden" value={oauthQuery.toString()} />
            <button className="button ghost" name="decision" type="submit" value="deny">Cancel</button>
            <button className="button gold" name="decision" type="submit" value="authorize">Authorize access</button>
          </form>
          <p className="muted">You can revoke this connection without changing your B4GAMBLE password.</p>
        </Card>
      </Container>
    </main>
  );
}

function CommercialMcpConsentError({ message }: { message: string }) {
  return (
    <main className="pageShell mcpAuthShell">
      <Container className="narrow">
        <Card className="adminLogin mcpAuthCard">
          <Badge tone="warning">Authorization unavailable</Badge>
          <h1>ChatGPT Work could not be authorized</h1>
          <p className="lead">{message}</p>
          <Link className="button ghost" href="/admin">Return to admin</Link>
        </Card>
      </Container>
    </main>
  );
}
