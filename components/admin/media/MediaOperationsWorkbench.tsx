"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Badge, Card } from "@/components/ui";
import type { MediaIngestionPlan } from "@/lib/media-operations/contracts";

type CasinoReference = { id: string; slug: string; title: string; casinoBonuses: Array<{ id: string; slug: string; title: string }> };

async function requestJson<T>(url: string, init?: RequestInit) {
  const response = await fetch(url, { ...init, cache: "no-store" });
  const body = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(body.error || "Media Operations request failed");
  return body;
}

function tone(state: string) {
  return ["INGESTED", "PLANNED", "APPLIED", "AUTO_ASSIGN_DRAFT", "COMPLETED", "MATCH", "LIKELY_MATCH"].includes(state) ? "green" as const : "warning" as const;
}

export function MediaOperationsWorkbench({ casinos }: { casinos: CasinoReference[] }) {
  const [snippet, setSnippet] = useState("");
  const [casinoId, setCasinoId] = useState("");
  const [bonusId, setBonusId] = useState("");
  const [partnerIdentifier, setPartnerIdentifier] = useState("");
  const [targetCountries, setTargetCountries] = useState("");
  const [creativeLanguageState, setCreativeLanguageState] = useState<"UNKNOWN" | "NEUTRAL" | "EXPLICIT">("UNKNOWN");
  const [creativeLanguage, setCreativeLanguage] = useState("");
  const [semantic, setSemantic] = useState(true);
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [plan, setPlan] = useState<MediaIngestionPlan | null>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const bonuses = useMemo(() => casinos.find((casino) => casino.id === casinoId)?.casinoBonuses ?? [], [casinoId, casinos]);
  const normalizedTargetCountries = targetCountries.split(/[\s,]+/).map((value) => value.trim().toUpperCase()).filter(Boolean);
  const previewScope = plan?.recommendations.find((recommendation) => recommendation.countryCode || recommendation.languageCode)
    ?? plan?.recommendations[0];
  const previewQuery = new URLSearchParams({ variant: "DEFAULT" });
  if (previewScope?.countryCode) previewQuery.set("countryCode", previewScope.countryCode);
  if (previewScope?.languageCode) previewQuery.set("languageCode", previewScope.languageCode);

  async function analyze() {
    setBusy("analyze"); setError(""); setPlan(null);
    try {
      const ingested = await requestJson<{ plan: MediaIngestionPlan }>("/api/admin/media-operations/ingestions", {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({
          snippet,
          context: {
            ...(casinoId ? { casinoId } : {}),
            ...(bonusId ? { bonusId } : {}),
            ...(partnerIdentifier.trim() ? { partnerIdentifier: partnerIdentifier.trim() } : {}),
            ...(normalizedTargetCountries.length ? { targetCountryCodes: normalizedTargetCountries } : {}),
            creativeLanguageState,
            ...(creativeLanguageState === "EXPLICIT" ? { creativeLanguage: creativeLanguage.trim() } : {}),
            ...(creativeLanguageState === "NEUTRAL" ? { creativeLanguage: null } : {}),
          },
        }),
      });
      setPlan(ingested.plan);
      const analyzed = await requestJson<{ plan: MediaIngestionPlan }>(`/api/admin/media-operations/ingestions/${ingested.plan.id}/analyze`, {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ useSemanticAnalysis: semantic }),
      });
      setPlan(analyzed.plan);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to analyze creative"); }
    finally { setBusy(""); }
  }

  async function mutate(mode: "APPLY" | "ROLLBACK") {
    if (!plan) return;
    setBusy(mode.toLowerCase()); setError("");
    try {
      const result = await requestJson<{ plan: MediaIngestionPlan }>(`/api/admin/media-operations/ingestions/${plan.id}/apply`, {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ mode, replaceExisting }),
      });
      setPlan(result.plan);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to change draft plan"); }
    finally { setBusy(""); }
  }

  return <div className="mediaOperationsWorkbench">
    <Card className="mediaOperationsIntake" tone="soft">
      <div className="mediaOperationsOrientation">
        <div><p className="eyebrow">Controlled media intake</p><h2>PASTE PARTNER CREATIVE CODE</h2></div>
        <Badge tone="warning">DRAFT ONLY · NEVER PUBLISHES</Badge>
      </div>
      <p className="muted">Paste anchor/image HTML, image HTML, direct HTTPS image URLs, or multiple snippets. Script and iframe code is never executed. Tracking hrefs remain evidence only.</p>
      <label className="mediaOperationsSnippet"><span>Partner creative code</span><textarea aria-describedby="creative-code-help" maxLength={131072} onChange={(event) => setSnippet(event.target.value)} placeholder={'<a href="…"><img src="https://…/creative.gif" width="300" height="250" alt="…"></a>'} rows={10} value={snippet} /><small id="creative-code-help">Maximum 128 KiB. Pasted headers, cookies, scripts, destinations and CTA routes are not activated.</small></label>
      <div className="mediaOperationsContext">
        <label><span>Casino (optional)</span><select value={casinoId} onChange={(event) => { setCasinoId(event.target.value); setBonusId(""); }}><option value="">Detect from evidence</option>{casinos.map((casino) => <option key={casino.id} value={casino.id}>{casino.title}</option>)}</select></label>
        <label><span>Bonus (optional)</span><select disabled={!casinoId} value={bonusId} onChange={(event) => setBonusId(event.target.value)}><option value="">Detect or leave unassigned</option>{bonuses.map((bonus) => <option key={bonus.id} value={bonus.id}>{bonus.title}</option>)}</select></label>
        <label><span>Partner identifier (optional)</span><input maxLength={200} onChange={(event) => setPartnerIdentifier(event.target.value)} placeholder="Network, program, or reference" value={partnerIdentifier} /></label>
        <label><span>Target countries (optional)</span><input autoComplete="off" maxLength={80} onChange={(event) => setTargetCountries(event.target.value)} placeholder="FI or EE, LV, LT" spellCheck={false} value={targetCountries} /><small>Exact ISO country codes. Blank means global.</small></label>
        <label><span>Creative language status</span><select value={creativeLanguageState} onChange={(event) => setCreativeLanguageState(event.target.value as "UNKNOWN" | "NEUTRAL" | "EXPLICIT")}><option value="UNKNOWN">Unknown — review required</option><option value="NEUTRAL">Neutral — no material language</option><option value="EXPLICIT">Explicit language</option></select></label>
        {creativeLanguageState === "EXPLICIT" ? <label><span>Creative language</span><input autoComplete="off" maxLength={8} onChange={(event) => setCreativeLanguage(event.target.value.toLowerCase())} placeholder="fi" spellCheck={false} value={creativeLanguage} /><small>BCP 47 primary language subtag.</small></label> : null}
      </div>
      <label className="editorCheck"><input checked={semantic} type="checkbox" onChange={(event) => setSemantic(event.target.checked)} /> Use approved visual analysis when available</label>
      <button className="button gold" disabled={!snippet.trim() || Boolean(busy) || (creativeLanguageState === "EXPLICIT" && !creativeLanguage.trim())} onClick={() => void analyze()} type="button">{busy === "analyze" ? "Ingesting and analyzing…" : "Analyze"}</button>
      {error ? <p className="builderError" role="alert">{error}</p> : null}
    </Card>

    {plan ? <>
      <section className="mediaOperationsStatus" aria-labelledby="media-plan-status">
        <div><p className="eyebrow">Plan {plan.id}</p><h2 id="media-plan-status">Evidence and draft placement plan</h2></div>
        <div className="badgeCluster"><Badge tone={tone(plan.state)}>{plan.state}</Badge><Badge>{plan.creatives.length} creatives</Badge><Badge>{plan.recommendations.length} recommendations</Badge></div>
      </section>

      <div className="mediaOperationsFacts">
        <Card><span className="muted">Resolved context</span><strong>{plan.resolvedContext.casinoTitle || "Review required"}</strong><small>{plan.resolvedContext.bonusTitle || "No bonus selected"} · {plan.resolvedContext.source}</small></Card>
        <Card><span className="muted">Tracking evidence</span><strong>{plan.resolvedContext.trackingDestinationState.replaceAll("_", " ")}</strong><small>No partner href becomes a route or CTA.</small></Card>
        <Card><span className="muted">Authored target</span><strong>{plan.requestedContext.targetCountryCodes?.join(", ") || "Global"} · {plan.requestedContext.creativeLanguage ?? (plan.requestedContext.creativeLanguageState === "NEUTRAL" || plan.requestedContext.creativeLanguage === null ? "neutral" : "unknown language")}</strong><small>Country scope controls eligibility; language controls presentation only.</small></Card>
        <Card><span className="muted">Input checksum</span><strong className="mediaOperationsChecksum">{plan.snippetChecksum.slice(0, 16)}…</strong><small>Raw pasted code is not stored.</small></Card>
      </div>

      {plan.warnings.length ? <div className="mediaOperationsWarnings" role="status"><strong>Review signals</strong>{plan.warnings.map((warning) => <span key={warning}>{warning}</span>)}</div> : null}

      <section className="mediaOperationsSection" aria-labelledby="ingested-assets-heading">
        <div><p className="eyebrow">First-party media library</p><h2 id="ingested-assets-heading">Ingested assets</h2></div>
        <div className="mediaOperationsAssetList">{plan.assets.map((asset) => {
          const creative = plan.creatives.find((item) => item.id === asset.creativeId);
          const analysis = plan.semanticResults.find((item) => item.creativeId === asset.creativeId);
          return <article key={asset.creativeId}>
            <div className="mediaOperationsAssetPreview">{asset.firstPartyUrl ? <img alt={creative?.alt || "Ingested partner creative"} height={asset.height || 250} src={asset.firstPartyUrl} width={asset.width || 300} /> : <span>Preview unavailable</span>}</div>
            <div className="mediaOperationsAssetEvidence">
              <div className="badgeCluster"><Badge tone={tone(asset.state)}>{asset.state}</Badge>{analysis ? <Badge tone={tone(analysis.state)}>{analysis.state}</Badge> : null}{asset.animated ? <Badge>ANIMATED</Badge> : null}</div>
              <h3>{creative?.alt || creative?.title || creative?.providerDomain || "Partner creative"}</h3>
              <dl><div><dt>Decoded</dt><dd>{asset.width && asset.height ? `${asset.width}×${asset.height}` : "—"} · {asset.mimeType || "—"}</dd></div><div><dt>Declared</dt><dd>{creative?.declaredWidth && creative.declaredHeight ? `${creative.declaredWidth}×${creative.declaredHeight}` : "Not supplied"}</dd></div><div><dt>Format family</dt><dd>{asset.formatFamily?.replaceAll("_", " ") || "Unclassified"}</dd></div><div><dt>Provider</dt><dd>{creative?.providerDomain || "Unknown"}</dd></div><div><dt>Purpose / brand</dt><dd>{analysis ? `${analysis.assetPurpose} · ${analysis.brandName || "unknown brand"}` : "Awaiting analysis"}</dd></div><div><dt>Semantic confidence</dt><dd>{analysis ? `${Math.round(analysis.confidence * 100)}% · crop ${analysis.cropSafety.toLowerCase()}` : "Not analyzed"}</dd></div><div><dt>Offer</dt><dd>{analysis?.offerText || "No structured offer detected"}</dd></div><div><dt>Market clues</dt><dd>{[...(creative?.languageClues || []), ...(creative?.marketClues || []), ...(creative?.currencyClues || []), ...(analysis?.likelyMarkets || [])].join(" · ") || "None"}</dd></div></dl>
              {asset.failureMessage ? <p className="builderError">{asset.failureCode}: {asset.failureMessage}</p> : null}
            </div>
          </article>;
        })}</div>
      </section>

      <section className="mediaOperationsSection" aria-labelledby="placement-plan-heading">
        <div><p className="eyebrow">Reasoned recommendations</p><h2 id="placement-plan-heading">Placement plan</h2></div>
        {plan.recommendations.length ? <div className="mediaOperationsPlanTable" role="table" aria-label="Draft media placement recommendations">
          <div className="mediaOperationsPlanRow mediaOperationsPlanHead" role="row"><span>Creative</span><span>Placement</span><span>Decision</span><span>Score</span><span>Reason</span></div>
          {plan.recommendations.map((recommendation) => <div className="mediaOperationsPlanRow" key={recommendation.id} role="row"><span>{recommendation.subjectType.replaceAll("_", " ")} · {recommendation.variant}<small>{recommendation.countryCode ?? "GLOBAL"} · {recommendation.languageCode ?? "neutral"}</small></span><strong>{recommendation.placement.replaceAll("_", " ")}</strong><span><Badge tone={tone(recommendation.state)}>{recommendation.state}</Badge><small>{recommendation.offerMatch.replaceAll("_", " ")} · {recommendation.marketHandling.replaceAll("_", " ")} · {recommendation.existingComparison.replaceAll("_", " ")}</small></span><strong>{recommendation.score}</strong><span>{recommendation.reasons.join(" ")}</span></div>)}
        </div> : <Card><p className="muted">No assignment is eligible. The validated media remains review-only or could not be tied to a governed casino subject.</p></Card>}
      </section>

      <Card className="mediaOperationsActions">
        <div><h2>Draft action</h2><p className="muted">Applies only auto-eligible recommendations to current draft records. Public snapshots stay unchanged until the existing publication action.</p></div>
        <label className="editorCheck"><input checked={replaceExisting} type="checkbox" onChange={(event) => setReplaceExisting(event.target.checked)} /> Explicitly replace eligible existing draft assignments</label>
        <div className="mediaCardActions"><button className="button gold" disabled={Boolean(busy) || !plan.recommendations.some((item) => item.state === "AUTO_ASSIGN_DRAFT" || item.replacementEligible)} onClick={() => void mutate("APPLY")} type="button">{busy === "apply" ? "Applying…" : "Apply to draft"}</button><button className="button ghost" disabled={Boolean(busy) || !plan.recommendations.some((item) => item.appliedAssignmentId && !item.rolledBackAt)} onClick={() => void mutate("ROLLBACK")} type="button">{busy === "rollback" ? "Rolling back…" : "Rollback plan-owned drafts"}</button>{plan.resolvedContext.casinoId ? <><Link className="button ghost" href={`/admin/casinos/${plan.resolvedContext.casinoId}/preview?${previewQuery}`} target="_blank">Simulate target · default</Link><Link className="button ghost" href={`/admin/casinos/${plan.resolvedContext.casinoId}/preview?${new URLSearchParams({ ...Object.fromEntries(previewQuery), variant: "MOBILE" })}`} target="_blank">Simulate target · mobile</Link><Link className="button ghost" href={`/admin/casinos/${plan.resolvedContext.casinoId}/preview?${new URLSearchParams({ ...Object.fromEntries(previewQuery), variant: "DESKTOP" })}`} target="_blank">Simulate target · desktop</Link></> : null}</div>
        <div className="mediaCardActions"><span className="muted">Current published state (unchanged until publication):</span><Link href="/casinos" target="_blank">Casinos</Link><Link href="/bonuses" target="_blank">Bonuses</Link><Link href="/best-offers" target="_blank">Best Offers</Link>{plan.resolvedContext.casinoSlug ? <Link href={`/casino/${plan.resolvedContext.casinoSlug}`} target="_blank">Casino review</Link> : null}</div>
      </Card>
    </> : null}
  </div>;
}
