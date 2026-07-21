"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui";
import { MediaSelector } from "@/components/admin/media/MediaSelector";
import {
  casinoBonusGeoModes,
  casinoBonusOfferStatuses,
  casinoBonusTypes,
  createCasinoBonus,
  duplicateCasinoBonus,
  reorderCasinoBonuses,
  setCasinoBonusArchived,
} from "@/lib/casino-builder/bonus-validation";
import type { CasinoBuilderBonus, CasinoBuilderCasino } from "@/lib/casino-builder/types";

import {
  commaList,
  EditorCheckbox,
  EditorField,
  EditorSelect,
  EditorTextArea,
  numberOrNull,
} from "./EditorFields";

const typeOptions = casinoBonusTypes.map((value) => ({ label: value.replaceAll("_", " "), value }));
const statusOptions = casinoBonusOfferStatuses.map((value) => ({ label: value, value }));
const geoOptions = casinoBonusGeoModes.map((value) => ({ label: value === "GLOBAL" ? "Global" : value === "ALLOW" ? "Selected countries only" : "Global except blocked countries", value }));
const wageringBaseOptions = ["BONUS", "DEPOSIT", "DEPOSIT_AND_BONUS", "OTHER"].map((value) => ({ label: value.replaceAll("_", " "), value }));

function nullable(value: string) {
  return value.trim() ? value : null;
}

function bonusHeadline(record: CasinoBuilderBonus) {
  const values = [
    record.percentage ? `${record.percentage}%` : null,
    record.amount ? `${record.currency || ""} ${record.amount}`.trim() : null,
    record.maximumBonus ? `up to ${record.currency || ""} ${record.maximumBonus}`.trim() : null,
    record.freeSpins ? `${record.freeSpins} free spins` : null,
  ].filter(Boolean);
  return values.join(" + ") || "Offer value not specified";
}

function matchesCountry(record: CasinoBuilderBonus, country: string) {
  if (!country) return true;
  if (record.geoMode === "GLOBAL") return true;
  if (record.geoMode === "ALLOW") return record.allowedCountries.includes(country);
  return !record.blockedCountries.includes(country);
}

