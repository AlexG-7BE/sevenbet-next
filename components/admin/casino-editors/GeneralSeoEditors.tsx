"use client";

import type { CasinoBuilderCasino, CasinoBuilderSeo } from "@/lib/casino-builder/types";
import { MediaSelector } from "@/components/admin/media/MediaSelector";

import { EditorCheckbox, EditorField, EditorTextArea, numberOrNull } from "./EditorFields";

export function GeneralEditor({ casino, onChange }: { casino: CasinoBuilderCasino; onChange: (casino: CasinoBuilderCasino) => void }) {
  const set = <K extends keyof CasinoBuilderCasino>(key: K, value: CasinoBuilderCasino[K]) => onChange({ ...casino, [key]: value });
  const setMetadata = <K extends keyof CasinoBuilderCasino["generalMetadata"]>(key: K, value: CasinoBuilderCasino["generalMetadata"][K]) => onChange({
    ...casino,
    generalMetadata: { ...casino.generalMetadata, [key]: value },
  });
  const scoreFields: Array<[keyof CasinoBuilderCasino["generalMetadata"], string]> = [
    ["trustScore", "Trust score"],
    ["userExperienceScore", "UX score"],
    ["paymentsScore", "Payments score"],
    ["gamesScore", "Games score"],
    ["supportScore", "Support score"],
    ["responsibleGamblingScore", "Responsible gambling score"],
  ];

  return (
    <div className="builderForm">
      <div className="builderTwoCol">
        <EditorField label="Internal name" value={casino.internalName ?? ""} onChange={(value) => set("internalName", value)} />
        <EditorField label="Public name" value={casino.title} onChange={(value) => set("title", value)} />
        <EditorField label="Slug" value={casino.slug} onChange={(value) => set("slug", value)} hint="Normalized and checked for uniqueness when saved." />
        <EditorField label="Root domain" value={casino.domain} onChange={(value) => set("domain", value)} hint="Protocols and www are removed on the server." />
        <EditorField label="Website URL" type="url" value={casino.websiteUrl ?? ""} onChange={(value) => set("websiteUrl", value)} />
        <EditorField label="Operator / company" value={casino.operator ?? ""} onChange={(value) => set("operator", value)} />
        <EditorField label="Founded year" type="number" min={1800} max={new Date().getFullYear()} value={casino.foundedYear ?? ""} onChange={(value) => set("foundedYear", numberOrNull(value))} />
        <EditorField label="Workflow status" value={casino.status.replaceAll("_", " ")} onChange={() => undefined} disabled hint="Use Publishing controls to change workflow status." />
        <EditorField label="Primary language" value={casino.language} onChange={(value) => set("language", value)} />
        <EditorField label="Languages" value={casino.languages.join(", ")} onChange={(value) => set("languages", value.split(","))} hint="Comma-separated language codes." />
        <EditorField label="Currencies" value={casino.currencies.join(", ")} onChange={(value) => set("currencies", value.split(","))} hint="Comma-separated ISO currency codes." />
        <EditorField label="Overall editor score" type="number" min={0} max={10} step="0.1" value={casino.editorScore ?? ""} onChange={(value) => set("editorScore", numberOrNull(value))} />
        {scoreFields.map(([key, label]) => (
          <EditorField key={key} label={label} type="number" min={0} max={10} step="0.1" value={casino.generalMetadata[key] as number | null ?? ""} onChange={(value) => setMetadata(key, numberOrNull(value) as never)} />
        ))}
      </div>
      <div className="casinoEditorChecks">
        <EditorCheckbox label="Featured" checked={casino.generalMetadata.featured} onChange={(value) => setMetadata("featured", value)} />
        <EditorCheckbox label="Recommended" checked={casino.generalMetadata.recommended} onChange={(value) => setMetadata("recommended", value)} />
      </div>
      <EditorField label="Tagline" value={casino.tagline ?? ""} onChange={(value) => set("tagline", value)} />
      <EditorTextArea label="Editorial summary" value={casino.summary ?? ""} onChange={(value) => set("summary", value)} />
      <EditorTextArea label="Plain review description" rows={8} value={casino.description ?? ""} onChange={(value) => set("description", value)} />
      <EditorTextArea label="Internal notes" rows={5} value={casino.generalMetadata.internalNotes ?? ""} onChange={(value) => setMetadata("internalNotes", value)} hint="Visible to editors only; included in revision snapshots." />
    </div>
  );
}
function emptySeo(): CasinoBuilderSeo {
  return {
    id: "",
    title: null,
    description: null,
    canonicalUrl: null,
    robots: "index,follow",
    socialTitle: null,
    socialDescription: null,
    socialImage: null,
    structuredData: "",
    robotsIndex: true,
    robotsFollow: true,
  };
}

export function SeoEditor({ casino, onChange }: { casino: CasinoBuilderCasino; onChange: (casino: CasinoBuilderCasino) => void }) {
  const seo = casino.seo ?? emptySeo();
  const set = <K extends keyof CasinoBuilderSeo>(key: K, value: CasinoBuilderSeo[K]) => onChange({
    ...casino,
    seo: { ...seo, [key]: value },
  });
  return (
    <div className="builderForm">
      <div className="builderTwoCol">
        <EditorField label="SEO title" value={seo.title ?? ""} onChange={(value) => set("title", value)} hint={`${seo.title?.length ?? 0}/60 recommended characters`} />
        <EditorField label="Canonical URL" type="url" value={seo.canonicalUrl ?? ""} onChange={(value) => set("canonicalUrl", value)} />
      </div>
      <EditorTextArea label="SEO description" value={seo.description ?? ""} onChange={(value) => set("description", value)} hint={`${seo.description?.length ?? 0}/160 recommended characters`} />
      <div className="builderTwoCol">
        <EditorField label="Social title" value={seo.socialTitle ?? ""} onChange={(value) => set("socialTitle", value)} />
        <EditorField label="Social image URL" type="url" value={seo.socialImage ?? ""} onChange={(value) => set("socialImage", value)} />
      </div>
      <EditorTextArea label="Social description" value={seo.socialDescription ?? ""} onChange={(value) => set("socialDescription", value)} />
      <MediaSelector casinoId={casino.id} label="Social sharing image" type="SOCIAL_IMAGE" onSelectedUrl={(url) => set("socialImage", url)} />
      <div className="casinoEditorChecks">
        <EditorCheckbox label="Allow indexing" checked={seo.robotsIndex} onChange={(value) => set("robotsIndex", value)} />
        <EditorCheckbox label="Allow link following" checked={seo.robotsFollow} onChange={(value) => set("robotsFollow", value)} />
      </div>
      <EditorTextArea label="Structured data JSON" rows={12} value={seo.structuredData} onChange={(value) => set("structuredData", value)} hint="Parsed and validated as inert JSON on the server. It is never executed." />
      <div className="casinoSeoPreview" aria-label="Search result preview">
        <span>{seo.canonicalUrl || casino.websiteUrl || casino.domain}</span>
        <strong>{seo.title || casino.title}</strong>
        <p>{seo.description || casino.summary || "Add an SEO description to preview the search snippet."}</p>
      </div>
    </div>
  );
}
