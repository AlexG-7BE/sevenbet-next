"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import styles from "./SelfCheckPage.module.css";

type Answer = "no" | "once" | "repeated" | "skip";
type Result = "clear" | "review" | "help";

const questions = [
  "Did a gambling session continue longer than you intended?",
  "Did you spend more than the limit you had chosen for yourself?",
  "After losing money, did you keep gambling mainly because you wanted to recover it?",
  "When you decided you wanted to stop, was it difficult to follow through?",
  "Did gambling affect money you needed for bills, essentials or other commitments?",
  "Did gambling interfere with work, study, sleep, relationships or normal routines?",
  "Did you use borrowed money, credit or sell something so that you could keep gambling?",
  "Did you hide or minimise how much time or money you spent gambling?",
] as const;

const answerOptions: readonly { value: Answer; label: string }[] = [
  { value: "no", label: "No" },
  { value: "once", label: "Once" },
  { value: "repeated", label: "More than once" },
  { value: "skip", label: "Not sure / prefer not to answer" },
];

function routeResult(answers: readonly Answer[]): Result {
  const concern = (answer: Answer | undefined) => answer === "once" || answer === "repeated";
  const ordinaryConcernCount = answers.filter(concern).length;
  const helpFirst = concern(answers[4]) || concern(answers[6]) || answers[2] === "repeated" || answers[3] === "repeated" || ordinaryConcernCount >= 3;
  if (helpFirst) return "help";
  if (ordinaryConcernCount > 0) return "review";
  return "clear";
}

const resultContent = {
  clear: {
    title: "No current concerns flagged",
    copy: <>You did not flag any of the situations in this reflection.<br /><br />That does not mean gambling is risk-free or that this tool can decide whether gambling is safe for you.<br /><br />Keep your own limits visible and return to this check if your circumstances change.</>,
    primary: { href: "/program", label: "Review your personal boundaries" },
    secondary: { href: "/help", label: "Open Protected Help" },
  },
  review: {
    title: "Some areas worth reviewing",
    copy: <>Some of your answers point to areas that may be worth reviewing.<br /><br />Consider pausing before your next gambling decision and looking again at the limits or situations you selected.<br /><br />This is a reflection, not a diagnosis.</>,
    primary: { href: "/program", label: "Review 10-Step Programme" },
    secondary: { href: "/help", label: "Open Protected Help" },
  },
  help: {
    title: "Help-first",
    copy: <>Some of your answers suggest gambling may be having a meaningful impact or may be difficult to control.<br /><br />Consider pausing gambling and using the support options below.<br /><br />This tool does not diagnose a condition.</>,
    primary: { href: "/help", label: "Open Protected Help" },
    secondary: { href: "/program", label: "Review your control plan" },
  },
} as const;

export function SelfCheckFlow() {
  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Array<Answer | undefined>>(() => Array(questions.length).fill(undefined));
  const [result, setResult] = useState<Result | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const questionRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (result) resultRef.current?.focus();
  }, [result]);

  useEffect(() => {
    if (started && !result) questionRef.current?.focus();
  }, [started, current, result]);

  function choose(answer: Answer) {
    setAnswers((previous) => previous.map((value, index) => index === current ? answer : value));
  }

  function next() {
    if (!answers[current]) return;
    if (current === questions.length - 1) {
      setResult(routeResult(answers as Answer[]));
      return;
    }
    setCurrent((value) => value + 1);
  }

  function back() {
    setCurrent((value) => Math.max(0, value - 1));
  }

  function restart() {
    setStarted(false);
    setCurrent(0);
    setAnswers(Array(questions.length).fill(undefined));
    setResult(null);
  }

  if (result) {
    const content = resultContent[result];
    return (
      <div className={`${styles.flow} ${result === "help" ? styles.helpResult : ""}`} data-self-check-flow data-self-check-state={`result-${result}`}>
        <div className={styles.result} ref={resultRef} tabIndex={-1} role="status" aria-live="polite">
          <p className={styles.eyebrow}>{result === "help" ? "Support first" : "Private by default · Your reflection"}</p>
          <h2>{content.title}</h2>
          <p>{content.copy}</p>
          <div className={styles.resultActions}>
            <Link className={styles.primaryAction} href={content.primary.href}>{content.primary.label}</Link>
            <Link className={styles.secondaryAction} href={content.secondary.href}>{content.secondary.label}</Link>
            <button className={styles.restart} type="button" onClick={restart}>Restart reflection</button>
          </div>
        </div>
      </div>
    );
  }

  if (!started) {
    return <div className={styles.flow} data-self-check-flow data-self-check-state="intro"><button className={styles.primaryAction} type="button" onClick={() => setStarted(true)}>Start private reflection</button></div>;
  }

  return (
    <div className={styles.flow} data-self-check-flow data-self-check-state="question">
      <form className={styles.questionForm} onSubmit={(event) => { event.preventDefault(); next(); }} ref={questionRef} tabIndex={-1} aria-labelledby="self-check-question-title">
        <p className={styles.progress}><span>Private by default</span>{String(current + 1).padStart(2, "0")} / {String(questions.length).padStart(2, "0")}</p>
        <fieldset>
          <legend id="self-check-question-title">{questions[current]}</legend>
          <div className={styles.answers}>
            {answerOptions.map((option) => (
              <label key={option.value} className={answers[current] === option.value ? styles.selected : undefined}>
                <input type="radio" name={`question-${current + 1}`} value={option.value} checked={answers[current] === option.value} onChange={() => choose(option.value)} />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className={styles.navigation}>
          <button type="button" onClick={back} disabled={current === 0}>Back</button>
          <button type="submit" disabled={!answers[current]}>{current === questions.length - 1 ? "View reflection" : "Next"}</button>
        </div>
      </form>
    </div>
  );
}
