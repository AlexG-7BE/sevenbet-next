import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { AdminPageShell, AdminStatCard } from "@/components/admin/AdminShell";
import { AdminPermissionDenied } from "@/components/admin/AdminPermissionDenied";
import { Badge, Card } from "@/components/ui";
import { getAdminPageAccess } from "@/lib/auth/admin";
import { customerDetail } from "@/lib/customers/admin.server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Customer profile | B4GAMBLE", robots: { index: false, follow: false } };
const utc = (value: Date | null | undefined) => value ? value.toLocaleString("en-GB", { timeZone: "UTC" }) : "—";

export default async function CustomerPage({ params }: { params: Promise<{ customerId: string }> }) {
  if (!await getAdminPageAccess(await headers(), "customers")) return <AdminPermissionDenied />;
  const customer = await customerDetail((await params).customerId);
  if (!customer) notFound();
  const preference = customer.emailPreference;
  const enrollment = customer.programEnrollments[0];
  const completedSteps = enrollment?.missionProgress.filter((step) => step.status === "COMPLETED").length ?? 0;
  const eligible = customer.accountState === "ACTIVE" && customer.emailVerified
    && preference?.marketingAllowed && !preference.unsubscribedAt
    && preference.suppressionScope === "NONE";
  return (
    <AdminPageShell area="customers" title={customer.name || "Customer"} intro="One canonical Better Auth identity. Analytics remains observational and commercial history never exposes partner URLs or tokens." actions={<Link className="button ghost" href="/admin/customers">Back to customers</Link>}>
      <div className="adminStatsGrid">
        <AdminStatCard label="Account" value={customer.accountState} note={customer.emailVerified ? "Email verified" : "Email unverified"} />
        <AdminStatCard label="Marketing" value={eligible ? "Eligible" : "Not eligible"} note={preference?.suppressionScope === "NONE" ? "Current server state" : `Suppression: ${preference?.suppressionScope ?? "NONE"}`} />
        <AdminStatCard label="Programme" value={enrollment?.completedAt ? "Completed" : enrollment ? "In progress" : "Not started"} note={`${completedSteps}/10 mission records complete`} />
        <AdminStatCard label="Last seen" value={utc(customer.lastSeenAt)} note="UTC" />
      </div>
      <div className="customerDetailGrid">
        <Card className="adminPanel"><h2>Identity & acquisition</h2><dl className="customerFacts">
          <div><dt>Email</dt><dd>{customer.email}</dd></div><div><dt>Internal ID</dt><dd>{customer.id}</dd></div>
          <div><dt>Registered</dt><dd>{utc(customer.createdAt)}</dd></div><div><dt>Locale / GEO</dt><dd>{customer.preferredLocale ?? "—"} / {customer.signupCountryCode ?? "—"}</dd></div>
          <div><dt>Source</dt><dd>{customer.signupSource ?? customer.signupUtmSource ?? "—"}</dd></div><div><dt>Referrer host</dt><dd>{customer.signupReferrerHost ?? "—"}</dd></div>
          <div><dt>UTM medium</dt><dd>{customer.signupUtmMedium ?? "—"}</dd></div><div><dt>UTM campaign</dt><dd>{customer.signupUtmCampaign ?? "—"}</dd></div>
        </dl></Card>
        <Card className="adminPanel"><h2>Consent state</h2><dl className="customerFacts">
          <div><dt>Marketing allowed</dt><dd>{preference?.marketingAllowed ? "Yes" : "No"}</dd></div><div><dt>Email verified</dt><dd>{customer.emailVerified ? "Yes" : "No"}</dd></div>
          <div><dt>Consented</dt><dd>{utc(preference?.consentedAt)}</dd></div><div><dt>Unsubscribed</dt><dd>{utc(preference?.unsubscribedAt)}</dd></div>
          <div><dt>Suppression</dt><dd>{preference?.suppressionScope ?? "NONE"}</dd></div><div><dt>Reason</dt><dd>{preference?.suppressionReason ?? "—"}</dd></div>
        </dl><div className="customerTimeline">{customer.consentEvents.map((event) => <p key={event.id}><Badge>{event.purpose}</Badge><strong>{event.action}</strong><span>{event.source} · {utc(event.occurredAt)}</span></p>)}</div></Card>
      </div>
      <Card className="adminPanel"><h2>Programme summary</h2>{customer.programEnrollments.length ? customer.programEnrollments.map((item) => <section className="programmeAdminSummary" key={item.id}><div><strong>{item.program.title}</strong><span>Started {utc(item.startedAt)} · Completed {utc(item.completedAt)}</span></div><ol>{Array.from({ length: 10 }, (_, index) => { const step = item.missionProgress.find((candidate) => candidate.missionNumber === index + 1); return <li className={step?.status === "COMPLETED" ? "complete" : ""} key={index + 1}>Step {index + 1}<small>{step?.status ?? "NOT_STARTED"}</small></li>; })}</ol></section>) : <p className="muted">No canonical Programme enrollment.</p>}</Card>
      <div className="customerDetailGrid">
        <Card className="adminPanel"><h2>Recent activity</h2><div className="customerTimeline">{customer.analyticsEvents.map((event) => <p key={event.id}><Badge>{event.type.toLowerCase()}</Badge><strong>{event.pagePath ?? event.casino?.title ?? "Server event"}</strong><span>{utc(event.occurredAt)}{event.programmeStep ? ` · Step ${event.programmeStep}` : ""}</span></p>)}{!customer.analyticsEvents.length ? <span className="muted">No consented analytics events.</span> : null}</div></Card>
        <Card className="adminPanel"><h2>Email history</h2><div className="customerTimeline">{customer.emailMessages.map((message) => <p key={message.id}><Badge tone={message.status === "DELIVERED" || message.status === "SENT" ? "green" : message.status === "FAILED" || message.status === "BOUNCED" ? "warning" : undefined}>{message.status}</Badge><strong>{message.subject}</strong><span>{message.purpose} · v{message.template.version} · {utc(message.sentAt ?? message.queuedAt)}</span></p>)}{!customer.emailMessages.length ? <span className="muted">No email records.</span> : null}</div></Card>
      </div>
      <Card className="adminPanel"><h2>Safe commercial outbound history</h2><p className="muted">Internal IDs and normalized dimensions only. Destination URLs and partner tokens are intentionally absent.</p><div className="customerTimeline">{customer.outboundClicks.map((click) => <p key={click.id}><Badge tone={click.state === "SUCCEEDED" ? "green" : "warning"}>{click.state}</Badge><strong>{click.casino?.title ?? "Unresolved route"}{click.affiliateOffer?.publicLabel ? ` · ${click.affiliateOffer.publicLabel}` : ""}</strong><span>{click.countryCode ?? "—"} · {click.sourcePage ?? "Unknown source"} · {utc(click.attemptedAt)}{click.blockedReason ? ` · ${click.blockedReason}` : ""}</span></p>)}{!customer.outboundClicks.length ? <span className="muted">No attributed outbound history.</span> : null}</div></Card>
    </AdminPageShell>
  );
}
