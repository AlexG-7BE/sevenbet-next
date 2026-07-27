"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Badge, Card } from "@/components/ui";
import type {
  AffiliateExternalMappingRecord,
  AffiliateImportJobRecord,
  AffiliateProgramRecord,
  AffiliateReferenceData,
} from "@/lib/affiliate/admin-types";

import { AffiliateAdminLayout } from "./AffiliateShell";

async function json<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Request failed");
  return result as T;
}

function summaryEntries(job: AffiliateImportJobRecord) {
  return [
    ["Create", job.summary.create ?? 0],
    ["Update", job.summary.update ?? 0],
    ["No change", job.summary.noChange ?? 0],
    ["Skipped", job.summary.skipped ?? 0],
    ["Conflicts", job.summary.conflicts ?? 0],
    ["Errors", job.summary.errors ?? 0],
    ["Unmatched", job.summary.unmatched ?? 0],
  ];
}

export function AffiliateImportAdmin() {
  const [programs, setPrograms] = useState<AffiliateProgramRecord[]>([]);
  const [programId, setProgramId] = useState("");
  const [mode, setMode] = useState<"FULL" | "INCREMENTAL">("FULL");
  const [payload, setPayload] = useState("");
  const [job, setJob] = useState<AffiliateImportJobRecord | null>(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    json<{ records: AffiliateProgramRecord[] }>("/api/admin/affiliate/programs")
      .then((result) => {
        setPrograms(result.records);
        setProgramId((value) => value || result.records.find((item) => item.status !== "ARCHIVED")?.id || "");
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Unable to load programs"));
  }, []);
  async function preview() {
    setWorking(true); setError("");
    try {
      const result = await json<{ job: AffiliateImportJobRecord }>("/api/admin/affiliate/imports/preview", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ programId, providerType: "MANUAL", mode, payload }),
      });
      setJob(result.job);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to preview import"); }
    finally { setWorking(false); }
  }
  async function apply() {
    if (!job) return;
    setWorking(true); setError("");
    try {
      const result = await json<{ job: AffiliateImportJobRecord }>(`/api/admin/affiliate/imports/${job.id}/apply`, { method: "POST" });
      setJob(result.job);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to apply import"); }
    finally { setWorking(false); }
  }
  return <AffiliateAdminLayout active="import" title="Affiliate import" description="Upload approved CSV or JSON, inspect a dry-run changeset, then apply safe records.">
    <Card className="builderForm">
      <div className="builderTwoCol">
        <label className="affiliateField"><span>Affiliate program</span><select onChange={(event) => setProgramId(event.target.value)} value={programId}><option value="">Select program</option>{programs.map((program) => <option key={program.id} value={program.id}>{program.name} · {program.providerType}</option>)}</select></label>
        <label className="affiliateField"><span>Sync mode</span><select onChange={(event) => setMode(event.target.value as "FULL" | "INCREMENTAL")} value={mode}><option>FULL</option><option>INCREMENTAL</option></select></label>
      </div>
      <label className="affiliateField"><span>CSV or JSON payload</span><textarea onChange={(event) => setPayload(event.target.value)} placeholder={'[{"externalId":"offer-1","externalName":"Welcome offer","casino":{"name":"Example","domain":"example.com"}}]'} rows={12} value={payload} /></label>
      <p className="muted">Maximum 512 KB and 5,000 records. New offers remain draft and tracking links remain inactive unless trusted activation is explicitly enabled.</p>
      <div className="builderActions"><button className="button gold" disabled={working || !programId || !payload.trim()} onClick={() => void preview()} type="button">{working ? "Checking..." : "Preview changes"}</button></div>
    </Card>
    {error && <p className="builderError" role="alert">{error}</p>}
    {job && <ImportJobPanel apply={apply} canApply job={job} working={working} />}
  </AffiliateAdminLayout>;
}

function ImportJobPanel({ job, apply, working, canApply = false }: { job: AffiliateImportJobRecord; apply: () => void; working: boolean; canApply?: boolean }) {
  return <section className="affiliateSection">
    <div className="affiliateSectionTitle"><Badge tone={job.status === "COMPLETED" ? "green" : "warning"}>{job.dryRun ? "DRY RUN" : job.status}</Badge><h3>Import summary</h3><p className="muted">Job {job.id}</p></div>
    <div className="affiliateMetricGrid">{summaryEntries(job).map(([label, value]) => <Card key={label}><span className="muted">{label}</span><strong>{value}</strong></Card>)}</div>
    {job.items && <div className="affiliateRecordList">{job.items.map((item) => <Card key={item.id}><div><div className="badgeCluster"><Badge>{item.action}</Badge><Badge tone={item.matchStatus === "MATCHED" ? "green" : "warning"}>{item.matchStatus}</Badge></div><h3>{item.externalName || item.externalId}</h3><p className="muted">{item.externalDomain || "No external domain"}{item.conflictFields.length ? ` · review ${item.conflictFields.join(", ")}` : ""}</p></div></Card>)}</div>}
    <div className="builderActions"><Link className="button ghost" href={`/admin/affiliate/sync/${job.id}`}>Open job details</Link>{canApply && job.dryRun && <button className="button gold" disabled={working} onClick={apply} type="button">Apply safe changes</button>}</div>
  </section>;
}

