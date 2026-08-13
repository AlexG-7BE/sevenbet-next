import Image from "next/image";
import Link from "next/link";

import { CasinoOutboundAction } from "@/components/casino-profile/CasinoOutboundAction";
import { InstantDiscoveryForm } from "@/components/discovery/InstantDiscoveryForm";
import { comparisonHref } from "@/lib/public-comparison/query";
import type {
  PublicComparisonCandidate,
  PublicComparisonCasino,
  PublicComparisonEvidenceStatus,
  PublicComparisonResult,
} from "@/lib/public-comparison/public-comparison.types";

import styles from "./Comparison.module.css";

const evidenceDescriptions: Record<PublicComparisonEvidenceStatus, string> = {
  Published: "Present in the latest public snapshot.",
  Editorial: "B4GAMBLE editorial assessment.",
  "Operator-published": "Published operator information; verify current terms.",
  Unknown: "Not established and never inferred.",
  Unavailable: "Not published or not currently available.",
  "Not comparable": "Different or missing basis prevents an equal comparison.",
  "Policy-gated": "Available only after the governed policy check.",
};

function candidateLabel(candidate: PublicComparisonCandidate) {
  return `${candidate.name} · ${candidate.marketLabel}`;
}

function SelectionForm({ result }: { result: PublicComparisonResult }) {
  return <InstantDiscoveryForm action="/compare" className={styles.selectionForm} key={`comparison:${result.query.country}:${result.query.differences}:${result.selectedSlugs.join(",")}`} pendingLabel="Updating comparison…">
    <input name="country" type="hidden" value={result.query.country} />
    {result.query.differences ? <input name="differences" type="hidden" value="true" /> : null}
    <fieldset>
      <legend>Choose up to three published casino profiles</legend>
      <p id="selection-help">The URL stores the selection. Choose at least two available profiles for a meaningful comparison.</p>
      <div className={styles.slotGrid}>
        {[0, 1, 2].map((index) => {
          const selected = result.selectedSlugs[index] ?? "";
          const unavailable = selected && !result.candidates.some((candidate) => candidate.slug === selected);
          const otherSelected = new Set(result.selectedSlugs.filter((_, selectedIndex) => selectedIndex !== index));
          return <label className={styles.slotControl} key={index}>
            <span>{String(index + 1).padStart(2, "0")} · {selected ? "Selected" : index < 2 ? "Required to compare" : "Optional"}</span>
            <select aria-describedby="selection-help" defaultValue={selected} name="casino">
              <option value="">{index < 2 ? "Choose a casino" : "No third casino"}</option>
              {unavailable ? <option value={selected}>Unavailable selection: {selected}</option> : null}
              {result.candidates.filter((candidate) => candidate.slug === selected || !otherSelected.has(candidate.slug)).map((candidate) => <option key={candidate.slug} value={candidate.slug}>{candidateLabel(candidate)}</option>)}
            </select>
          </label>;
        })}
      </div>
    </fieldset>
    <div className={styles.selectionActions}>
      <button type="submit">Update comparison</button>
      <Link href={comparisonHref(result.query, [], { empty: true })}>Clear selection</Link>
      <span role="status">{result.selectedSlugs.length} of 3 selected{result.selectedSlugs.length === 3 ? " · maximum" : ""}</span>
    </div>
    {result.query.issues.length ? <p className={styles.queryNotice} role="status">Some URL values were safely ignored: {result.query.issues.map((issue) => issue.replaceAll("_", " ").toLowerCase()).join(" · ")}.</p> : null}
  </InstantDiscoveryForm>;
}

function SelectedCard({ casino, index, result }: { casino: PublicComparisonCasino; index: number; result: PublicComparisonResult }) {
  const remaining = result.selectedSlugs.filter((slug) => slug !== casino.slug);
  return <article className={styles.selectedCard}>
    <div className={styles.selectedIdentity}>
      {casino.logo ? <Image alt={casino.logo.alt || `${casino.name} logo`} height={casino.logo.height ?? 72} src={casino.logo.url} width={casino.logo.width ?? 72} /> : <span aria-hidden="true">{casino.name.slice(0, 1)}</span>}
      <div>
        <p>{String(index + 1).padStart(2, "0")} · SELECTED</p>
        <h3>{casino.name}</h3>
        <small>{casino.marketState === "AVAILABLE" ? `Published profile · ${result.query.country} declared available` : `${result.query.country} context not available`}</small>
      </div>
    </div>
    <div className={styles.selectedLinks}><Link href={casino.reviewHref}>Read full review</Link><Link href={comparisonHref(result.query, remaining, { empty: remaining.length === 0 })}>Remove</Link></div>
  </article>;
}

