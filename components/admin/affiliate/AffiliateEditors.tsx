"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Badge, Card } from "@/components/ui";
import type {
  AffiliateGeoModeValue,
  AffiliateNetworkRecord,
  AffiliateNetworkTypeValue,
  AffiliateOfferRecord,
  AffiliatePayoutModelValue,
  AffiliateProgramRecord,
  AffiliateReferenceData,
  AffiliateStatusValue,
  AffiliateTrackingLinkRecord,
} from "@/lib/affiliate/admin-types";

import { AffiliateAdminLayout, AffiliateSaveBar, AffiliateSectionLayout, AffiliateStatusBar } from "./AffiliateShell";

type EditorKind = "networks" | "programs" | "offers";

async function json<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const result = await response.json();
  if (!response.ok) {
    const details = Array.isArray(result.details) ? result.details.map((item: { message?: string }) => item.message).filter(Boolean).join(" · ") : "";
    throw new Error([result.error || "Request failed", details].filter(Boolean).join(" · "));
  }
  return result as T;
}

function csv(value: string) {
  return [...new Set(value.split(",").map((item) => item.trim().toUpperCase()).filter(Boolean))];
}

function dateInput(value?: string | null) {
  return value ? new Date(value).toISOString().slice(0, 16) : "";
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

const statuses: AffiliateStatusValue[] = ["DRAFT", "ACTIVE", "PAUSED", "EXPIRED", "ARCHIVED"];
const networkTypes: AffiliateNetworkTypeValue[] = ["EVERFLOW", "INCOME_ACCESS", "MYAFFILIATES", "NETREFER", "DIRECT", "OTHER"];
const payoutModels: AffiliatePayoutModelValue[] = ["CPA", "CPL", "REV_SHARE", "HYBRID", "FLAT", "UNKNOWN"];
const geoModes: AffiliateGeoModeValue[] = ["GLOBAL", "ALLOW", "BLOCK"];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="affiliateField"><span>{label}</span>{children}</label>;
}

function NetworkEditor({ id }: { id?: string }) {
  const router = useRouter();
  const empty = { name: "", slug: "", type: "OTHER" as AffiliateNetworkTypeValue, websiteUrl: "", apiCapable: false, exportCapable: false, active: true, notes: "", updatedAt: "" };
  const [draft, setDraft] = useState(empty);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    if (!id) { setDraft(empty); return; }
    const result = await json<{ network: AffiliateNetworkRecord }>(`/api/admin/affiliate/networks/${id}`);
    setDraft({ ...result.network, websiteUrl: result.network.websiteUrl || "", notes: result.network.notes || "" }); setDirty(false); setError("");
  }, [id]);
  useEffect(() => { void load().catch((caught) => setError(caught instanceof Error ? caught.message : "Unable to load network")); }, [load]);
  function change(patch: Partial<typeof draft>) { setDraft((value) => ({ ...value, ...patch })); setDirty(true); }
  async function save(next = draft) {
    setSaving(true); setError("");
    try {
      const result = await json<{ network: AffiliateNetworkRecord }>(id ? `/api/admin/affiliate/networks/${id}` : "/api/admin/affiliate/networks", { method: id ? "PATCH" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...next, slug: slugify(next.slug || next.name), expectedUpdatedAt: id ? draft.updatedAt : undefined }) });
      if (!id) { router.push(`/admin/affiliate/networks/${result.network.id}`); return; }
      setDraft({ ...result.network, websiteUrl: result.network.websiteUrl || "", notes: result.network.notes || "" }); setDirty(false); router.refresh();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to save network"); }
    finally { setSaving(false); }
  }
  return <AffiliateAdminLayout active="networks" title={id ? draft.name || "Network" : "Create network"} description="Network identity and non-secret integration capabilities.">
    <AffiliateStatusBar detail={draft.type.replaceAll("_", " ")} status={draft.active ? "Enabled" : "Archived"} updatedAt={draft.updatedAt} />
    <AffiliateSectionLayout title="Network details" description="API credentials are intentionally not stored here."><div className="builderForm builderTwoCol"><Field label="Name"><input onChange={(event) => change({ name: event.target.value, ...(!id ? { slug: slugify(event.target.value) } : {}) })} value={draft.name} /></Field><Field label="Slug"><input onChange={(event) => change({ slug: event.target.value })} value={draft.slug} /></Field><Field label="Website"><input onChange={(event) => change({ websiteUrl: event.target.value })} placeholder="https://" type="url" value={draft.websiteUrl} /></Field><Field label="Network type"><select onChange={(event) => change({ type: event.target.value as AffiliateNetworkTypeValue })} value={draft.type}>{networkTypes.map((value) => <option key={value}>{value}</option>)}</select></Field><label className="editorCheck"><input checked={draft.apiCapable} onChange={(event) => change({ apiCapable: event.target.checked })} type="checkbox" /> API capable</label><label className="editorCheck"><input checked={draft.exportCapable} onChange={(event) => change({ exportCapable: event.target.checked })} type="checkbox" /> Export capable</label><Field label="Internal notes"><textarea onChange={(event) => change({ notes: event.target.value })} rows={5} value={draft.notes} /></Field></div><div className="builderActions">{id && <button className="button ghost" onClick={() => void save({ ...draft, active: !draft.active })} type="button">{draft.active ? "Archive" : "Restore"}</button>}</div></AffiliateSectionLayout>
    <AffiliateSaveBar dirty={dirty || !id} error={error} onReload={() => void load()} onSave={() => void save()} saving={saving} />
  </AffiliateAdminLayout>;
}