export function AffiliateSyncHistoryAdmin({ jobId }: { jobId?: string }) {
  const [jobs, setJobs] = useState<AffiliateImportJobRecord[]>([]);
  const [job, setJob] = useState<AffiliateImportJobRecord | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (jobId) {
      json<{ job: AffiliateImportJobRecord }>(`/api/admin/affiliate/jobs/${jobId}`).then((result) => setJob(result.job)).catch((caught) => setError(caught instanceof Error ? caught.message : "Unable to load job"));
      return;
    }
    json<{ records: AffiliateImportJobRecord[] }>("/api/admin/affiliate/jobs").then((result) => setJobs(result.records)).catch((caught) => setError(caught instanceof Error ? caught.message : "Unable to load sync history"));
  }, [jobId]);
  return <AffiliateAdminLayout active="sync" title={job ? `Import ${job.id.slice(0, 8)}` : "Sync history"} description="Immutable dry-run and apply reports for provider and manual imports.">
    {error && <p className="builderError" role="alert">{error}</p>}
    {job ? <ImportJobPanel apply={() => undefined} job={job} working={false} /> : <div className="affiliateRecordList">{jobs.map((record) => <Card key={record.id}><div><div className="badgeCluster"><Badge tone={record.status === "COMPLETED" ? "green" : "warning"}>{record.status}</Badge><Badge>{record.providerType}</Badge><Badge>{record.mode}</Badge></div><h3>{record.affiliateProgram.name}</h3><p className="muted">{record._count?.items ?? record.summary.total ?? 0} items · {new Date(record.createdAt).toLocaleString("en-US")}</p></div><Link className="button ghost" href={`/admin/affiliate/sync/${record.id}`}>Details</Link></Card>)}{!jobs.length && !error && <Card><p className="muted">No import jobs yet.</p></Card>}</div>}
  </AffiliateAdminLayout>;
}

export function AffiliateMatchingAdmin() {
  const [records, setRecords] = useState<AffiliateExternalMappingRecord[]>([]);
  const [references, setReferences] = useState<AffiliateReferenceData>({ networks: [], programs: [], casinos: [] });
  const [selection, setSelection] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    const [review, unmatched, refs] = await Promise.all([
      json<{ records: AffiliateExternalMappingRecord[] }>("/api/admin/affiliate/mappings?entityType=CASINO&status=REVIEW_REQUIRED"),
      json<{ records: AffiliateExternalMappingRecord[] }>("/api/admin/affiliate/mappings?entityType=CASINO&status=UNMATCHED"),
      json<AffiliateReferenceData>("/api/admin/affiliate/reference-data"),
    ]);
    setRecords([...review.records, ...unmatched.records]);
    setReferences(refs);
  }, []);
  useEffect(() => { void load().catch((caught) => setError(caught instanceof Error ? caught.message : "Unable to load matching queue")); }, [load]);
  async function match(mappingId: string) {
    const casinoId = selection[mappingId];
    if (!casinoId) return;
    try {
      await json(`/api/admin/affiliate/mappings/${mappingId}/match`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ casinoId }),
      });
      await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to save match"); }
  }
  return <AffiliateAdminLayout active="matching" title="Casino matching queue" description="Low-confidence records require an explicit canonical Casino selection. No fuzzy match is written automatically.">
    {error && <p className="builderError" role="alert">{error}</p>}
    <div className="affiliateRecordList">{records.map((record) => <Card key={record.id}><div><div className="badgeCluster"><Badge tone="warning">{record.matchStatus}</Badge><Badge>{record.providerType}</Badge></div><h3>{record.externalName || record.externalId}</h3><p className="muted">{record.externalDomain || "No domain"} · {record.affiliateProgram.name}</p></div><div className="builderActions"><select aria-label={`Match ${record.externalName || record.externalId}`} onChange={(event) => setSelection((value) => ({ ...value, [record.id]: event.target.value }))} value={selection[record.id] || ""}><option value="">Select casino</option>{references.casinos.map((casino) => <option key={casino.id} value={casino.id}>{casino.title} · {casino.domain}</option>)}</select><button className="button gold" disabled={!selection[record.id]} onClick={() => void match(record.id)} type="button">Confirm match</button><Link className="button ghost" href={`/admin/casinos/new?externalName=${encodeURIComponent(record.externalName || "")}`}>Create draft casino</Link></div></Card>)}{!records.length && !error && <Card><p className="muted">The matching queue is clear.</p></Card>}</div>
  </AffiliateAdminLayout>;
}
