"use client";

import Link from "next/link";
import { useRef, useState } from "react";

import { ActionButton } from "@/components/design-system/Action";
import { SUPPORT_MAILBOX, type ContactFieldErrors } from "@/lib/contact/contracts";
import { validateContactPayload } from "@/lib/contact/validation";
import styles from "./ContactPage.module.css";

type Values = { name: string; email: string; subject: string; message: string; company: string };
type SubmissionState = "idle" | "submitting" | "success" | "error";

const emptyValues: Values = { name: "", email: "", subject: "", message: "", company: "" };

function describedBy(hint: string, error: string, hasError: boolean) {
  return hasError ? `${hint} ${error}` : hint;
}

export function ContactForm() {
  const [values, setValues] = useState<Values>(emptyValues);
  const [fieldErrors, setFieldErrors] = useState<ContactFieldErrors>({});
  const [submissionState, setSubmissionState] = useState<SubmissionState>("idle");
  const inFlight = useRef(false);
  const statusRef = useRef<HTMLDivElement>(null);

  function update(field: keyof Values, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    if (field !== "company" && fieldErrors[field]) {
      setFieldErrors((current) => ({ ...current, [field]: undefined }));
    }
    if (submissionState === "error") setSubmissionState("idle");
  }

  function focusStatus() {
    requestAnimationFrame(() => statusRef.current?.focus());
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;

    const validation = validateContactPayload(values);
    if (!validation.ok) {
      setFieldErrors(validation.fieldErrors);
      setSubmissionState("idle");
      requestAnimationFrame(() => document.querySelector<HTMLElement>("[data-contact-form] [aria-invalid='true']")?.focus());
      return;
    }

    inFlight.current = true;
    setFieldErrors({});
    setSubmissionState("submitting");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const result = await response.json().catch(() => null) as { fieldErrors?: ContactFieldErrors } | null;
      if (!response.ok) {
        if (response.status === 400 && result?.fieldErrors) setFieldErrors(result.fieldErrors);
        setSubmissionState("error");
        focusStatus();
        return;
      }
      setValues(emptyValues);
      setSubmissionState("success");
      focusStatus();
    } catch {
      setSubmissionState("error");
      focusStatus();
    } finally {
      inFlight.current = false;
    }
  }

  return (
    <div className={styles.formPanel}>
      <p className={styles.sectionLabel}>General contact</p>
      <h2>Send a message.</h2>
      <p className={styles.formIntro}>All fields are required except your name.</p>

      <form className={styles.form} data-contact-form noValidate onSubmit={submit}>
        <div className={styles.field}>
          <label htmlFor="contact-name">Name <span className={styles.optional}>(optional)</span></label>
          <input
            aria-describedby={describedBy("contact-name-hint", "contact-name-error", Boolean(fieldErrors.name))}
            aria-invalid={Boolean(fieldErrors.name)}
            autoComplete="name"
            id="contact-name"
            maxLength={100}
            name="name"
            onChange={(event) => update("name", event.target.value)}
            type="text"
            value={values.name}
          />
          <p className={styles.hint} id="contact-name-hint">Up to 100 characters.</p>
          {fieldErrors.name ? <p className={styles.error} id="contact-name-error">{fieldErrors.name}</p> : null}
        </div>

        <div className={styles.field}>
          <label htmlFor="contact-email">Email</label>
          <input
            aria-describedby={describedBy("contact-email-hint", "contact-email-error", Boolean(fieldErrors.email))}
            aria-invalid={Boolean(fieldErrors.email)}
            autoComplete="email"
            id="contact-email"
            maxLength={254}
            name="email"
            onChange={(event) => update("email", event.target.value)}
            required
            type="email"
            value={values.email}
          />
          <p className={styles.hint} id="contact-email-hint">Used only to handle your enquiry.</p>
          {fieldErrors.email ? <p className={styles.error} id="contact-email-error">{fieldErrors.email}</p> : null}
        </div>

        <div className={styles.field}>
          <label htmlFor="contact-subject">Subject</label>
          <input
            aria-describedby={describedBy("contact-subject-hint", "contact-subject-error", Boolean(fieldErrors.subject))}
            aria-invalid={Boolean(fieldErrors.subject)}
            id="contact-subject"
            maxLength={160}
            name="subject"
            onChange={(event) => update("subject", event.target.value)}
            required
            type="text"
            value={values.subject}
          />
          <p className={styles.hint} id="contact-subject-hint">Up to 160 characters.</p>
          {fieldErrors.subject ? <p className={styles.error} id="contact-subject-error">{fieldErrors.subject}</p> : null}
        </div>

        <div className={styles.field}>
          <label htmlFor="contact-message">Message</label>
          <textarea
            aria-describedby={describedBy("contact-message-hint", "contact-message-error", Boolean(fieldErrors.message))}
            aria-invalid={Boolean(fieldErrors.message)}
            id="contact-message"
            maxLength={4000}
            minLength={10}
            name="message"
            onChange={(event) => update("message", event.target.value)}
            required
            rows={7}
            value={values.message}
          />
          <p className={styles.hint} id="contact-message-hint">10–4,000 characters.</p>
          {fieldErrors.message ? <p className={styles.error} id="contact-message-error">{fieldErrors.message}</p> : null}
        </div>

        <div className={styles.honeypot} aria-hidden="true">
          <label htmlFor="contact-company">Company website</label>
          <input
            autoComplete="off"
            id="contact-company"
            name="company"
            onChange={(event) => update("company", event.target.value)}
            tabIndex={-1}
            type="text"
            value={values.company}
          />
        </div>

        <p className={styles.sensitiveNote}>Please do not include passwords, payment details or private Programme answers in this form.</p>
        <p className={styles.privacyNote}>We use the information you submit only to handle your enquiry and protect the form from abuse. See our <Link href="/privacy">Privacy Notice</Link>.</p>

        {submissionState === "success" ? (
          <div className={styles.status} data-state="success" ref={statusRef} role="status" tabIndex={-1}>
            <strong>Message sent.</strong>
            <p>We received your enquiry.</p>
          </div>
        ) : null}
        {submissionState === "error" ? (
          <div className={styles.status} data-state="error" ref={statusRef} role="alert" tabIndex={-1}>
            <strong>We couldn&apos;t send your message.</strong>
            <p>Please try again or email <a href={`mailto:${SUPPORT_MAILBOX}`}>{SUPPORT_MAILBOX}</a> directly.</p>
          </div>
        ) : null}

        <ActionButton className={styles.submit} disabled={submissionState === "submitting"} type="submit">
          {submissionState === "submitting" ? "Sending…" : "Send message"}
        </ActionButton>
      </form>
    </div>
  );
}
