"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Badge, Card } from "@/components/ui";
import type { AffiliateNetworkRecord, AffiliateOfferListRecord, AffiliateProgramRecord, AffiliateReferenceData } from "@/lib/affiliate/admin-types";
import type { RoutingCandidate } from "@/lib/affiliate/routing-preview";

import { AffiliateAdminLayout } from "./AffiliateShell";

async function json<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Request failed");
  return result as T;
}

function statusTone(status: string) {
  return status === "ACTIVE" ? "green" as const : "warning" as const;
}

export function AffiliateDashboard() {
  const [counts, setCounts] = useState({ networks: 0, programs: 0, offers: 0, activeOffers: 0 });
  const [error, setError] = useState("");
  useEffect(() => {
    Promise.all([
      json<{ records: AffiliateNetworkRecord[] }>("/api/admin/affiliate/networks"),
      json<{ records: AffiliateProgramRecord[] }>("/api/admin/affiliate/programs"),
      json<{ records: AffiliateOfferListRecord[] }>("/api/admin/affiliate/offers"),
    ]).then(([networks, programs, offers]) => setCounts({ networks: networks.records.length, programs: programs.records.length, offers: offers.records.length, activeOffers: offers.records.filter((item) => item.status === "ACTIVE").length })).catch((caught) => setError(caught instanceof Error ? caught.message : "Unable to load affiliate data"));
  }, []);
  return <AffiliateAdminLayout active="overview" title="Affiliate overview" description="Manage network relationships, operator programs, GEO offers and verified tracking destinations.">
    {error && <p className="builderError" role="alert">{error}</p>}
    <div className="affiliateMetricGrid">
      {[ ["Networks", counts.networks, "/admin/affiliate/networks"], ["Programs", counts.programs, "/admin/affiliate/programs"], ["Offers", counts.offers, "/admin/affiliate/offers"], ["Active offers", counts.activeOffers, "/admin/affiliate/offers?status=ACTIVE"] ].map(([label, value, href]) => <Card key={label}><span className="muted">{label}</span><strong>{value}</strong><Link href={String(href)}>Open</Link></Card>)}
    </div>
    <RoutingCandidatePreview />
  </AffiliateAdminLayout>;
}

type ListKind = "networks" | "programs" | "offers";
type AffiliateListFilters = { search: string; status: string; networkId: string; programId: string; casinoId: string; country: string; currency: string };

const emptyListFilters: AffiliateListFilters = { search: "", status: "", networkId: "", programId: "", casinoId: "", country: "", currency: "" };