function ProgramEditor({ id }: { id?: string }) {
  const router = useRouter();
  const empty = { networkId: "", externalProgramId: "", name: "", operator: "", status: "DRAFT" as AffiliateStatusValue, accountReference: "", supportedCountries: "", supportedCurrencies: "", notes: "", updatedAt: "" };
  const [draft, setDraft] = useState(empty);
  const [networks, setNetworks] = useState<AffiliateNetworkRecord[]>([]);
  const [dirty, setDirty] = useState(false); const [saving, setSaving] = useState(false); const [error, setError] = useState("");
  const load = useCallback(async () => {
    const refs = await json<AffiliateReferenceData>("/api/admin/affiliate/reference-data"); setNetworks(refs.networks);
    if (!id) { setDraft((value) => ({ ...value, networkId: value.networkId || refs.networks.find((item) => item.active)?.id || "" })); return; }
    const result = await json<{ program: AffiliateProgramRecord }>(`/api/admin/affiliate/programs/${id}`);
    const item = result.program; setDraft({ networkId: item.networkId, externalProgramId: item.externalProgramId || "", name: item.name, operator: item.operator, status: item.status, accountReference: item.accountReference || "", supportedCountries: item.supportedCountries.join(", "), supportedCurrencies: item.supportedCurrencies.join(", "), notes: item.notes || "", updatedAt: item.updatedAt }); setDirty(false); setError("");
  }, [id]);
  useEffect(() => { void load().catch((caught) => setError(caught instanceof Error ? caught.message : "Unable to load program")); }, [load]);
  function change(patch: Partial<typeof draft>) { setDraft((value) => ({ ...value, ...patch })); setDirty(true); }
  async function save(next = draft) {
    setSaving(true); setError("");
    try {
      const result = await json<{ program: AffiliateProgramRecord }>(id ? `/api/admin/affiliate/programs/${id}` : "/api/admin/affiliate/programs", { method: id ? "PATCH" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...next, supportedCountries: csv(next.supportedCountries), supportedCurrencies: csv(next.supportedCurrencies), expectedUpdatedAt: id ? draft.updatedAt : undefined }) });
      if (!id) { router.push(`/admin/affiliate/programs/${result.program.id}`); return; }
      const item = result.program; setDraft({ networkId: item.networkId, externalProgramId: item.externalProgramId || "", name: item.name, operator: item.operator, status: item.status, accountReference: item.accountReference || "", supportedCountries: item.supportedCountries.join(", "), supportedCurrencies: item.supportedCurrencies.join(", "), notes: item.notes || "", updatedAt: item.updatedAt }); setDirty(false); router.refresh();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to save program"); }
    finally { setSaving(false); }
  }
  return <AffiliateAdminLayout active="programs" title={id ? draft.name || "Program" : "Create program"} description="Operator program identity, account reference, markets and lifecycle."><AffiliateStatusBar detail={networks.find((item) => item.id === draft.networkId)?.name} status={draft.status} updatedAt={draft.updatedAt} /><AffiliateSectionLayout title="Program details" description="External IDs are unique within the selected network."><div className="builderForm builderTwoCol"><Field label="Affiliate network"><select onChange={(event) => change({ networkId: event.target.value })} value={draft.networkId}><option value="">Select network</option>{networks.map((item) => <option disabled={!item.active} key={item.id} value={item.id}>{item.name}{!item.active ? " (archived)" : ""}</option>)}</select></Field><Field label="External program ID"><input onChange={(event) => change({ externalProgramId: event.target.value })} value={draft.externalProgramId} /></Field><Field label="Name"><input onChange={(event) => change({ name: event.target.value })} value={draft.name} /></Field><Field label="Operator"><input onChange={(event) => change({ operator: event.target.value })} value={draft.operator} /></Field><Field label="Status"><select onChange={(event) => change({ status: event.target.value as AffiliateStatusValue })} value={draft.status}>{statuses.map((value) => <option key={value}>{value}</option>)}</select></Field><Field label="Account reference"><input onChange={(event) => change({ accountReference: event.target.value })} value={draft.accountReference} /></Field><Field label="Supported countries"><input onChange={(event) => change({ supportedCountries: event.target.value })} placeholder="GB, IE, CA" value={draft.supportedCountries} /></Field><Field label="Supported currencies"><input onChange={(event) => change({ supportedCurrencies: event.target.value })} placeholder="GBP, EUR, CAD" value={draft.supportedCurrencies} /></Field><Field label="Internal notes"><textarea onChange={(event) => change({ notes: event.target.value })} rows={5} value={draft.notes} /></Field></div><div className="builderActions">{id && <button className="button ghost" onClick={() => void save({ ...draft, status: draft.status === "ARCHIVED" ? "DRAFT" : "ARCHIVED" })} type="button">{draft.status === "ARCHIVED" ? "Restore to draft" : "Archive"}</button>}</div></AffiliateSectionLayout><AffiliateSaveBar dirty={dirty || !id} error={error} onReload={() => void load()} onSave={() => void save()} saving={saving} /></AffiliateAdminLayout>;
}

