"use client";

import type { ReactNode } from "react";

import type { ProgramAiGuidance } from "@/components/programme/ProgramAiAuthenticated.types";
import { programmeMissionCopy, programmeText } from "@/lib/i18n/programme-catalog";
import {
  humanValue,
  programmeMissionResultTitle,
  programmeOfferExplanation,
  programmeScenarioText,
  presentMissionArtifact,
} from "@/lib/programme/program-ai/mission-presentation";
import type { ProgrammeLocale } from "@/lib/programme/presentation";
import styles from "./ProgramAiAuthenticated.module.css";

export type ChoiceOption = { value: string; label: string; description?: string };

export function ChoiceCards({
  legend,
  options,
  selected,
  multiple = false,
  selectionNote,
  onChoose,
}: {
  legend: string;
  options: readonly ChoiceOption[];
  selected: readonly string[];
  multiple?: boolean;
  selectionNote?: string;
  onChoose: (value: string) => void;
}) {
  return <fieldset className={styles.choices}>
    <legend>{legend}{selectionNote ? ` · ${selectionNote}` : ""}</legend>
    {options.map((item) => {
      const checked = selected.includes(item.value);
      return <label className={styles.choice} key={item.value}>
        <input checked={checked} name={legend} onChange={() => onChoose(item.value)} type={multiple ? "checkbox" : "radio"} />
        <span><strong>{item.label}</strong>{item.description ? <small>{item.description}</small> : null}</span>
      </label>;
    })}
  </fieldset>;
}

export function SequenceBuilder({ order, onMove, feedback, locale }: {
  order: readonly string[];
  onMove: (index: number, direction: -1 | 1) => void;
  feedback: string;
  locale: ProgrammeLocale;
}) {
  return <section className={styles.sequenceBuilder} aria-labelledby="sequence-builder-title">
    <div><span className={styles.eyebrow}>{programmeText(locale, "BUILD THE SEQUENCE")}</span><h3 id="sequence-builder-title">{programmeText(locale, "Place the earliest moment first.")}</h3><p>{programmeText(locale, "Use Move up and Move down. Dragging is not required.")}</p></div>
    <ol>{order.map((item, index) => <li key={item}>
      <span>{index + 1}</span><strong>{humanValue(item, locale)}</strong>
      <div><button disabled={index === 0} onClick={() => onMove(index, -1)} type="button">{programmeText(locale, "Move up")}</button><button disabled={index === order.length - 1} onClick={() => onMove(index, 1)} type="button">{programmeText(locale, "Move down")}</button></div>
    </li>)}</ol>
    {feedback ? <p className={styles.sequenceFeedback} role="status">{feedback}</p> : null}
  </section>;
}

export function ScenarioPanel({ eyebrow, scenario, children, locale }: {
  eyebrow?: string;
  scenario: string;
  children?: ReactNode;
  locale: ProgrammeLocale;
}) {
  return <section className={styles.scenarioPanel}>
    <span className={styles.eyebrow}>{eyebrow ?? programmeText(locale, "PRACTICE MOMENT")}</span>
    <p>{programmeScenarioText(scenario, locale)}</p>
    {children}
  </section>;
}

export function AiCandidatePicker({ guidance, selectedId, onSelect, heading, locale }: {
  guidance: ProgramAiGuidance;
  selectedId: string;
  onSelect: (id: string, text: string) => void;
  heading: string;
  locale: ProgrammeLocale;
}) {
  return <section className={styles.aiPicker} aria-labelledby="ai-picker-title">
    <span className={styles.eyebrow}>{programmeText(locale, "PERSONAL DRAFT")}</span>
    <h3 id="ai-picker-title">{heading}</h3>
    <p>{guidance.summary}</p>
    <div>{guidance.options.map((item) => <button aria-pressed={selectedId === item.id} key={item.id} onClick={() => onSelect(item.id, item.text)} type="button"><span>{programmeText(locale, selectedId === item.id ? "SELECTED" : "CHOOSE")}</span>{item.text}</button>)}</div>
  </section>;
}

export function StackBuilder({ selected, onMove, locale }: {
  selected: readonly string[];
  onMove: (index: number, direction: -1 | 1) => void;
  locale: ProgrammeLocale;
}) {
  return <section className={styles.stackBuilder} aria-label={programmeText(locale, "Friction stack preview")}>
    <span className={styles.eyebrow}>{programmeText(locale, "YOUR STACK · {count} {layers}", { count: selected.length, layers: programmeText(locale, selected.length === 1 ? "LAYER" : "LAYERS") })}</span>
    {selected.length ? <ol>{selected.map((item, index) => <li key={item}><span>{programmeText(locale, "Layer {number}", { number: index + 1 })}</span><strong>{humanValue(item, locale)}</strong><div><button disabled={index === 0} onClick={() => onMove(index, -1)} type="button">{programmeText(locale, "Move up")}</button><button disabled={index === selected.length - 1} onClick={() => onMove(index, 1)} type="button">{programmeText(locale, "Move down")}</button></div></li>)}</ol> : <p>{programmeText(locale, "Choose the first layer to begin.")}</p>}
  </section>;
}