export function BonusEditor({ casino, onChange }: { casino: CasinoBuilderCasino; onChange: (casino: CasinoBuilderCasino) => void }) {
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [mediaBonusId, setMediaBonusId] = useState("");
  const countryOptions = useMemo(() => [
    { label: "All countries", value: "" },
    ...casino.countries
      .filter((country) => !country.archived)
      .map((country) => ({ label: country.countryCode, value: country.countryCode })),
  ], [casino.countries]);

  const visible = casino.casinoBonuses.filter((record) =>
    (!statusFilter || record.offerStatus === statusFilter) &&
    (!typeFilter || record.type === typeFilter) &&
    matchesCountry(record, countryFilter),
  );

  function setBonuses(casinoBonuses: CasinoBuilderBonus[]) {
    onChange({ ...casino, casinoBonuses });
  }

  function update(next: CasinoBuilderBonus) {
    setBonuses(casino.casinoBonuses.map((record) => record.id === next.id ? next : record));
  }

  function add() {
    const next = createCasinoBonus(crypto.randomUUID(), (casino.casinoBonuses.length + 1) * 1000);
    setBonuses([...casino.casinoBonuses, next]);
  }

  function duplicate(record: CasinoBuilderBonus) {
    const sourceIndex = casino.casinoBonuses.findIndex((item) => item.id === record.id);
    const next = duplicateCasinoBonus(record, crypto.randomUUID());
    const records = [...casino.casinoBonuses];
    records.splice(sourceIndex + 1, 0, next);
    setBonuses(records.map((item, index) => ({ ...item, sortOrder: (index + 1) * 1000 })));
  }

  function move(record: CasinoBuilderBonus, offset: -1 | 1) {
    const sourceIndex = casino.casinoBonuses.findIndex((item) => item.id === record.id);
    setBonuses(reorderCasinoBonuses(casino.casinoBonuses, sourceIndex, sourceIndex + offset));
  }

  return (
    <div className="casinoBonusEditor">
      <div className="casinoBonusToolbar">
        <div className="casinoBonusFilters" aria-label="Bonus filters">
          <EditorSelect label="Status" value={statusFilter} options={[{ label: "All statuses", value: "" }, ...statusOptions]} onChange={setStatusFilter} />
          <EditorSelect label="Type" value={typeFilter} options={[{ label: "All types", value: "" }, ...typeOptions]} onChange={setTypeFilter} />
          <EditorSelect label="Country" value={countryFilter} options={countryOptions} onChange={setCountryFilter} />
        </div>
        <button className="button gold" type="button" onClick={add}>Add bonus</button>
      </div>

      <div className="casinoBonusSummary" aria-live="polite">
        <span>Showing <strong>{visible.length}</strong> of {casino.casinoBonuses.length}</span>
        <span>Active <strong>{casino.casinoBonuses.filter((record) => record.offerStatus === "ACTIVE").length}</strong></span>
        <span>Featured <strong>{casino.casinoBonuses.filter((record) => record.featured).length}</strong></span>
      </div>

      {!visible.length && <p className="casinoEditorEmpty muted">No bonuses match the current filters.</p>}
      {visible.map((record) => {
        const absoluteIndex = casino.casinoBonuses.findIndex((item) => item.id === record.id);
        const expired = Boolean(record.expiresAt && new Date(record.expiresAt) < new Date());
        return (
          <details className={`casinoBonusRecord${record.offerStatus === "ARCHIVED" ? " archived" : ""}`} key={record.id}>
            <summary>
              <span>
                <strong>{record.title || "Untitled bonus"}</strong>
                <small>{record.type.replaceAll("_", " ")} · {record.offerStatus} · priority {record.sortOrder}</small>
              </span>
              <span className="badgeCluster">
                {record.featured && <Badge tone="warning">Featured</Badge>}
                {record.exclusive && <Badge tone="green">Exclusive</Badge>}
                {expired && <Badge tone="warning">Expired</Badge>}
              </span>
            </summary>

            <div className="casinoBonusActions">
              <button className="button ghost" disabled={absoluteIndex === 0} type="button" onClick={() => move(record, -1)} aria-label={`Move ${record.title} up`}>Move up</button>
              <button className="button ghost" disabled={absoluteIndex === casino.casinoBonuses.length - 1} type="button" onClick={() => move(record, 1)} aria-label={`Move ${record.title} down`}>Move down</button>
              <button className="button ghost" type="button" onClick={() => duplicate(record)}>Duplicate</button>
              <button className="button ghost" type="button" onClick={() => setMediaBonusId(mediaBonusId === record.id ? "" : record.id)}>{mediaBonusId === record.id ? "Close creative" : "Manage creative"}</button>
              <button className="button ghost" type="button" onClick={() => update(setCasinoBonusArchived(record, record.offerStatus !== "ARCHIVED"))}>{record.offerStatus === "ARCHIVED" ? "Restore" : "Archive"}</button>
            </div>

            <div className="builderForm">
              {mediaBonusId === record.id && <MediaSelector casinoBonusId={record.id} casinoId={casino.id} label="Bonus creative" type="BONUS_CREATIVE" />}
              {expired && <p className="casinoEditorWarning">The configured expiry date is in the past.</p>}
              <div className="builderTwoCol">
                <EditorField label="Internal name" value={record.internalName} onChange={(value) => update({ ...record, internalName: value })} />
                <EditorField label="Public title" value={record.title} onChange={(value) => update({ ...record, title: value })} />
                <EditorField label="Slug / code" value={record.slug} onChange={(value) => update({ ...record, slug: value })} />
                <EditorSelect label="Bonus type" value={record.type} options={typeOptions} onChange={(value) => update({ ...record, type: value })} />
                <EditorSelect label="Offer status" value={record.offerStatus} options={statusOptions} onChange={(value) => update({ ...record, offerStatus: value })} />
                <EditorField label="Editorial status" value={record.status} disabled onChange={() => undefined} hint="Follows the parent casino workflow." />
                <EditorField label="Currency" value={record.currency ?? ""} onChange={(value) => update({ ...record, currency: value.toUpperCase() })} />
                <EditorField label="Priority" type="number" min={0} value={record.sortOrder} onChange={(value) => update({ ...record, sortOrder: Number(value) || 0 })} />
              </div>

              <EditorTextArea label="Description" rows={4} value={record.summary} onChange={(value) => update({ ...record, summary: value })} />
              <EditorTextArea label="Short terms" rows={3} value={record.shortTerms ?? ""} onChange={(value) => update({ ...record, shortTerms: value, wageringText: value })} />

              <div className="builderTwoCol">
                <EditorField label="Fixed amount" inputMode="decimal" value={record.amount ?? ""} onChange={(value) => update({ ...record, amount: nullable(value) })} />
                <EditorField label="Percentage" inputMode="decimal" value={record.percentage ?? ""} onChange={(value) => update({ ...record, percentage: nullable(value) })} />
                <EditorField label="Maximum amount" inputMode="decimal" value={record.maximumBonus ?? ""} onChange={(value) => update({ ...record, maximumBonus: nullable(value) })} />
                <EditorField label="Minimum deposit" inputMode="decimal" value={record.minimumDeposit ?? ""} onChange={(value) => update({ ...record, minimumDeposit: nullable(value) })} />
                <EditorField label="Free spins" type="number" min={0} value={record.freeSpins ?? ""} onChange={(value) => update({ ...record, freeSpins: numberOrNull(value) })} />
                <EditorField label="Wagering requirement" inputMode="decimal" value={record.wageringMultiplier ?? ""} onChange={(value) => update({ ...record, wageringMultiplier: nullable(value) })} />
                <EditorSelect label="Wagering base" value={record.wageringBase} options={wageringBaseOptions} onChange={(value) => update({ ...record, wageringBase: value })} />
                <EditorField label="Minimum odds" inputMode="decimal" value={record.minimumOdds ?? ""} onChange={(value) => update({ ...record, minimumOdds: nullable(value) })} />
                <EditorField label="Maximum bet" inputMode="decimal" value={record.maximumBet ?? ""} onChange={(value) => update({ ...record, maximumBet: nullable(value) })} />
                <EditorField label="Promo code" value={record.promoCode ?? ""} onChange={(value) => update({ ...record, promoCode: nullable(value) })} />
              </div>

              <div className="builderTwoCol">
                <EditorField label="Eligible games" value={record.eligibleGames.join(", ")} onChange={(value) => update({ ...record, eligibleGames: commaList(value) })} />
                <EditorField label="Excluded games" value={record.excludedGames.join(", ")} onChange={(value) => update({ ...record, excludedGames: commaList(value) })} />
                <EditorField label="Eligible payment methods" value={record.eligiblePaymentMethods.join(", ")} onChange={(value) => update({ ...record, eligiblePaymentMethods: commaList(value) })} />
                <EditorField label="Excluded payment methods" value={record.excludedPaymentMethods.join(", ")} onChange={(value) => update({ ...record, excludedPaymentMethods: commaList(value) })} />
              </div>

              <div className="casinoEditorChecks">
                <EditorCheckbox label="New players only" checked={record.newPlayersOnly} onChange={(value) => update({ ...record, newPlayersOnly: value, existingPlayersAllowed: value ? false : record.existingPlayersAllowed })} />
                <EditorCheckbox label="Existing players allowed" checked={record.existingPlayersAllowed} onChange={(value) => update({ ...record, existingPlayersAllowed: value, newPlayersOnly: value ? false : record.newPlayersOnly })} />
                <EditorCheckbox label="Evergreen" checked={record.evergreen} onChange={(value) => update({ ...record, evergreen: value, expiresAt: value ? null : record.expiresAt })} />
                <EditorCheckbox label="Featured" checked={record.featured} onChange={(value) => update({ ...record, featured: value })} />
                <EditorCheckbox label="Exclusive" checked={record.exclusive} onChange={(value) => update({ ...record, exclusive: value })} />
              </div>

              <div className="builderTwoCol">
                <EditorField label="Start at" type="datetime-local" value={record.startsAt?.slice(0, 16) ?? ""} onChange={(value) => update({ ...record, startsAt: nullable(value) })} />
                <EditorField label="Expires at" type="datetime-local" disabled={record.evergreen} value={record.expiresAt?.slice(0, 16) ?? ""} onChange={(value) => update({ ...record, expiresAt: nullable(value) })} />
                <EditorField label="Terms URL" type="url" value={record.termsUrl ?? ""} onChange={(value) => update({ ...record, termsUrl: nullable(value) })} />
                <EditorField label="Eligibility summary" value={record.eligibility ?? ""} onChange={(value) => update({ ...record, eligibility: nullable(value) })} />
              </div>
              <EditorField label="Important conditions" value={record.importantConditions.join(", ")} onChange={(value) => update({ ...record, importantConditions: commaList(value) })} />

              <div className="casinoBonusGeo">
                <EditorSelect label="GEO availability" value={record.geoMode} options={geoOptions} onChange={(value) => update({ ...record, geoMode: value as CasinoBuilderBonus["geoMode"] })} />
                <EditorField label="Allowed countries" value={record.allowedCountries.join(", ")} onChange={(value) => update({ ...record, allowedCountries: commaList(value.toUpperCase()) })} hint="Used only in Selected countries mode." />
                <EditorField label="Blocked countries" value={record.blockedCountries.join(", ")} onChange={(value) => update({ ...record, blockedCountries: commaList(value.toUpperCase()) })} hint="Used only in Global except blocked mode." />
              </div>

              <EditorTextArea label="Internal notes" rows={4} value={record.notes ?? ""} onChange={(value) => update({ ...record, notes: value })} />

              <div className="casinoBonusPreview" aria-label={`${record.title} offer preview`}>
                <div>
                  <span className="eyebrow">Draft offer preview</span>
                  <h3>{record.title || "Untitled bonus"}</h3>
                  <strong>{bonusHeadline(record)}</strong>
                </div>
                <p>{record.shortTerms || "Add short terms to explain the offer."}</p>
                <div className="badgeCluster">
                  <Badge>{record.type.replaceAll("_", " ")}</Badge>
                  <Badge>{record.wageringMultiplier ? `${record.wageringMultiplier}x wagering` : "Wagering not set"}</Badge>
                  <Badge>{record.minimumDeposit ? `Min. ${record.currency || ""} ${record.minimumDeposit}` : "No minimum recorded"}</Badge>
                  <Badge>{record.geoMode}</Badge>
                </div>
              </div>
            </div>
          </details>
        );
      })}
    </div>
  );
}