function SelectionSummary({ result }: { result: PublicComparisonResult }) {
  return <div className={styles.selectedGrid}>
    <h2 className="srOnly">Selected casino profiles</h2>
    {result.casinos.map((casino, index) => <SelectedCard casino={casino} index={index} key={casino.slug} result={result} />)}
    {result.reasons.filter((reason) => !result.casinos.some((casino) => casino.slug === reason.slug)).map((reason, index) => <article className={`${styles.selectedCard} ${styles.unavailableCard}`} key={reason.slug}>
      <p>{String(result.casinos.length + index + 1).padStart(2, "0")} · UNAVAILABLE</p><h3>{reason.slug}</h3><small>{reason.message}</small>
      <Link href={comparisonHref(result.query, result.selectedSlugs.filter((slug) => slug !== reason.slug), { empty: result.selectedSlugs.length === 1 })}>Remove selection</Link>
    </article>)}
    {result.selectedSlugs.length < 3 ? <a className={styles.addCard} href="#selection-controls"><span>{String(result.selectedSlugs.length + 1).padStart(2, "0")} · {result.selectedSlugs.length < 2 ? "ADD TO COMPARE" : "OPTIONAL"}</span><strong>+ Add another</strong><small>Published database profiles only</small></a> : null}
  </div>;
}

function EvidenceLegend() {
  const statuses: PublicComparisonEvidenceStatus[] = ["Published", "Editorial", "Operator-published", "Unknown", "Unavailable", "Not comparable", "Policy-gated"];
  return <section className={styles.legendSection} aria-labelledby="legend-title">
    <div className={styles.shell}>
      <p className={styles.kicker}>Read the difference</p>
      <h2 id="legend-title">Every value declares its status.</h2>
      <div className={styles.legendGrid}>{statuses.map((status) => <div data-status={status} key={status}><strong>{status}</strong><span>{evidenceDescriptions[status]}</span></div>)}</div>
    </div>
  </section>;
}

function ComparisonMatrix({ result }: { result: PublicComparisonResult }) {
  return <section className={styles.matrixSection} aria-labelledby="matrix-title">
    <div className={styles.shell}>
      <p className={styles.kicker}>Published facts · same source order</p>
      <div className={styles.matrixHeading}><div><h2 id="matrix-title">The facts stay aligned.</h2><p>Unknown and unavailable values remain visible. B4GAMBLE does not calculate a winner.</p></div><Link href={comparisonHref(result.query, result.selectedSlugs, { differences: !result.query.differences })}>{result.query.differences ? "Show all criteria" : "Show only differences"}</Link></div>
      {result.query.differences ? <p className={styles.differenceStatus} role="status">Showing differences · {result.hiddenEqualRows} identical {result.hiddenEqualRows === 1 ? "criterion" : "criteria"} hidden</p> : null}
      <div aria-label={`Comparison of ${result.casinos.filter((casino) => casino.marketState === "AVAILABLE").map((casino) => casino.name).join(", ")}`} className={styles.desktopMatrix} data-columns={result.casinos.filter((casino) => casino.marketState === "AVAILABLE").length} role="table">
        <div className={styles.operatorHeader} role="row">
          <div role="columnheader">Criterion</div>
          {result.casinos.filter((casino) => casino.marketState === "AVAILABLE").map((casino) => <div id={`operator-${casino.slug}`} key={casino.slug} role="columnheader"><strong>{casino.name}</strong><span>{casino.editorScore.toFixed(1)}/10 editorial</span></div>)}
        </div>
        {result.groups.map((group) => <div className={styles.desktopGroup} key={group.id} role="rowgroup">
          <h3>{group.label}</h3>
          {group.rows.map((row) => <div className={styles.matrixRow} key={row.id} role="row">
            <div id={`criterion-${row.id}`} role="rowheader"><strong>{row.label}</strong><span>{row.description}</span></div>
            {result.casinos.filter((casino) => casino.marketState === "AVAILABLE").map((casino) => { const cell = row.values[casino.slug]; return <div aria-labelledby={`criterion-${row.id} operator-${casino.slug}`} data-status={cell.status} key={casino.slug} role="cell"><strong>{cell.text}</strong><span>{cell.status}</span></div>; })}
          </div>)}
        </div>)}
      </div>
      <div className={styles.mobileMatrix}>
        {result.groups.map((group) => <section aria-labelledby={`mobile-group-${group.id}`} className={styles.mobileGroup} key={group.id}>
          <h3 id={`mobile-group-${group.id}`}>{group.label}</h3>
          {group.rows.map((row) => <article className={styles.criterionCard} key={row.id}>
            <p>{row.label}</p><small>{row.description}</small>
            <div>{result.casinos.filter((casino) => casino.marketState === "AVAILABLE").map((casino) => { const cell = row.values[casino.slug]; return <div data-status={cell.status} key={casino.slug}><h4>{casino.name}</h4><strong>{cell.text}</strong><span>{cell.status}</span></div>; })}</div>
          </article>)}
        </section>)}
      </div>
    </div>
  </section>;
}

