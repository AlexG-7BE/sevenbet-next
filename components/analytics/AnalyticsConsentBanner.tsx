"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export function AnalyticsConsentBanner() {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dismissRef = useRef<HTMLButtonElement>(null);
  const restoreTriggerFocus = useRef(false);

  useEffect(() => {
    if (editing) {
      dismissRef.current?.focus();
    } else if (restoreTriggerFocus.current) {
      restoreTriggerFocus.current = false;
      triggerRef.current?.focus();
    }
  }, [editing]);

  const close = () => {
    setError(false);
    restoreTriggerFocus.current = true;
    setEditing(false);
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
      if (analytics) window.dispatchEvent(new Event("b4g:analytics-consent-granted"));
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <button ref={triggerRef} className="privacyChoiceTrigger" type="button" aria-haspopup="dialog" onClick={() => setEditing(true)}>
        Privacy choices
      </button>
    );
  }

  return (
    <aside className="analyticsConsent" role="dialog" aria-modal="false" aria-label="Analytics privacy choices" aria-live="polite">
      <div>
        <strong>Your privacy choices</strong>
        <p>
          We use essential storage to keep B4GAMBLE working. With your permission, first-party analytics help us understand site and Programme use. We do not put email, Programme answers, or partner tracking tokens in analytics. <Link href="/privacy">Privacy notice</Link>
        </p>
        {error ? <p role="alert" className="analyticsConsentError">Your choice could not be saved. Please try again.</p> : null}
      </div>
      <div className="analyticsConsentActions">
        <button ref={dismissRef} type="button" disabled={saving} onClick={close}>Not now</button>
        <button type="button" disabled={saving} onClick={() => void update(false)}>Decline analytics</button>
        <button type="button" className="button gold" disabled={saving} onClick={() => void update(true)}>Allow analytics</button>
      </div>
    </aside>
  );
}
