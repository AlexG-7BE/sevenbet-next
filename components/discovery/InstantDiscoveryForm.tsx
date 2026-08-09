"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useTransition } from "react";
import type { ComponentPropsWithoutRef, FormEvent, ReactNode } from "react";

import styles from "./InstantDiscoveryForm.module.css";

type FormProps = Omit<
  ComponentPropsWithoutRef<"form">,
  "action" | "children" | "method" | "onChange" | "onInput" | "onSubmit"
> & {
  action: string;
  children: ReactNode;
  debouncedFields?: string[];
  debounceMs?: number;
  pendingLabel?: string;
};

function formTarget(form: HTMLFormElement) {
  const target = new URL(form.action, window.location.href);
  const params = new URLSearchParams();
  for (const [name, value] of new FormData(form).entries()) {
    if (typeof value === "string" && value !== "") params.append(name, value);
  }
  params.delete("page");
  target.search = params.toString();
  return `${target.pathname}${target.search}${target.hash}`;
}

export function InstantDiscoveryForm({
  action,
  children,
  className,
  debouncedFields = [],
  debounceMs = 300,
  pendingLabel = "Updating results…",
  ...props
}: FormProps) {
  const router = useRouter();
  const timerRef = useRef<number | null>(null);
  const [pending, startNavigation] = useTransition();
  const debounced = new Set(debouncedFields);

  useEffect(() => () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
  }, []);

  function clearTimer() {
    if (timerRef.current === null) return;
    window.clearTimeout(timerRef.current);
    timerRef.current = null;
  }

  function navigate(form: HTMLFormElement, mode: "push" | "replace") {
    const target = formTarget(form);
    const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (target === current) return;
    startNavigation(() => router[mode](target, { scroll: false }));
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearTimer();
    navigate(event.currentTarget, "push");
  }

  function onChange(event: FormEvent<HTMLFormElement>) {
    const control = event.target;
    if (!(control instanceof HTMLInputElement || control instanceof HTMLSelectElement) || !control.name || debounced.has(control.name)) return;
    const discrete = control instanceof HTMLSelectElement || control.type === "checkbox" || control.type === "radio";
    if (!discrete) return;
    clearTimer();
    navigate(event.currentTarget, "push");
  }

  function onInput(event: FormEvent<HTMLFormElement>) {
    const control = event.target;
    if (!(control instanceof HTMLInputElement) || !control.name || !debounced.has(control.name)) return;
    const form = event.currentTarget;
    clearTimer();
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      navigate(form, "replace");
    }, debounceMs);
  }

  return <form
    {...props}
    action={action}
    aria-busy={pending}
    className={`${styles.form}${className ? ` ${className}` : ""}`}
    data-instant-discovery-form="true"
    data-pending={pending}
    method="get"
    onChange={onChange}
    onInput={onInput}
    onSubmit={onSubmit}
  >
    {children}
    <span aria-atomic="true" aria-live="polite" className={styles.status} role="status">{pending ? pendingLabel : ""}</span>
  </form>;
}
