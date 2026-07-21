"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { Badge, Card } from "@/components/ui";

export function AffiliateSidebar({ active }: { active: "overview" | "networks" | "programs" | "offers" }) {
  const items = [
    ["overview", "/admin/affiliate", "Overview"],
    ["networks", "/admin/affiliate/networks", "Networks"],
    ["programs", "/admin/affiliate/programs", "Programs"],
    ["offers", "/admin/affiliate/offers", "Offers & tracking"],
  ] as const;
  return (
    <aside className="affiliateSidebar" aria-label="Affiliate Builder navigation">
      <div><p className="eyebrow">Affiliate Builder</p><strong>Commercial data</strong></div>
      <nav>{items.map(([id, href, label]) => <Link aria-current={active === id ? "page" : undefined} className={active === id ? "active" : ""} href={href} key={id}>{label}</Link>)}</nav>
      <Card tone="soft"><Badge tone="green">Protected</Badge><p className="muted">All mutations require affiliate.manage and record the real staff actor.</p></Card>
    </aside>
  );
}

export function AffiliateHeader({ title, description, actions }: { title: string; description: string; actions?: ReactNode }) {
  return <header className="affiliateHeader"><div><p className="eyebrow">SevenBet Affiliate Platform</p><h2>{title}</h2><p className="muted">{description}</p></div>{actions}</header>;
}

export function AffiliateAdminLayout({ active, title, description, actions, children }: { active: "overview" | "networks" | "programs" | "offers"; title: string; description: string; actions?: ReactNode; children: ReactNode }) {
  return <div className="affiliateAdminLayout"><AffiliateSidebar active={active} /><div className="affiliateAdminContent"><AffiliateHeader title={title} description={description} actions={actions} />{children}</div></div>;
}

export function AffiliateStatusBar({ status, updatedAt, detail }: { status: string; updatedAt?: string | null; detail?: string }) {
  const active = status === "ACTIVE" || status === "Enabled";
  return <div className="affiliateStatusBar"><Badge tone={active ? "green" : "warning"}>{status}</Badge><span>{detail}</span>{updatedAt && <small>Updated {new Date(updatedAt).toLocaleString("en-US")}</small>}</div>;
}

export function AffiliateSaveBar({ dirty, saving, error, onSave, onReload }: { dirty: boolean; saving: boolean; error?: string; onSave: () => void; onReload: () => void }) {
  return <div className="affiliateSaveBar"><p className={error ? "builderError" : "muted"} role={error ? "alert" : "status"}>{error || (saving ? "Saving through the protected aggregate API..." : dirty ? "Unsaved changes" : "Saved to PostgreSQL")}</p><div>{error && <button className="button ghost" onClick={onReload} type="button">Reload</button>}<button className="button gold" disabled={!dirty || saving} onClick={onSave} type="button">{saving ? "Saving..." : "Save"}</button></div></div>;
}

export function AffiliateSectionLayout({ title, description, children, badge = "Editable" }: { title: string; description: string; children: ReactNode; badge?: string }) {
  return <section className="affiliateSection"><div className="affiliateSectionTitle"><Badge tone="green">{badge}</Badge><h3>{title}</h3><p className="muted">{description}</p></div>{children}</section>;
}