function ResultState({ result }: { result: PublicComparisonResult }) {
  const content = result.status === "projection-unavailable"
    ? ["Comparison unavailable", "The latest published projection could not be loaded. No cached, legacy or invented record is substituted."]
    : result.status === "empty"
      ? ["Start with two profiles", "The explicit selection is empty. Choose published profiles above; B4GAMBLE will not fill this state automatically."]
      : result.status === "one-selected"
        ? ["Add one more to compare", `${result.casinos[0]?.name ?? "The selected profile"} remains visible. A meaningful comparison needs at least two declared-available profiles.`]
        : ["These profiles do not align", "Fewer than two selected profiles are published as available in the declared market context. No matrix or commercial substitute is created."];
  return <section className={styles.stateSection} aria-labelledby="state-title"><div className={styles.shell}><p className={styles.kicker}>Comparison state · fail closed</p><h2 id="state-title">{content[0]}</h2><p>{content[1]}</p>{result.reasons.length ? <ul>{result.reasons.map((reason) => <li key={`${reason.slug}:${reason.code}`}><strong>{reason.slug}</strong>{reason.message}</li>)}</ul> : null}<a href="#selection-controls">Edit selection</a></div></section>;
}

function DecisionCheckpoint({ result }: { result: PublicComparisonResult }) {
  return <section className={styles.decisionSection} aria-labelledby="decision-title"><div className={styles.shell}>
    <p className={styles.kicker}>Decision checkpoint</p><h2 id="decision-title">Different strengths. No universal fit.</h2>
    <div className={styles.decisionCards}>{result.casinos.map((casino) => <article key={casino.slug}><span>{casino.name}</span><h3>{casino.marketState === "AVAILABLE" ? "Open the source profile" : "Market context unresolved"}</h3><p>{casino.summary}</p><Link href={casino.reviewHref}>Read full review</Link></article>)}<article><span>ANOTHER VALID ANSWER</span><h3>Neither fits</h3><p>Change the selection, pause the decision or leave without a referral.</p><Link href="/10-steps">Pause with Mission 01</Link></article></div>
  </div></section>;
}

function CommercialBoundary({ result }: { result: PublicComparisonResult }) {
  return <section className={styles.commercialSection} aria-labelledby="commercial-title"><div className={styles.shell}>
    <p className={styles.kicker}>Before you leave B4GAMBLE</p><h2 id="commercial-title">Referral comes after the evidence.</h2><p className={styles.sectionCopy}>B4GAMBLE may receive compensation from a governed outbound link. Commission does not set comparison criteria or turn an unknown field into a positive one.</p>
    <div className={styles.boundaryList}><div><strong>Declared context</strong><span>{result.query.country} preference · location not detected</span></div><div><strong>Material terms</strong><span>Shown before any action</span></div><div><strong>Neutral exit</strong><span>Always available</span></div></div>
    <div className={styles.commercialCards}>{result.casinos.map((casino) => <article key={casino.slug}><span>{casino.name}</span><p>{casino.action.reason}</p><Link href={casino.reviewHref}>Full review</Link>{casino.action.available && casino.action.href ? <CasinoOutboundAction action={{ href: casino.action.href, label: casino.action.label }} className={styles.outboundAction} /> : <span aria-disabled="true" className={styles.unavailableAction}>Commercial action unavailable</span>}</article>)}</div>
  </div></section>;
}