interface OfferDraft {
  programId: string; casinoId: string; casinoBonusId: string; externalOfferId: string; internalName: string; publicLabel: string; offerType: string; status: AffiliateStatusValue; payoutModel: AffiliatePayoutModelValue; payoutAmount: string; payoutCurrency: string; revenueSharePercentage: string; hybridTerms: string; cookieDurationDays: string; geoMode: AffiliateGeoModeValue; countries: string; currencies: string; startAt: string; expiresAt: string; evergreen: boolean; featured: boolean; priority: number; terms: string; notes: string; trackingLinks: AffiliateTrackingLinkRecord[]; revisions: AffiliateOfferRecord["revisions"]; updatedAt: string;
}

const emptyOffer: OfferDraft = { programId: "", casinoId: "", casinoBonusId: "", externalOfferId: "", internalName: "", publicLabel: "", offerType: "WELCOME", status: "DRAFT", payoutModel: "UNKNOWN", payoutAmount: "", payoutCurrency: "", revenueSharePercentage: "", hybridTerms: "", cookieDurationDays: "", geoMode: "GLOBAL", countries: "", currencies: "", startAt: "", expiresAt: "", evergreen: false, featured: false, priority: 0, terms: "", notes: "", trackingLinks: [], revisions: [], updatedAt: "" };

function offerToDraft(item: AffiliateOfferRecord): OfferDraft {
  return { programId: item.programId, casinoId: item.casinoId, casinoBonusId: item.casinoBonusId || "", externalOfferId: item.externalOfferId || "", internalName: item.internalName, publicLabel: item.publicLabel, offerType: item.offerType, status: item.status, payoutModel: item.payoutModel, payoutAmount: item.payoutAmount || "", payoutCurrency: item.payoutCurrency || "", revenueSharePercentage: item.revenueSharePercentage || "", hybridTerms: item.hybridTerms || "", cookieDurationDays: item.cookieDurationDays?.toString() || "", geoMode: item.geoMode, countries: item.countries.map((entry) => entry.countryCode).join(", "), currencies: item.currencies.map((entry) => entry.currencyCode).join(", "), startAt: dateInput(item.startAt), expiresAt: dateInput(item.expiresAt), evergreen: item.evergreen, featured: item.featured, priority: item.priority, terms: item.terms || "", notes: item.notes || "", trackingLinks: item.trackingLinks.map((link) => ({ ...link, archived: Boolean(link.archivedAt) })), revisions: item.revisions, updatedAt: item.updatedAt };
}

