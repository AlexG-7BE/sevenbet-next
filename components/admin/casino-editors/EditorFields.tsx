"use client";

import { Children, type ReactNode } from "react";

export function EditorField({
  label,
  value,
  onChange,
  type = "text",
  hint,
  min,
  max,
  step,
  inputMode,
  disabled = false,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  hint?: string;
  min?: number;
  max?: number;
  step?: number | string;
  inputMode?: "decimal" | "numeric";
  disabled?: boolean;
}) {
  return (
    <label className="builderField">
      <span>{label}</span>
      <input
        disabled={disabled}
        max={max}
        min={min}
        inputMode={inputMode}
        step={step}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {hint && <small>{hint}</small>}
    </label>
  );
}

export function EditorTextArea({
  label,
  value,
  onChange,
  rows = 4,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  hint?: string;
}) {
  return (
    <label className="builderField">
      <span>{label}</span>
      <textarea rows={rows} value={value} onChange={(event) => onChange(event.target.value)} />
      {hint && <small>{hint}</small>}
    </label>
  );
}

export function EditorSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
}) {
  return (
    <label className="builderField">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

export function EditorCheckbox({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  hint?: string;
}) {
  return (
    <label className="casinoEditorCheckbox">
      <input checked={checked} type="checkbox" onChange={(event) => onChange(event.target.checked)} />
      <span><strong>{label}</strong>{hint && <small>{hint}</small>}</span>
    </label>
  );
}

export function EditorRecord({
  title,
  subtitle,
  archived,
  onArchive,
  onRemove,
  children,
}: {
  title: string;
  subtitle: string;
  archived: boolean;
  onArchive: () => void;
  onRemove: () => void;
  children: ReactNode;
}) {
  return (
    <article className={`casinoEditorRecord${archived ? " archived" : ""}`}>
      <header>
        <div><strong>{title || "Untitled record"}</strong><span>{subtitle}</span></div>
        <div>
          <button className="button ghost" type="button" onClick={onArchive}>{archived ? "Restore" : "Archive"}</button>
          <button className="button ghost danger" type="button" onClick={onRemove}>Remove</button>
        </div>
      </header>
      <div className="builderForm">{children}</div>
    </article>
  );
}

export function EditorCollection({
  addLabel,
  empty,
  onAdd,
  children,
}: {
  addLabel: string;
  empty: string;
  onAdd: () => void;
  children: ReactNode;
}) {
  return (
    <div className="casinoEditorCollection">
      <div className="casinoEditorToolbar">
        <span className="muted">Changes are saved together as one casino revision.</span>
        <button className="button gold" type="button" onClick={onAdd}>{addLabel}</button>
      </div>
      {Children.count(children) > 0 ? children : <p className="casinoEditorEmpty muted">{empty}</p>}
    </div>
  );
}

export function numberOrNull(value: string) {
  return value.trim() ? Number(value) : null;
}

export function commaList(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}
