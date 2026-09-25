"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { browserAnalyticsConsentState } from "@/lib/analytics/consent-contract";
import { PRIVACY_CHOICE_AUTOMATION_OPT_IN_KEY, PRIVACY_CHOICE_DISMISSED_KEY, shouldAutoOpenPrivacyChoice } from "@/lib/analytics/consent-prompt";
import { recordConsentedBrowserPageView } from "@/lib/analytics/product-analytics-client";
import { analyticsConsentMessages } from "@/lib/i18n/analytics-consent-catalog";
import type { SupportedLocale } from "@/lib/market/registry";

export const OPEN_PRIVACY_CHOICES_EVENT = "b4g:open-privacy-choices";

function readSession(key: string) {
  try { return window.sessionStorage.getItem(key); } catch { return null; }
}

function writeSession(key: string, value: string) {
  try { window.sessionStorage.setItem(key, value); } catch { /* storage may be unavailable */ }
}

/** Footer control that opens the analytics choice; the banner owns the dialog. */
export function PrivacyChoicesButton({ className, label }: { className?: string; label: string }) {
  return (
    <button className={className} type="button" aria-haspopup="dialog" data-privacy-choices-trigger onClick={(event) => window.dispatchEvent(new CustomEvent<HTMLElement>(OPEN_PRIVACY_CHOICES_EVENT, { detail: event.currentTarget }))}>
      {label}
    </button>
  );
}

export function AnalyticsConsentBanner({ locale }: { locale: SupportedLocale }) {
  const text = analyticsConsentMessages(locale);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const autoOpened = useRef(false);
  const pathname = usePathname() ?? "/";

  useEffect(() => {
    if (editing) return;
    const open = shouldAutoOpenPrivacyChoice({
      pathname,
      consentState: browserAnalyticsConsentState(),
      dismissed: readSession(PRIVACY_CHOICE_DISMISSED_KEY) === "1",
      automated: navigator.webdriver === true,
      automationOptIn: readSession(PRIVACY_CHOICE_AUTOMATION_OPT_IN_KEY) === "1",
    });
    if (!open) return;
    // An automatic choice is non-modal and does not take focus from the page.
    autoOpened.current = true;
    setEditing(true);
  }, [editing, pathname]);

  useEffect(() => {
    const open = (event: Event) => {
      // Safari does not focus a clicked button, so the trigger identifies itself for focus return.
      const detail = (event as CustomEvent<unknown>).detail;
      opener.current = detail instanceof HTMLElement ? detail : document.activeElement instanceof HTMLElement ? document.activeElement : null;
      autoOpened.current = false;
      setEditing(true);
      closeRef.current?.focus();
    };
    window.addEventListener(OPEN_PRIVACY_CHOICES_EVENT, open);
    return () => window.removeEventListener(OPEN_PRIVACY_CHOICES_EVENT, open);
  }, []);

  useEffect(() => {
    if (editing && !autoOpened.current) closeRef.current?.focus();
  }, [editing]);

  const close = () => {
    setError(false);
    setEditing(false);
    autoOpened.current = false;
    writeSession(PRIVACY_CHOICE_DISMISSED_KEY, "1");
    const target = opener.current;
    opener.current = null;
    if (target?.isConnected) target.focus();
  };

  const update = async (analytics: boolean) => {
    setSaving(true);
    setError(false);
    try {
      const response = await fetch("/api/consent/analytics", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ analytics }),
      });
      if (!response.ok) throw new Error("Consent update failed");
      close();
      if (analytics) {
        recordConsentedBrowserPageView(window.location.pathname);
        window.dispatchEvent(new Event("b4g:analytics-consent-granted"));
      }
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  };

  if (!editing) return null;

  return (
    <aside className="analyticsConsent" role="dialog" aria-modal="false" aria-label={text.dialogLabel} aria-live="polite" onKeyDown={(event) => { if (event.key === "Escape") close(); }}>
      <div>
        <p>
          <strong className="analyticsConsentTitle">{text.title}.</strong> {text.body} <span className="analyticsConsentDetail">{text.detail}</span> <Link href="/privacy" prefetch={false}>{text.privacyNotice}</Link>
        </p>
        {error ? <p role="alert" className="analyticsConsentError">{text.error}</p> : null}
      </div>
      <div className="analyticsConsentActions">
        <button type="button" className="analyticsConsentDecline" disabled={saving} onClick={() => void update(false)}>{text.decline}</button>
        <button type="button" className="analyticsConsentAllow" disabled={saving} onClick={() => void update(true)}>{text.allow}</button>
      </div>
      <button ref={closeRef} type="button" className="analyticsConsentClose" aria-label={text.notNow} disabled={saving} onClick={close}>
        <span aria-hidden="true">×</span>
      </button>
    </aside>
  );
}