function newLink(priority: number): AffiliateTrackingLinkRecord {
  return { clientKey: crypto.randomUUID(), externalLinkId: null, label: "New tracking link", destinationUrl: "", trackingUrl: "", landingPage: null, geoMode: "GLOBAL", countries: [], currencyCode: null, deviceTarget: "ALL", language: null, promoCode: null, campaign: null, creativeReference: null, verifiedAt: null, lastCheckedAt: null, expiresAt: null, active: false, archived: false, priority, source: "MANUAL", revisions: [] };
}

function TrackingLinkEditor({ links, onChange }: { links: AffiliateTrackingLinkRecord[]; onChange: (links: AffiliateTrackingLinkRecord[]) => void }) {
  function update(index: number, patch: Partial<AffiliateTrackingLinkRecord>) { onChange(links.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item)); }
  function move(index: number, direction: -1 | 1) { const target = index + direction; if (target < 0 || target >= links.length) return; const next = [...links]; [next[index], next[target]] = [next[target], next[index]]; onChange(next.map((item, itemIndex) => ({ ...item, priority: (next.length - itemIndex) * 100 }))); }
  return <div className="affiliateTrackingList"><div className="builderActions"><button className="button gold" onClick={() => onChange([...links, newLink((links.length + 1) * 100)])} type="button">Add tracking link</button></div>{links.map((link, index) => <Card className={link.archived ? "affiliateArchived" : ""} key={link.id || link.clientKey || `new-${index}`}><div className="affiliateRecordHeader"><div className="badgeCluster"><Badge tone={link.active ? "green" : "warning"}>{link.archived ? "ARCHIVED" : link.active ? "ACTIVE" : "INACTIVE"}</Badge><Badge>Priority {link.priority}</Badge>{link.verifiedAt && <Badge tone="green">Verified</Badge>}</div><div className="builderActions"><button aria-label="Move link up" className="button ghost" disabled={index === 0} onClick={() => move(index, -1)} type="button">↑</button><button aria-label="Move link down" className="button ghost" disabled={index === links.length - 1} onClick={() => move(index, 1)} type="button">↓</button><button className="button ghost" onClick={() => onChange([...links, { ...link, id: undefined, clientKey: crypto.randomUUID(), externalLinkId: null, label: `${link.label} copy`, active: false, archived: false, archivedAt: null, revisions: [] }])} type="button">Duplicate</button><button className="button ghost" onClick={() => update(index, { archived: !link.archived, active: link.archived ? false : false, archivedAt: link.archived ? null : link.archivedAt })} type="button">{link.archived ? "Restore" : "Archive"}</button></div></div><div className="builderForm builderTwoCol"><Field label="Label"><input onChange={(event) => update(index, { label: event.target.value })} value={link.label} /></Field><Field label="External link ID"><input onChange={(event) => update(index, { externalLinkId: event.target.value })} value={link.externalLinkId || ""} /></Field><Field label="Destination URL"><input onChange={(event) => update(index, { destinationUrl: event.target.value })} placeholder="https://" type="url" value={link.destinationUrl} /></Field><Field label="Tracking URL"><input onChange={(event) => update(index, { trackingUrl: event.target.value })} placeholder="https://" type="url" value={link.trackingUrl} /></Field><Field label="Landing page"><input onChange={(event) => update(index, { landingPage: event.target.value })} value={link.landingPage || ""} /></Field><Field label="Source"><input onChange={(event) => update(index, { source: event.target.value })} value={link.source} /></Field><Field label="GEO mode"><select onChange={(event) => update(index, { geoMode: event.target.value as AffiliateGeoModeValue, countries: event.target.value === "GLOBAL" ? [] : link.countries })} value={link.geoMode}>{geoModes.map((value) => <option key={value}>{value}</option>)}</select></Field><Field label="Countries"><input disabled={link.geoMode === "GLOBAL"} onChange={(event) => update(index, { countries: csv(event.target.value).map((countryCode) => ({ countryCode, mode: link.geoMode })) })} placeholder="GB, IE" value={link.countries.map((entry) => entry.countryCode).join(", ")} /></Field><Field label="Currency"><input maxLength={3} onChange={(event) => update(index, { currencyCode: event.target.value.toUpperCase() })} value={link.currencyCode || ""} /></Field><Field label="Language"><input onChange={(event) => update(index, { language: event.target.value })} value={link.language || ""} /></Field><Field label="Promo code"><input onChange={(event) => update(index, { promoCode: event.target.value })} value={link.promoCode || ""} /></Field><Field label="Device targeting"><select onChange={(event) => update(index, { deviceTarget: event.target.value })} value={link.deviceTarget}><option>ALL</option><option>DESKTOP</option><option>MOBILE</option></select></Field><Field label="Priority"><input min={0} onChange={(event) => update(index, { priority: Number(event.target.value) })} type="number" value={link.priority} /></Field><Field label="Expires at"><input onChange={(event) => update(index, { expiresAt: event.target.value || null })} type="datetime-local" value={dateInput(link.expiresAt)} /></Field><Field label="Verified at"><input onChange={(event) => update(index, { verifiedAt: event.target.value || null })} type="datetime-local" value={dateInput(link.verifiedAt)} /></Field><Field label="Last checked"><input onChange={(event) => update(index, { lastCheckedAt: event.target.value || null })} type="datetime-local" value={dateInput(link.lastCheckedAt)} /></Field><label className="editorCheck"><input checked={link.active} disabled={link.archived} onChange={(event) => update(index, { active: event.target.checked })} type="checkbox" /> Active candidate</label></div>{Boolean(link.revisions?.length) && <details><summary>Previous URLs ({link.revisions?.length})</summary><div className="affiliateHistory">{link.revisions?.map((revision) => <p key={revision.id}><strong>Revision {revision.revisionNumber}</strong> · {revision.summary} · {new Date(revision.createdAt).toLocaleString("en-US")}<br /><span className="muted">{revision.destinationUrl}</span></p>)}</div></details>}</Card>)}</div>;
}