export function DecisionApplication({ checks, applied, onToggle, locale }: {
  checks: readonly string[];
  applied: readonly string[];
  onToggle: (value: string) => void;
  locale: ProgrammeLocale;
}) {
  return <section className={styles.applicationPanel}>
    <span className={styles.eyebrow}>{programmeText(locale, "SECOND PRACTICE MOMENT")}</span>
    <h3>{programmeText(locale, "The quick route appears again.")}</h3>
    <p>{programmeText(locale, "Apply each check you built before choosing the pause rule.")}</p>
    <div>{checks.map((check) => <label key={check}><input checked={applied.includes(check)} onChange={() => onToggle(check)} type="checkbox" /><span>{humanValue(check, locale, "decisionChecks")}</span></label>)}</div>
  </section>;
}

export function OfferDecoder({ selected, locale }: { selected: string; locale: ProgrammeLocale }) {
  return <section className={styles.offerDecoder}>
    <span className={styles.eyebrow}>{programmeText(locale, "GENERIC OFFER-TERM CARD")}</span>
    <div><strong>{programmeText(locale, "Bonus headline")}</strong><span>{programmeText(locale, "Wagering requirement")}</span><span>{programmeText(locale, "Expiry")}</span><span>{programmeText(locale, "Eligible games")}</span></div>
    <h3>{programmeText(locale, "What would you check before judging the headline?")}</h3>
    {selected ? <p role="status"><strong>{humanValue(selected, locale)}.</strong> {programmeOfferExplanation(selected, locale)}</p> : <p>{programmeText(locale, "Choose one material term to reveal why it matters.")}</p>}
  </section>;
}

export function ProgrammeTimeline({ startingPoint, facts, locale }: {
  startingPoint?: string | null;
  facts: ReadonlyArray<{
    missionNumber: number;
    artifact: Record<string, string | number | boolean | string[]>;
  }>;
  locale: ProgrammeLocale;
}) {
  const items = [
    ...(startingPoint ? [{ number: 1, label: programmeText(locale, "Starting Point"), rows: [{ key: "startingPoint", label: programmeText(locale, "Confirmed Starting Point"), value: startingPoint }] }] : []),
    ...facts.flatMap((fact) => {
      const rows = presentMissionArtifact(fact.artifact, locale).filter((row) => row.value !== programmeText(locale, "Unavailable"));
      return rows.length ? [{ number: fact.missionNumber, label: programmeMissionCopy(locale, fact.missionNumber).title, rows }] : [];
    }),
  ];
  return <section className={styles.programmeTimeline} aria-labelledby="programme-timeline-title">
    <span className={styles.eyebrow}>{programmeText(locale, "YOUR PROGRAMME TIMELINE")}</span><h3 id="programme-timeline-title">{programmeText(locale, "What you have built, in order.")}</h3>
    <ol>{items.map((item) => <li key={item.number}><span>{String(item.number).padStart(2, "0")}</span><div><strong>{item.label}</strong><dl>{item.rows.map((row) => <div key={row.key}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}</dl></div></li>)}</ol>
  </section>;
}

export function HumanArtifact({ artifact, missionNumber, localWording, guidance, guidanceSelected, locale }: {
  artifact: Record<string, string | number | boolean | string[]>;
  missionNumber: number;
  localWording?: string;
  guidance?: ProgramAiGuidance | null;
  guidanceSelected?: string;
  locale: ProgrammeLocale;
}) {
  const rows = presentMissionArtifact(artifact, locale);
  const guidanceText = guidanceSelected
    ? guidance?.options.find((option) => option.id === guidanceSelected)?.text
    : undefined;
  return <aside className={styles.artifact} data-testid="programme-artifact">
    <span className={styles.eyebrow}>{programmeText(locale, "LIVE RESULT")}</span>
    <h3>{programmeMissionResultTitle(missionNumber, locale)}</h3>
    {rows.length ? <dl>{rows.map((row) => <div key={row.key}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}</dl> : <p>{programmeText(locale, "Complete the first action to begin building this result.")}</p>}
    {localWording?.trim() ? <blockquote>{localWording.trim()}</blockquote> : guidanceText ? <blockquote>{guidanceText}</blockquote> : null}
  </aside>;
}