export function AffiliateListPage({ kind, initialFilters = {} }: { kind: ListKind; initialFilters?: Partial<AffiliateListFilters> }) {
  const [records, setRecords] = useState<Array<AffiliateNetworkRecord | AffiliateProgramRecord | AffiliateOfferListRecord>>([]);
  const [references, setReferences] = useState<AffiliateReferenceData>({ networks: [], programs: [], casinos: [] });
  const [filters, setFilters] = useState<AffiliateListFilters>({ ...emptyListFilters, ...initialFilters });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.status) kind === "networks" ? params.set("active", filters.status) : params.set("status", filters.status);
    for (const key of ["networkId", "programId", "casinoId", "country", "currency"] as const) if (filters[key]) params.set(key, filters[key]);
    try {
      const result = await json<{ records: typeof records }>(`/api/admin/affiliate/${kind}?${params}`);
      setRecords(result.records);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to load records"); }
    finally { setLoading(false); }
  }, [filters, kind]);
  useEffect(() => { json<{ networks: AffiliateNetworkRecord[]; programs: AffiliateProgramRecord[]; casinos: AffiliateReferenceData["casinos"] }>("/api/admin/affiliate/reference-data").then(setReferences).catch(() => undefined); }, []);
  useEffect(() => { void load(); }, [load]);
  const title = kind[0].toUpperCase() + kind.slice(1);
  return <AffiliateAdminLayout active={kind} title={title} description={`Search and manage bounded ${kind} records with deterministic sorting.`} actions={<Link className="button gold" href={`/admin/affiliate/${kind}/new`}>Create {kind.slice(0, -1)}</Link>}>
    <Card className="affiliateFilters">
      <input aria-label={`Search ${kind}`} onChange={(event) => setFilters((value) => ({ ...value, search: event.target.value }))} placeholder={`Search ${kind}...`} value={filters.search} />
      <select aria-label="Status" onChange={(event) => setFilters((value) => ({ ...value, status: event.target.value }))} value={filters.status}><option value="">All statuses</option>{kind === "networks" ? <><option value="true">Active</option><option value="false">Inactive</option></> : ["DRAFT", "ACTIVE", "PAUSED", "EXPIRED", "ARCHIVED"].map((value) => <option key={value}>{value}</option>)}</select>
      {kind !== "networks" && <select aria-label="Network" onChange={(event) => setFilters((value) => ({ ...value, networkId: event.target.value }))} value={filters.networkId}><option value="">All networks</option>{references.networks.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>}
      {kind === "offers" && <><select aria-label="Program" onChange={(event) => setFilters((value) => ({ ...value, programId: event.target.value }))} value={filters.programId}><option value="">All programs</option>{references.programs.filter((item) => !filters.networkId || item.networkId === filters.networkId).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><select aria-label="Casino" onChange={(event) => setFilters((value) => ({ ...value, casinoId: event.target.value }))} value={filters.casinoId}><option value="">All casinos</option>{references.casinos.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select><input aria-label="Country" maxLength={2} onChange={(event) => setFilters((value) => ({ ...value, country: event.target.value.toUpperCase() }))} placeholder="GEO" value={filters.country} /><input aria-label="Currency" maxLength={3} onChange={(event) => setFilters((value) => ({ ...value, currency: event.target.value.toUpperCase() }))} placeholder="Currency" value={filters.currency} /></>}
      <button className="button ghost" onClick={() => void load()} type="button">Refresh</button>
    </Card>
    {error && <p className="builderError" role="alert">{error}</p>}
    <div className="affiliateRecordList" aria-busy={loading}>
      {records.map((item) => {
        if (kind === "networks") { const record = item as AffiliateNetworkRecord; return <Card key={record.id}><div><Badge tone={record.active ? "green" : "warning"}>{record.active ? "ACTIVE" : "ARCHIVED"}</Badge><h3>{record.name}</h3><p className="muted">{record.type.replaceAll("_", " ")} · {record.slug}</p></div><Link className="button ghost" href={`/admin/affiliate/networks/${record.id}`}>Edit</Link></Card>; }
        if (kind === "programs") { const record = item as AffiliateProgramRecord; return <Card key={record.id}><div><Badge tone={statusTone(record.status)}>{record.status}</Badge><h3>{record.name}</h3><p className="muted">{record.network.name} · {record.operator} · {record._count.offers} offers</p></div><Link className="button ghost" href={`/admin/affiliate/programs/${record.id}`}>Edit</Link></Card>; }
        const record = item as AffiliateOfferListRecord; return <Card key={record.id}><div><div className="badgeCluster"><Badge tone={statusTone(record.status)}>{record.status}</Badge><Badge>{record.program.network.name}</Badge><Badge>{record._count.trackingLinks} links</Badge></div><h3>{record.internalName}</h3><p className="muted">{record.casino.title} · {record.casinoBonus?.title || "Casino-level"} · priority {record.priority}</p></div><Link className="button ghost" href={`/admin/affiliate/offers/${record.id}`}>Edit</Link></Card>;
      })}
      {!loading && !records.length && <Card><p className="muted">No records match the current filters.</p></Card>}
    </div>
  </AffiliateAdminLayout>;
}

export function RoutingCandidatePreview() {
  const [references, setReferences] = useState<AffiliateReferenceData>({ networks: [], programs: [], casinos: [] });
  const [bonuses, setBonuses] = useState<Array<{ id: string; title: string }>>([]);
  const [input, setInput] = useState({ casinoId: "", casinoBonusId: "", countryCode: "", currencyCode: "" });
  const [candidates, setCandidates] = useState<RoutingCandidate[]>([]);
  const [error, setError] = useState("");
  useEffect(() => { json<AffiliateReferenceData & { ok: boolean }>("/api/admin/affiliate/reference-data").then(setReferences).catch(() => undefined); }, []);
  useEffect(() => {
    if (!input.casinoId) { setBonuses([]); return; }
    json<{ casino: { casinoBonuses: Array<{ id: string; title: string }> } }>(`/api/admin/casinos/${input.casinoId}`).then((data) => setBonuses(data.casino.casinoBonuses)).catch(() => setBonuses([]));
  }, [input.casinoId]);
  async function preview() {
    setError("");
    try {
      const result = await json<{ candidates: RoutingCandidate[] }>("/api/admin/affiliate/preview", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(input) });
      setCandidates(result.candidates);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to preview routing"); }
  }
  return <Card className="affiliatePreview"><div className="affiliateSectionTitle"><Badge>Preview only</Badge><h3>Routing candidate preview</h3><p className="muted">Inspect deterministic selection without changing `/go/[slug]` or issuing a redirect.</p></div><div className="affiliateFilters"><select aria-label="Preview casino" onChange={(event) => setInput((value) => ({ ...value, casinoId: event.target.value, casinoBonusId: "" }))} value={input.casinoId}><option value="">Select casino</option>{references.casinos.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select><select aria-label="Preview bonus" onChange={(event) => setInput((value) => ({ ...value, casinoBonusId: event.target.value }))} value={input.casinoBonusId}><option value="">Casino-level</option>{bonuses.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select><input aria-label="Preview country" maxLength={2} onChange={(event) => setInput((value) => ({ ...value, countryCode: event.target.value.toUpperCase() }))} placeholder="Country" value={input.countryCode} /><input aria-label="Preview currency" maxLength={3} onChange={(event) => setInput((value) => ({ ...value, currencyCode: event.target.value.toUpperCase() }))} placeholder="Currency" value={input.currencyCode} /><button className="button gold" disabled={!input.casinoId} onClick={preview} type="button">Run preview</button></div>{error && <p className="builderError" role="alert">{error}</p>}<div className="affiliateCandidateList">{candidates.map((item) => <article className={item.chosen ? "chosen" : ""} key={item.trackingLinkId}><div><div className="badgeCluster">{item.chosen && <Badge tone="green">Winner</Badge>}<Badge>{item.specificity}</Badge><Badge>Priority {item.priority}</Badge></div><strong>{item.label}</strong><span>{item.network} · {item.program}</span></div><small>Verified {item.verifiedAt ? new Date(item.verifiedAt).toLocaleDateString("en-US") : "not yet"}</small></article>)}</div>{!error && input.casinoId && !candidates.length && <p className="muted">No eligible candidates. Run the preview after selecting targeting inputs.</p>}</Card>;
}

function offerTargetingSummary(offer: AffiliateOfferListRecord) {
  const geo = offer.geoMode === "GLOBAL" ? "Global GEO" : `${offer.geoMode}: ${offer.countries.map((item) => item.countryCode).join(", ")}`;
  const currencies = offer.currencies.length ? offer.currencies.map((item) => item.currencyCode).join(", ") : "all currencies";
  return `${geo} · ${currencies}`;
}

export function CasinoAffiliatePanel({ casinoId }: { casinoId: string }) {
  const [offers, setOffers] = useState<AffiliateOfferListRecord[]>([]);
  const [error, setError] = useState("");
  useEffect(() => { json<{ records: AffiliateOfferListRecord[] }>(`/api/admin/affiliate/offers?casinoId=${encodeURIComponent(casinoId)}`).then((result) => setOffers(result.records)).catch((caught) => setError(caught instanceof Error ? caught.message : "Unable to load affiliate offers")); }, [casinoId]);
  return <div className="casinoAffiliatePanel"><div className="builderActions"><Link className="button gold" href={`/admin/affiliate/offers/new?casinoId=${encodeURIComponent(casinoId)}`}>Create draft offer</Link><Link className="button ghost" href={`/admin/affiliate/offers?casinoId=${encodeURIComponent(casinoId)}`}>Open Affiliate Builder</Link></div>{error && <p className="builderError" role="alert">{error}</p>}<div className="affiliateRecordList">{offers.map((offer) => <Card key={offer.id}><div><div className="badgeCluster"><Badge tone={statusTone(offer.status)}>{offer.status}</Badge><Badge>{offer.program.network.name}</Badge></div><h3>{offer.internalName}</h3><p className="muted">{offer.program.name} · {offer.casinoBonus?.title || "Casino-level"} · {offerTargetingSummary(offer)} · {offer.trackingLinks.length} active tracking links</p></div><Link className="button ghost" href={`/admin/affiliate/offers/${offer.id}`}>Edit offer</Link></Card>)}{!offers.length && !error && <p className="muted">No new-platform affiliate offers are linked to this casino.</p>}</div></div>;
}