function OfferEditor({ id, initialCasinoId }: { id?: string; initialCasinoId?: string }) {
  const router = useRouter();
  const [draft, setDraft] = useState<OfferDraft>({ ...emptyOffer, casinoId: initialCasinoId || "" });
  const [references, setReferences] = useState<AffiliateReferenceData>({ networks: [], programs: [], casinos: [] });
  const [bonuses, setBonuses] = useState<Array<{ id: string; title: string }>>([]);
  const [dirty, setDirty] = useState(false); const [saving, setSaving] = useState(false); const [error, setError] = useState("");
  const load = useCallback(async () => {
    const refs = await json<AffiliateReferenceData>("/api/admin/affiliate/reference-data"); setReferences(refs);
    if (!id) { setDraft((value) => ({ ...value, casinoId: value.casinoId || initialCasinoId || "", programId: value.programId || refs.programs.find((item) => item.status !== "ARCHIVED")?.id || "" })); return; }
    const result = await json<{ offer: AffiliateOfferRecord }>(`/api/admin/affiliate/offers/${id}`); setDraft(offerToDraft(result.offer)); setDirty(false); setError("");
  }, [id, initialCasinoId]);
  useEffect(() => { void load().catch((caught) => setError(caught instanceof Error ? caught.message : "Unable to load offer")); }, [load]);
  useEffect(() => { if (!draft.casinoId) { setBonuses([]); return; } json<{ casino: { casinoBonuses: Array<{ id: string; title: string }> } }>(`/api/admin/casinos/${draft.casinoId}`).then((result) => setBonuses(result.casino.casinoBonuses)).catch(() => setBonuses([])); }, [draft.casinoId]);
  function change(patch: Partial<OfferDraft>) { setDraft((value) => ({ ...value, ...patch })); setDirty(true); }
  function payload(next: OfferDraft) { return { ...next, casinoBonusId: next.casinoBonusId || null, externalOfferId: next.externalOfferId || null, payoutAmount: next.payoutAmount || null, payoutCurrency: next.payoutCurrency || null, revenueSharePercentage: next.revenueSharePercentage || null, hybridTerms: next.hybridTerms || null, cookieDurationDays: next.cookieDurationDays ? Number(next.cookieDurationDays) : null, countries: next.geoMode === "GLOBAL" ? [] : csv(next.countries).map((countryCode) => ({ countryCode, mode: next.geoMode })), currencies: csv(next.currencies), startAt: next.startAt || null, expiresAt: next.expiresAt || null, expectedUpdatedAt: id ? draft.updatedAt : undefined, trackingLinks: next.trackingLinks.map((link) => ({ ...link, countries: link.geoMode === "GLOBAL" ? [] : link.countries.map((entry) => ({ countryCode: entry.countryCode, mode: link.geoMode })) })) }; }
  async function save(next = draft) {
    setSaving(true); setError("");
    try {
      const result = await json<{ offer: AffiliateOfferRecord }>(id ? `/api/admin/affiliate/offers/${id}` : "/api/admin/affiliate/offers", { method: id ? "PATCH" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload(next)) });
      if (!id) { router.push(`/admin/affiliate/offers/${result.offer.id}`); return; }
      setDraft(offerToDraft(result.offer)); setDirty(false); router.refresh();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to save offer"); }
    finally { setSaving(false); }
  }
  async function duplicate() { if (!id) return; setSaving(true); try { const result = await json<{ offer: AffiliateOfferRecord }>(`/api/admin/affiliate/offers/${id}/duplicate`, { method: "POST" }); router.push(`/admin/affiliate/offers/${result.offer.id}`); } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to duplicate offer"); setSaving(false); } }
  return <AffiliateAdminLayout active="offers" title={id ? draft.internalName || "Offer" : "Create offer"} description="Commercial terms, GEO/currency targeting and server-owned tracking links." actions={id && <button className="button ghost" onClick={duplicate} type="button">Duplicate offer</button>}><AffiliateStatusBar detail={`${draft.trackingLinks.filter((item) => item.active && !item.archived).length} active tracking links`} status={draft.status} updatedAt={draft.updatedAt} /><AffiliateSectionLayout title="Offer identity" description="Casino and bonus ownership are verified by the service."><div className="builderForm builderTwoCol"><Field label="Program"><select onChange={(event) => change({ programId: event.target.value })} value={draft.programId}><option value="">Select program</option>{references.programs.map((item) => <option disabled={item.status === "ARCHIVED"} key={item.id} value={item.id}>{item.network.name} · {item.name}</option>)}</select></Field><Field label="Casino"><select disabled={Boolean(id)} onChange={(event) => change({ casinoId: event.target.value, casinoBonusId: "" })} value={draft.casinoId}><option value="">Select casino</option>{references.casinos.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></Field><Field label="Casino bonus"><select onChange={(event) => change({ casinoBonusId: event.target.value })} value={draft.casinoBonusId}><option value="">Casino-level offer</option>{bonuses.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></Field><Field label="External offer ID"><input onChange={(event) => change({ externalOfferId: event.target.value })} value={draft.externalOfferId} /></Field><Field label="Internal name"><input onChange={(event) => change({ internalName: event.target.value })} value={draft.internalName} /></Field><Field label="Public label"><input onChange={(event) => change({ publicLabel: event.target.value })} value={draft.publicLabel} /></Field><Field label="Offer type"><input onChange={(event) => change({ offerType: event.target.value.toUpperCase() })} value={draft.offerType} /></Field><Field label="Status"><select onChange={(event) => change({ status: event.target.value as AffiliateStatusValue })} value={draft.status}>{statuses.map((value) => <option key={value}>{value}</option>)}</select></Field><Field label="Priority"><input min={0} onChange={(event) => change({ priority: Number(event.target.value) })} type="number" value={draft.priority} /></Field><label className="editorCheck"><input checked={draft.featured} onChange={(event) => change({ featured: event.target.checked })} type="checkbox" /> Featured</label></div></AffiliateSectionLayout><AffiliateSectionLayout title="Payout and dates" description="Payout fields are validated against the selected model."><div className="builderForm builderTwoCol"><Field label="Payout model"><select onChange={(event) => change({ payoutModel: event.target.value as AffiliatePayoutModelValue })} value={draft.payoutModel}>{payoutModels.map((value) => <option key={value}>{value}</option>)}</select></Field><Field label="Payout / CPA amount"><input min={0} onChange={(event) => change({ payoutAmount: event.target.value })} step="0.01" type="number" value={draft.payoutAmount} /></Field><Field label="Payout currency"><input maxLength={3} onChange={(event) => change({ payoutCurrency: event.target.value.toUpperCase() })} value={draft.payoutCurrency} /></Field><Field label="Revenue share %"><input max={100} min={0} onChange={(event) => change({ revenueSharePercentage: event.target.value })} step="0.01" type="number" value={draft.revenueSharePercentage} /></Field><Field label="Hybrid terms"><textarea onChange={(event) => change({ hybridTerms: event.target.value })} rows={3} value={draft.hybridTerms} /></Field><Field label="Cookie duration (days)"><input min={0} onChange={(event) => change({ cookieDurationDays: event.target.value })} type="number" value={draft.cookieDurationDays} /></Field><Field label="Starts at"><input onChange={(event) => change({ startAt: event.target.value })} type="datetime-local" value={draft.startAt} /></Field><Field label="Expires at"><input disabled={draft.evergreen} onChange={(event) => change({ expiresAt: event.target.value })} type="datetime-local" value={draft.expiresAt} /></Field><label className="editorCheck"><input checked={draft.evergreen} onChange={(event) => change({ evergreen: event.target.checked, expiresAt: event.target.checked ? "" : draft.expiresAt })} type="checkbox" /> Evergreen</label></div></AffiliateSectionLayout><AffiliateSectionLayout title="GEO, currency and terms" description="ALLOW/BLOCK rules and ISO currencies are normalized server-side."><div className="builderForm builderTwoCol"><Field label="GEO mode"><select onChange={(event) => change({ geoMode: event.target.value as AffiliateGeoModeValue, countries: event.target.value === "GLOBAL" ? "" : draft.countries })} value={draft.geoMode}>{geoModes.map((value) => <option key={value}>{value}</option>)}</select></Field><Field label="Countries"><input disabled={draft.geoMode === "GLOBAL"} onChange={(event) => change({ countries: event.target.value })} placeholder="GB, IE" value={draft.countries} /></Field><Field label="Player currencies"><input onChange={(event) => change({ currencies: event.target.value })} placeholder="GBP, EUR" value={draft.currencies} /></Field><Field label="Terms"><textarea onChange={(event) => change({ terms: event.target.value })} rows={5} value={draft.terms} /></Field><Field label="Internal notes"><textarea onChange={(event) => change({ notes: event.target.value })} rows={5} value={draft.notes} /></Field></div><div className="builderActions">{id && <button className="button ghost" onClick={() => void save({ ...draft, status: draft.status === "ARCHIVED" ? "DRAFT" : "ARCHIVED" })} type="button">{draft.status === "ARCHIVED" ? "Restore to draft" : "Archive offer"}</button>}</div></AffiliateSectionLayout><AffiliateSectionLayout title="Tracking links" description="HTTPS destinations, specificity conflicts, verification state and URL history."><TrackingLinkEditor links={draft.trackingLinks} onChange={(trackingLinks) => change({ trackingLinks })} /></AffiliateSectionLayout>{Boolean(draft.revisions.length) && <AffiliateSectionLayout badge="Read-only" title="Offer revisions" description="Snapshots recorded before each aggregate mutation."><div className="affiliateHistory">{draft.revisions.map((revision) => <p key={revision.id}><strong>Revision {revision.revisionNumber}</strong> · {revision.summary} · {new Date(revision.createdAt).toLocaleString("en-US")}</p>)}</div></AffiliateSectionLayout>}<AffiliateSaveBar dirty={dirty || !id} error={error} onReload={() => void load()} onSave={() => void save()} saving={saving} /></AffiliateAdminLayout>;
}

export function AffiliateEntityEditor({ kind, id, initialCasinoId }: { kind: EditorKind; id?: string; initialCasinoId?: string }) {
  if (kind === "networks") return <NetworkEditor id={id} />;
  if (kind === "programs") return <ProgramEditor id={id} />;
  return <OfferEditor id={id} initialCasinoId={initialCasinoId} />;
}
