"use client";

import type {
  CasinoBuilderCasino,
  CasinoBuilderCountry,
  CasinoBuilderLicense,
} from "@/lib/casino-builder/types";

import {
  EditorCheckbox,
  EditorCollection,
  EditorField,
  EditorRecord,
  EditorSelect,
  EditorTextArea,
  numberOrNull,
} from "./EditorFields";

function replaceById<T extends { id: string }>(records: T[], next: T) {
  return records.map((record) => record.id === next.id ? next : record);
}
function removeById<T extends { id: string }>(records: T[], id: string) {
  return records.filter((record) => record.id !== id);
}

function confirmRemoval(label: string) {
  return window.confirm(`Remove ${label}? This will be recorded in the next revision.`);
}

const licenseStatusOptions = ["ACTIVE", "SUSPENDED", "EXPIRED", "REVOKED", "UNKNOWN", "ARCHIVED"].map((value) => ({ label: value.replaceAll("_", " "), value }));

function newLicense(): CasinoBuilderLicense {
  return {
    id: crypto.randomUUID(),
    authority: "",
    licenseNumber: null,
    jurisdiction: null,
    status: "UNKNOWN",
    verificationUrl: null,
    issuedAt: null,
    expiresAt: null,
    lastVerifiedAt: null,
    notes: null,
    verified: false,
    archived: false,
  };
}

export function LicenseEditor({ casino, onChange }: { casino: CasinoBuilderCasino; onChange: (casino: CasinoBuilderCasino) => void }) {
  const update = (record: CasinoBuilderLicense) => onChange({ ...casino, licenses: replaceById(casino.licenses, record) });
  return (
    <EditorCollection addLabel="Add license" empty="No license records yet." onAdd={() => onChange({ ...casino, licenses: [...casino.licenses, newLicense()] })}>
      {casino.licenses.map((record) => {
        const expired = Boolean(record.expiresAt && new Date(record.expiresAt) < new Date());
        return (
          <EditorRecord
            archived={record.archived}
            key={record.id}
            title={record.authority}
            subtitle={`${record.status}${record.licenseNumber ? ` · ${record.licenseNumber}` : ""}`}
            onArchive={() => update({ ...record, archived: !record.archived, status: !record.archived ? "ARCHIVED" : "UNKNOWN" })}
            onRemove={() => confirmRemoval(record.authority || "license") && onChange({ ...casino, licenses: removeById(casino.licenses, record.id) })}
          >
            {expired && <p className="casinoEditorWarning" role="status">This license expiry date is in the past.</p>}
            <div className="builderTwoCol">
              <EditorField label="Regulator" value={record.authority} onChange={(value) => update({ ...record, authority: value })} />
              <EditorField label="Jurisdiction" value={record.jurisdiction ?? ""} onChange={(value) => update({ ...record, jurisdiction: value })} />
              <EditorField label="License number" value={record.licenseNumber ?? ""} onChange={(value) => update({ ...record, licenseNumber: value })} />
              <EditorSelect label="Status" value={record.status} options={licenseStatusOptions} onChange={(value) => update({ ...record, status: value, archived: value === "ARCHIVED" })} />
              <EditorField label="Verification URL" type="url" value={record.verificationUrl ?? ""} onChange={(value) => update({ ...record, verificationUrl: value })} />
              <EditorField label="Issued date" type="date" value={record.issuedAt?.slice(0, 10) ?? ""} onChange={(value) => update({ ...record, issuedAt: value || null })} />
              <EditorField label="Expiry date" type="date" value={record.expiresAt?.slice(0, 10) ?? ""} onChange={(value) => update({ ...record, expiresAt: value || null })} />
              <EditorCheckbox label="Verified" checked={record.verified} onChange={(value) => update({ ...record, verified: value })} hint={record.lastVerifiedAt ? `Last verified ${new Date(record.lastVerifiedAt).toLocaleDateString("en-US")}` : undefined} />
            </div>
            <EditorTextArea label="Notes" value={record.notes ?? ""} onChange={(value) => update({ ...record, notes: value })} />
          </EditorRecord>
        );
      })}
    </EditorCollection>
  );
}

const countryAvailabilityOptions = [
  { label: "Allowed", value: "AVAILABLE" },
  { label: "Restricted", value: "RESTRICTED" },
  { label: "Blocked", value: "NOT_AVAILABLE" },
  { label: "Unknown", value: "UNKNOWN" },
];

function newCountry(): CasinoBuilderCountry {
  return {
    id: crypto.randomUUID(),
    countryCode: "",
    availability: "UNKNOWN",
    minimumAge: 18,
    notes: null,
    currency: null,
    language: null,
    priority: 0,
    archived: false,
  };
}

export function CountryEditor({ casino, onChange }: { casino: CasinoBuilderCasino; onChange: (casino: CasinoBuilderCasino) => void }) {
  const update = (record: CasinoBuilderCountry) => onChange({ ...casino, countries: replaceById(casino.countries, record) });
  return (
    <EditorCollection addLabel="Add country rule" empty="No country availability rules yet." onAdd={() => onChange({ ...casino, countries: [...casino.countries, newCountry()] })}>
      {casino.countries.map((record) => (
        <EditorRecord
          archived={record.archived}
          key={record.id}
          title={record.countryCode}
          subtitle={record.availability.replaceAll("_", " ")}
          onArchive={() => update({ ...record, archived: !record.archived })}
          onRemove={() => confirmRemoval(record.countryCode || "country rule") && onChange({ ...casino, countries: removeById(casino.countries, record.id) })}
        >
          <div className="builderTwoCol">
            <EditorField label="Country code" value={record.countryCode} onChange={(value) => update({ ...record, countryCode: value.toUpperCase() })} hint="ISO 3166-1 alpha-2." />
            <EditorSelect label="Availability" value={record.availability} options={countryAvailabilityOptions} onChange={(value) => update({ ...record, availability: value })} />
            <EditorField label="Legal age" type="number" min={18} value={record.minimumAge ?? ""} onChange={(value) => update({ ...record, minimumAge: numberOrNull(value) })} />
            <EditorField label="Local currency" value={record.currency ?? ""} onChange={(value) => update({ ...record, currency: value.toUpperCase() })} />
            <EditorField label="Local language" value={record.language ?? ""} onChange={(value) => update({ ...record, language: value.toLowerCase() })} />
            <EditorField label="Priority" type="number" min={0} value={record.priority} onChange={(value) => update({ ...record, priority: Number(value) || 0 })} />
          </div>
          <EditorTextArea label="Notes" value={record.notes ?? ""} onChange={(value) => update({ ...record, notes: value })} />
        </EditorRecord>
      ))}
    </EditorCollection>
  );
}
