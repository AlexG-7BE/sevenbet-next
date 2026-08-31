import Link from "next/link";

import type { FirstWaveMarketEvidenceProfile, SafetyResource } from "@/lib/market/first-wave-evidence";
import type { PresentationResolution } from "@/lib/market/presentation-resolver";
import { productHref } from "@/lib/market/product-context";
import styles from "./FirstWaveSafetyPage.module.css";

function resourceGroup(profile: FirstWaveMarketEvidenceProfile, kind: "SELF_EXCLUSION" | "SUPPORT" | "INFORMATION") {
  if (kind === "SELF_EXCLUSION") return profile.resources.filter((resource) => resource.kind === "SELF_EXCLUSION");
  if (kind === "SUPPORT") return profile.resources.filter((resource) => resource.kind === "SUPPORT" || resource.kind === "TREATMENT_DIRECTORY");
  return profile.resources.filter((resource) => resource.kind === "INFORMATION" || resource.kind === "BLOCKING_TOOL");
}

function ResourceCards({ profile, resources }: { profile: FirstWaveMarketEvidenceProfile; resources: readonly SafetyResource[] }) {
  if (!resources.length) return <p className={styles.unavailable}>{profile.copy.unavailable}</p>;
  return (
    <div className={styles.resourceGrid}>
      {resources.map((resource) => (
        <article className={styles.resourceCard} key={`${resource.kind}:${resource.name}`}>
          <p className={styles.provider}>{resource.provider}</p>
          <h3>{resource.name}</h3>
          <p>{resource.attribution}</p>
          {resource.phone ? <p className={styles.phone}>{resource.phone}</p> : null}
          <a href={resource.url} rel="noopener noreferrer" target="_blank">
            {profile.copy.externalLabel} <span aria-hidden="true">↗</span>
          </a>
        </article>
      ))}
    </div>
  );
}

export function FirstWaveSafetyPage({
  profile,
  presentation,
  variant,
}: {
  profile: FirstWaveMarketEvidenceProfile;
  presentation: PresentationResolution;
  variant: "help" | "responsible";
}) {
  const title = variant === "help" ? profile.copy.helpTitle : profile.copy.responsibleTitle;
  const lead = variant === "help" ? profile.copy.helpLead : profile.copy.responsibleLead;
  const selfExclusion = resourceGroup(profile, "SELF_EXCLUSION");
  const support = resourceGroup(profile, "SUPPORT");
  const information = resourceGroup(profile, "INFORMATION");

  return (
    <article className={styles.page} data-first-wave-safety={profile.market} data-safety-variant={variant}>
      <header className={styles.hero}>
        <p>{profile.copy.eyebrow}</p>
        <h1>{title}</h1>
        <p className={styles.lead}>{lead}</p>
        <p className={styles.nonCommercial}>{profile.copy.nonCommercial}</p>
      </header>

      <section aria-labelledby="self-exclusion-title" className={styles.section}>
        <div className={styles.sectionHeading}>
          <p>01</p>
          <h2 id="self-exclusion-title">{profile.copy.selfExclusionTitle}</h2>
        </div>
        <ResourceCards profile={profile} resources={selfExclusion} />
      </section>

      <section aria-labelledby="support-title" className={styles.section}>
        <div className={styles.sectionHeading}>
          <p>02</p>
          <h2 id="support-title">{profile.copy.supportTitle}</h2>
        </div>
        <ResourceCards profile={profile} resources={support} />
      </section>

      <section aria-labelledby="information-title" className={styles.section}>
        <div className={styles.sectionHeading}>
          <p>03</p>
          <h2 id="information-title">{profile.copy.informationTitle}</h2>
        </div>
        <ResourceCards profile={profile} resources={information} />
      </section>

      <aside className={styles.boundary} aria-label={profile.copy.resourcesTitle}>
        <div>
          <p className={styles.boundaryLabel}>{profile.copy.reviewedLabel}</p>
          <strong>30-08-2026</strong>
        </div>
        <div>
          <p className={styles.boundaryLabel}>{profile.copy.sourceLabel}</p>
          <strong>{profile.authorityName}</strong>
        </div>
        <p>{profile.copy.disclaimer}</p>
        <p>{profile.copy.urgent}</p>
      </aside>

      <section aria-labelledby="evidence-title" className={styles.evidence}>
        <h2 id="evidence-title">{profile.copy.sourceLabel}</h2>
        <ul>
          {profile.evidence.map((record) => (
            <li key={record.id}>
              <a href={record.url} rel="noopener noreferrer" target="_blank">{record.title}</a>
              <span>{record.authority} · {record.reviewedAt}</span>
            </li>
          ))}
        </ul>
      </section>

      <nav className={styles.localNavigation} aria-label={profile.copy.eyebrow}>
        <Link href={productHref(presentation, "/help")}>{profile.copy.helpTitle}</Link>
        <Link href={productHref(presentation, "/responsible-gambling")}>{profile.copy.responsibleTitle}</Link>
      </nav>
    </article>
  );
}
