"use client";

import type {
  CasinoBuilderCasino,
  CasinoBuilderGameCategory,
  CasinoBuilderGameProvider,
  CasinoBuilderPaymentMethod,
} from "@/lib/casino-builder/types";

import {
  commaList,
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

const paymentTypeOptions = ["CARD", "E_WALLET", "BANK_TRANSFER", "CRYPTO", "PREPAID", "OTHER"].map((value) => ({ label: value.replaceAll("_", " "), value }));

function newPayment(): CasinoBuilderPaymentMethod {
  return {
    id: crypto.randomUUID(),
    methodKey: "",
    name: "",
    supportsDeposits: true,
    supportsWithdrawals: true,
    currencies: [],
    minimumDeposit: null,
    maximumDeposit: null,
    minimumWithdrawal: null,
    maximumWithdrawal: null,
    depositProcessingTime: null,
    withdrawalTime: null,
    fees: null,
    depositFee: null,
    withdrawalFee: null,
    type: "OTHER",
    countries: [],
    verified: false,
    notes: null,
    archived: false,
    crypto: false,
    sortOrder: 0,
  };
}

export function PaymentEditor({ casino, onChange }: { casino: CasinoBuilderCasino; onChange: (casino: CasinoBuilderCasino) => void }) {
  const update = (record: CasinoBuilderPaymentMethod) => onChange({ ...casino, paymentMethods: replaceById(casino.paymentMethods, record) });
  return (
    <EditorCollection addLabel="Add payment method" empty="No payment methods yet." onAdd={() => onChange({ ...casino, paymentMethods: [...casino.paymentMethods, newPayment()] })}>
      {casino.paymentMethods.map((record) => (
        <EditorRecord
          archived={record.archived}
          key={record.id}
          title={record.name}
          subtitle={`${record.type.replaceAll("_", " ")} · priority ${record.sortOrder}`}
          onArchive={() => update({ ...record, archived: !record.archived })}
          onRemove={() => confirmRemoval(record.name || "payment method") && onChange({ ...casino, paymentMethods: removeById(casino.paymentMethods, record.id) })}
        >
          <div className="builderTwoCol">
            <EditorField label="Name" value={record.name} onChange={(value) => update({ ...record, name: value })} />
            <EditorField label="Code" value={record.methodKey} onChange={(value) => update({ ...record, methodKey: value })} />
            <EditorSelect label="Type" value={record.type} options={paymentTypeOptions} onChange={(value) => update({ ...record, type: value, crypto: value === "CRYPTO" })} />
            <EditorField label="Priority" type="number" min={0} value={record.sortOrder} onChange={(value) => update({ ...record, sortOrder: Number(value) || 0 })} />
            <EditorField label="Currencies" value={record.currencies.join(", ")} onChange={(value) => update({ ...record, currencies: commaList(value) })} hint="Comma-separated ISO codes." />
            <EditorField label="Countries" value={record.countries.join(", ")} onChange={(value) => update({ ...record, countries: commaList(value) })} hint="Comma-separated ISO country codes." />
            <EditorField label="Minimum deposit" inputMode="decimal" value={record.minimumDeposit ?? ""} onChange={(value) => update({ ...record, minimumDeposit: value })} />
            <EditorField label="Maximum deposit" inputMode="decimal" value={record.maximumDeposit ?? ""} onChange={(value) => update({ ...record, maximumDeposit: value })} />
            <EditorField label="Minimum withdrawal" inputMode="decimal" value={record.minimumWithdrawal ?? ""} onChange={(value) => update({ ...record, minimumWithdrawal: value })} />
            <EditorField label="Maximum withdrawal" inputMode="decimal" value={record.maximumWithdrawal ?? ""} onChange={(value) => update({ ...record, maximumWithdrawal: value })} />
            <EditorField label="Deposit fee" inputMode="decimal" value={record.depositFee ?? ""} onChange={(value) => update({ ...record, depositFee: value })} />
            <EditorField label="Withdrawal fee" inputMode="decimal" value={record.withdrawalFee ?? ""} onChange={(value) => update({ ...record, withdrawalFee: value })} />
            <EditorField label="Deposit processing time" value={record.depositProcessingTime ?? ""} onChange={(value) => update({ ...record, depositProcessingTime: value })} />
            <EditorField label="Withdrawal processing time" value={record.withdrawalTime ?? ""} onChange={(value) => update({ ...record, withdrawalTime: value })} />
          </div>
          <div className="casinoEditorChecks">
            <EditorCheckbox label="Deposits" checked={record.supportsDeposits} onChange={(value) => update({ ...record, supportsDeposits: value })} />
            <EditorCheckbox label="Withdrawals" checked={record.supportsWithdrawals} onChange={(value) => update({ ...record, supportsWithdrawals: value })} />
            <EditorCheckbox label="Verified" checked={record.verified} onChange={(value) => update({ ...record, verified: value })} />
          </div>
          <EditorTextArea label="Notes" value={record.notes ?? ""} onChange={(value) => update({ ...record, notes: value })} />
        </EditorRecord>
      ))}
    </EditorCollection>
  );
}

function newProvider(): CasinoBuilderGameProvider {
  return {
    id: crypto.randomUUID(),
    providerKey: "",
    name: "",
    websiteUrl: null,
    gameCount: null,
    liveCasino: false,
    featured: false,
    verified: false,
    archived: false,
    verifiedAt: null,
    sortOrder: 0,
  };
}

export function GameProviderEditor({ casino, onChange }: { casino: CasinoBuilderCasino; onChange: (casino: CasinoBuilderCasino) => void }) {
  const update = (record: CasinoBuilderGameProvider) => onChange({ ...casino, gameProviders: replaceById(casino.gameProviders, record) });
  return (
    <EditorCollection addLabel="Add provider" empty="No game providers yet." onAdd={() => onChange({ ...casino, gameProviders: [...casino.gameProviders, newProvider()] })}>
      {casino.gameProviders.map((record) => (
        <EditorRecord
          archived={record.archived}
          key={record.id}
          title={record.name}
          subtitle={`${record.gameCount ?? 0} games · priority ${record.sortOrder}`}
          onArchive={() => update({ ...record, archived: !record.archived })}
          onRemove={() => confirmRemoval(record.name || "provider") && onChange({ ...casino, gameProviders: removeById(casino.gameProviders, record.id) })}
        >
          <div className="builderTwoCol">
            <EditorField label="Provider name" value={record.name} onChange={(value) => update({ ...record, name: value })} />
            <EditorField label="Slug / code" value={record.providerKey} onChange={(value) => update({ ...record, providerKey: value })} />
            <EditorField label="Website URL" type="url" value={record.websiteUrl ?? ""} onChange={(value) => update({ ...record, websiteUrl: value })} />
            <EditorField label="Game count" type="number" min={0} value={record.gameCount ?? ""} onChange={(value) => update({ ...record, gameCount: numberOrNull(value) })} />
            <EditorField label="Priority" type="number" min={0} value={record.sortOrder} onChange={(value) => update({ ...record, sortOrder: Number(value) || 0 })} />
          </div>
          <div className="casinoEditorChecks">
            <EditorCheckbox label="Live casino" checked={record.liveCasino} onChange={(value) => update({ ...record, liveCasino: value })} />
            <EditorCheckbox label="Featured" checked={record.featured} onChange={(value) => update({ ...record, featured: value })} />
            <EditorCheckbox label="Verified" checked={record.verified} onChange={(value) => update({ ...record, verified: value })} />
          </div>
        </EditorRecord>
      ))}
    </EditorCollection>
  );
}

function newCategory(): CasinoBuilderGameCategory {
  return {
    id: crypto.randomUUID(),
    categoryKey: "",
    name: "",
    gameCount: null,
    featured: false,
    icon: null,
    archived: false,
    sortOrder: 0,
  };
}

export function GameCategoryEditor({ casino, onChange }: { casino: CasinoBuilderCasino; onChange: (casino: CasinoBuilderCasino) => void }) {
  const update = (record: CasinoBuilderGameCategory) => onChange({ ...casino, gameCategories: replaceById(casino.gameCategories, record) });
  return (
    <EditorCollection addLabel="Add category" empty="No game categories yet." onAdd={() => onChange({ ...casino, gameCategories: [...casino.gameCategories, newCategory()] })}>
      {casino.gameCategories.map((record) => (
        <EditorRecord
          archived={record.archived}
          key={record.id}
          title={record.name}
          subtitle={`${record.gameCount ?? 0} games · priority ${record.sortOrder}`}
          onArchive={() => update({ ...record, archived: !record.archived })}
          onRemove={() => confirmRemoval(record.name || "category") && onChange({ ...casino, gameCategories: removeById(casino.gameCategories, record.id) })}
        >
          <div className="builderTwoCol">
            <EditorField label="Category name" value={record.name} onChange={(value) => update({ ...record, name: value })} />
            <EditorField label="Slug / code" value={record.categoryKey} onChange={(value) => update({ ...record, categoryKey: value })} />
            <EditorField label="Game count" type="number" min={0} value={record.gameCount ?? ""} onChange={(value) => update({ ...record, gameCount: numberOrNull(value) })} />
            <EditorField label="Priority" type="number" min={0} value={record.sortOrder} onChange={(value) => update({ ...record, sortOrder: Number(value) || 0 })} />
            <EditorField label="Icon reference" value={record.icon ?? ""} onChange={(value) => update({ ...record, icon: value })} hint="A stable icon key or asset reference." />
            <EditorCheckbox label="Featured" checked={record.featured} onChange={(value) => update({ ...record, featured: value })} />
          </div>
        </EditorRecord>
      ))}
    </EditorCollection>
  );
}