function MethodologyAndFaq() {
  return <>
    <section className={styles.methodSection} aria-labelledby="method-title"><div className={styles.shell}><p className={styles.kicker}>Methodology</p><h2 id="method-title">Comparable means comparable.</h2><ol><li><span>01</span><strong>Resolve context</strong><p>Use one declared market preference without claiming detected location.</p></li><li><span>02</span><strong>Align criteria</strong><p>Read every published profile on the same evidence structure.</p></li><li><span>03</span><strong>Explain uncertainty</strong><p>Unknown, unavailable and policy-gated states remain distinct.</p></li><li><span>04</span><strong>Separate referral</strong><p>Commercial availability never determines editorial order.</p></li></ol><aside><div><span>10 STEPS BEFORE YOU CHOOSE</span><strong>Slow down the next decision.</strong><p>Programme, pause and Help data never personalise this comparison.</p></div><Link href="/program">Start Mission 01</Link></aside></div></section>
    <section className={styles.faqSection} aria-labelledby="faq-title"><div className={styles.shell}><p className={styles.kicker}>Comparison FAQ</p><h2 id="faq-title">Questions, without a sales pitch.</h2><div className={styles.faqList}>
      <details><summary>Why is there no winner?</summary><p>A single winner would hide trade-offs and personal constraints. B4GAMBLE keeps the evidence aligned and leaves the decision with the user.</p></details>
      <details><summary>What does unknown mean?</summary><p>The latest published record does not establish that value. Unknown is not treated as a benefit, drawback or implied fact.</p></details>
      <details><summary>Can a profile have no visit action?</summary><p>Yes. Editorial review availability and governed commercial availability are separate.</p></details>
      <details><summary>How are commissions handled?</summary><p>Some governed outbound routes may compensate B4GAMBLE. Commission is not a comparison or ranking input.</p></details>
      <details><summary>Why can results change?</summary><p>The page reads the latest published, non-archived database snapshots. A new publication can change the visible facts and default selection.</p></details>
    </div></div></section>
  </>;
}

export function ComparisonExperience({ result }: { result: PublicComparisonResult }) {
  const demonstration = result.inventoryMode === "DEMO_ONLY" || result.inventoryMode === "MIXED";
  return <div className={styles.page} data-comparison-page>
    <section className={styles.hero} aria-labelledby="comparison-title">
      <div className={styles.shell}>
        <p className={styles.kicker}>Compare · {result.query.country} declared context{demonstration ? " · illustrative pre-launch data" : " · published evidence"}</p>
        <h1 id="comparison-title">Compare what matters.<em>No winner. Just the evidence.</em></h1>
        <p className={styles.heroCopy}>Choose up to three published casino profiles. B4GAMBLE keeps material differences, missing fields, source status and limitations visible before any commercial action.</p>
        <div className={styles.contextNotice}><strong>Preference, not detected location.</strong><span>This comparison does not decide legal eligibility. Check operator terms and applicable law.</span></div>
        {result.defaulted ? <p className={styles.defaultNote}>Default view · selected generically from complete current {result.query.country}-available published profiles.</p> : null}
        <SelectionSummary result={result} />
        <div id="selection-controls"><SelectionForm result={result} /></div>
      </div>
    </section>
    {result.status === "available" ? <><EvidenceLegend /><ComparisonMatrix result={result} /><DecisionCheckpoint result={result} /><CommercialBoundary result={result} /></> : <ResultState result={result} />}
    <MethodologyAndFaq />
    <section className={styles.relatedSection} aria-labelledby="related-title"><div className={styles.shell}><p className={styles.kicker}>Continue with the source</p><h2 id="related-title">Keep the full decision in view.</h2><nav aria-label="Related routes"><Link href="/casinos"><span>Casino directory</span><strong>Browse every published profile.</strong></Link><Link href="/bonuses"><span>Bonus directory</span><strong>Compare current offer terms.</strong></Link><Link href="/methodology"><span>Methodology</span><strong>See how evidence is handled.</strong></Link></nav></div></section>
    {demonstration ? <aside className={styles.demoDisclosure}><div className={styles.shell}><strong>Illustrative pre-launch product demonstration.</strong><p>Current records describe fictional Demo operators and are not real operator partnerships, live promotions or a claim of legal eligibility. They will be replaced by verified published records through the same contract.</p></div></aside> : null}
  </div>;
}
