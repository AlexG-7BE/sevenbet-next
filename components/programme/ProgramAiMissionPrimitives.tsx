"use client";

import type { ReactNode } from "react";

import type { ProgramAiGuidance } from "@/components/programme/ProgramAiAuthenticated.types";
import {
  humanValue,
  missionResultTitles,
  offerExplanations,
  presentMissionArtifact,
  scenarioCopy,
} from "@/lib/programme/program-ai/mission-presentation";
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

export const sequenceLabels: Record<string, string> = {
  cue: "Cue",
  early_signal: "Early signal",
  urge_builds: "Urge builds",
  choice_point: "Choice point",
};

export function SequenceBuilder({ order, onMove, feedback }: {
  order: readonly string[];
  onMove: (index: number, direction: -1 | 1) => void;
  feedback: string;
}) {
  return <section className={styles.sequenceBuilder} aria-labelledby="sequence-builder-title">
    <div><span className={styles.eyebrow}>BUILD THE SEQUENCE</span><h3 id="sequence-builder-title">Place the earliest moment first.</h3><p>Use Move up and Move down. Dragging is not required.</p></div>
    <ol>{order.map((item, index) => <li key={item}>
      <span>{index + 1}</span><strong>{sequenceLabels[item]}</strong>
      <div><button disabled={index === 0} onClick={() => onMove(index, -1)} type="button">Move up</button><button disabled={index === order.length - 1} onClick={() => onMove(index, 1)} type="button">Move down</button></div>
    </li>)}</ol>
    {feedback ? <p className={styles.sequenceFeedback} role="status">{feedback}</p> : null}
  </section>;
}

export function ScenarioPanel({ eyebrow = "PRACTICE MOMENT", scenario, children }: {
  eyebrow?: string;
  scenario: string;
  children?: ReactNode;
}) {
  return <section className={styles.scenarioPanel}>
    <span className={styles.eyebrow}>{eyebrow}</span>
    <p>{scenarioCopy[scenario] ?? scenario}</p>
    {children}
  </section>;
}

export function AiCandidatePicker({ guidance, selectedId, onSelect, heading }: {
  guidance: ProgramAiGuidance;
  selectedId: string;
  onSelect: (id: string, text: string) => void;
  heading: string;
}) {
  return <section className={styles.aiPicker} aria-labelledby="ai-picker-title">
    <span className={styles.eyebrow}>PERSONAL DRAFT</span>
    <h3 id="ai-picker-title">{heading}</h3>
    <p>{guidance.summary}</p>
    <div>{guidance.options.map((item) => <button aria-pressed={selectedId === item.id} key={item.id} onClick={() => onSelect(item.id, item.text)} type="button"><span>{selectedId === item.id ? "SELECTED" : "CHOOSE"}</span>{item.text}</button>)}</div>
  </section>;
}

export function StackBuilder({ selected, onMove }: {
  selected: readonly string[];
  onMove: (index: number, direction: -1 | 1) => void;
}) {
  return <section className={styles.stackBuilder} aria-label="Friction stack preview">
    <span className={styles.eyebrow}>YOUR STACK · {selected.length} LAYER{selected.length === 1 ? "" : "S"}</span>
    {selected.length ? <ol>{selected.map((item, index) => <li key={item}><span>LAYER {index + 1}</span><strong>{humanValue(item)}</strong><div><button disabled={index === 0} onClick={() => onMove(index, -1)} type="button">Move up</button><button disabled={index === selected.length - 1} onClick={() => onMove(index, 1)} type="button">Move down</button></div></li>)}</ol> : <p>Choose the first layer to begin.</p>}
  </section>;
}

export function DecisionApplication({ checks, applied, onToggle }: {
  checks: readonly string[];
  applied: readonly string[];
  onToggle: (value: string) => void;
}) {
  return <section className={styles.applicationPanel}>
    <span className={styles.eyebrow}>SECOND PRACTICE MOMENT</span>
    <h3>The quick route appears again.</h3>
    <p>Apply each check you built before choosing the pause rule.</p>
    <div>{checks.map((check) => <label key={check}><input checked={applied.includes(check)} onChange={() => onToggle(check)} type="checkbox" /><span>{humanValue(check)}</span></label>)}</div>
  </section>;
}

export function OfferDecoder({ selected }: { selected: string }) {
  return <section className={styles.offerDecoder}>
    <span className={styles.eyebrow}>GENERIC OFFER-TERM CARD</span>
    <div><strong>Bonus headline</strong><span>Wagering requirement</span><span>Expiry</span><span>Eligible games</span></div>
    <h3>What would you check before judging the headline?</h3>
    {selected ? <p role="status"><strong>{humanValue(selected)}.</strong> {offerExplanations[selected]}</p> : <p>Choose one material term to reveal why it matters.</p>}
  </section>;
}

export function ProgrammeTimeline({ startingPoint, facts }: {
  startingPoint?: string | null;
  facts: ReadonlyArray<{
    missionNumber: number;
    title: string;
    artifact: Record<string, string | number | boolean | string[]>;
  }>;
}) {
  const items = [
    ...(startingPoint ? [{ number: 1, label: "Starting Point", rows: [{ key: "startingPoint", label: "Confirmed Starting Point", value: startingPoint }] }] : []),
    ...facts.flatMap((fact) => {
      const rows = presentMissionArtifact(fact.artifact).filter((row) => row.value !== "Unavailable");
      return rows.length ? [{ number: fact.missionNumber, label: fact.title, rows }] : [];
    }),
  ];
  return <section className={styles.programmeTimeline} aria-labelledby="programme-timeline-title">
    <span className={styles.eyebrow}>YOUR PROGRAMME TIMELINE</span><h3 id="programme-timeline-title">What you have built, in order.</h3>
    <ol>{items.map((item) => <li key={item.number}><span>{String(item.number).padStart(2, "0")}</span><div><strong>{item.label}</strong><dl>{item.rows.map((row) => <div key={row.key}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}</dl></div></li>)}</ol>
  </section>;
}

export function HumanArtifact({ artifact, missionNumber, localWording, guidance, guidanceSelected }: {
  artifact: Record<string, string | number | boolean | string[]>;
  missionNumber: number;
  localWording?: string;
  guidance?: ProgramAiGuidance | null;
  guidanceSelected?: string;
}) {
  const rows = presentMissionArtifact(artifact);
  const guidanceText = guidanceSelected
    ? guidance?.options.find((option) => option.id === guidanceSelected)?.text
    : undefined;
  return <aside className={styles.artifact} data-testid="programme-artifact">
    <span className={styles.eyebrow}>LIVE RESULT</span>
    <h3>{missionResultTitles[missionNumber] ?? "YOUR RESULT"}</h3>
    {rows.length ? <dl>{rows.map((row) => <div key={row.key}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}</dl> : <p>Complete the first action to begin building this result.</p>}
    {localWording?.trim() ? <blockquote>{localWording.trim()}</blockquote> : guidanceText ? <blockquote>{guidanceText}</blockquote> : null}
  </aside>;
}
