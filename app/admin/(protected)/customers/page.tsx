import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";

import { AdminPageShell, AdminStatCard } from "@/components/admin/AdminShell";
import { AdminPermissionDenied } from "@/components/admin/AdminPermissionDenied";
import { Badge, Card } from "@/components/ui";
import { getAdminPageAccess } from "@/lib/auth/admin";
import { listCustomers, type CustomerListFilters } from "@/lib/customers/admin.server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Customers | B4GAMBLE", robots: { index: false, follow: false } };

export default async function CustomersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  if (!await getAdminPageAccess(await headers(), "customers")) return <AdminPermissionDenied />;
  const search = await searchParams;
  const filters: CustomerListFilters = {
    query: search.q,
    accountState: search.state === "ACTIVE" || search.state === "SUSPENDED" ? search.state : undefined,
    marketing: ["allowed", "not-allowed", "suppressed"].includes(search.marketing ?? "") ? search.marketing as "allowed" | "not-allowed" | "suppressed" : undefined,
    programme: ["started", "completed", "not-completed", "not-started"].includes(search.programme ?? "") ? search.programme as "started" | "completed" | "not-completed" | "not-started" : undefined,
  };
  const result = await listCustomers(filters);
  const verified = result.customers.filter((customer) => customer.emailVerified).length;
  const subscribed = result.customers.filter((customer) => customer.accountState === "ACTIVE"
    && customer.emailVerified
    && customer.emailPreference?.marketingAllowed
    && !customer.emailPreference.unsubscribedAt
    && customer.emailPreference.suppressionScope === "NONE").length;
  const programmeStarted = result.customers.filter((customer) => customer.programEnrollments.length).length;
  return (
    <AdminPageShell area="customers" title="Customers" intro="Canonical registered identities, consent, Programme state, email delivery, and safe outbound history. This is not a sales CRM.">
      <div className="adminStatsGrid">
        <AdminStatCard label="Matching customers" value={result.total} note={result.truncated ? "Showing the newest 100" : "Complete filtered result"} />
        <AdminStatCard label="Email verified" value={verified} note="Visible rows" />
        <AdminStatCard label="Marketing eligible" value={subscribed} note="Visible rows; rechecked before delivery" />
        <AdminStatCard label="Programme started" value={programmeStarted} note="Canonical enrollment exists" />
      </div>
      <Card className="adminPanel">
        <form className="customerFilters" method="get">
          <label><span>Search email or internal ID</span><input defaultValue={search.q} name="q" placeholder="customer@example.com or ID" /></label>
          <label><span>Account</span><select defaultValue={search.state ?? ""} name="state"><option value="">Any state</option><option>ACTIVE</option><option>SUSPENDED</option></select></label>
          <label><span>Marketing</span><select defaultValue={search.marketing ?? ""} name="marketing"><option value="">Any consent</option><option value="allowed">Allowed</option><option value="not-allowed">Not allowed</option><option value="suppressed">Suppressed</option></select></label>
          <label><span>Programme</span><select defaultValue={search.programme ?? ""} name="programme"><option value="">Any state</option><option value="started">Started</option><option value="completed">Completed</option><option value="not-completed">Started, not completed</option><option value="not-started">Not started</option></select></label>
          <button className="button" type="submit">Apply filters</button>
        </form>
        <div className="customerTable" role="table" aria-label="Customers">
          <div className="customerTableRow customerTableHead" role="row"><span>Email / identity</span><span>Account</span><span>Consent</span><span>Programme</span><span>Last seen</span></div>
          {result.customers.map((customer) => {
            const enrollment = customer.programEnrollments[0];
            const eligible = customer.emailPreference?.marketingAllowed && !customer.emailPreference.unsubscribedAt && customer.emailPreference.suppressionScope === "NONE";
            return <Link className="customerTableRow" href={`/admin/customers/${encodeURIComponent(customer.id)}`} key={customer.id} role="row">
              <span><strong>{customer.email}</strong><small>{customer.id}</small></span>
              <span><Badge tone={customer.accountState === "ACTIVE" ? "green" : "warning"}>{customer.accountState}</Badge><small>{customer.emailVerified ? "Verified" : "Unverified"}</small></span>
              <span><Badge tone={eligible ? "green" : customer.emailPreference?.suppressionScope !== "NONE" ? "warning" : undefined}>{eligible ? "Allowed" : customer.emailPreference?.suppressionScope !== "NONE" ? "Suppressed" : "Not allowed"}</Badge></span>
              <span>{enrollment ? enrollment.completedAt ? "Completed" : "In progress" : "Not started"}</span>
              <span>{customer.lastSeenAt ? customer.lastSeenAt.toLocaleString("en-GB", { timeZone: "UTC" }) : "—"}</span>
            </Link>;
          })}
          {!result.customers.length ? <p className="adminEmptyState">No customers match these filters.</p> : null}
        </div>
      </Card>
    </AdminPageShell>
  );
}
