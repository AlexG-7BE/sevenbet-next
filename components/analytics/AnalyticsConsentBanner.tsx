"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  browserAnalyticsConsentState,
  type AnalyticsConsentState,
} from "@/lib/analytics/consent-contract";

export function AnalyticsConsentBanner() {
  const [state, setState] = useState<AnalyticsConsentState>("unknown");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => setState(browserAnalyticsConsentState()), []);

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
      setState(analytics ? "granted" : "denied");
      setEditing(false);
      if (analytics) window.dispatchEvent(new Event("b4g:analytics-consent-granted"));
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  };

  if (state !== "unknown" && !editing) {
    return (
      <button className="privacyChoiceTrigger" type="button" onClick={() => setEditing(true)}>
        Privacy choices
      </button>
    );
  }

  return (
    <aside className="analyticsConsent" aria-label="Analytics privacy choices" aria-live="polite">
      <div>
        <strong>Your privacy choices</strong>
        <p>
          We use essential storage to keep B4GAMBLE working. With your permission, first-party analytics help us understand site and Programme use. We do not put email, Programme answers, or partner tracking tokens in analytics. <Link href="/privacy">Privacy notice</Link>
        </p>
        {error ? <p role="alert" className="analyticsConsentError">Your choice could not be saved. Please try again.</p> : null}
      </div>
      <div className="analyticsConsentActions">
        <button type="button" disabled={saving} onClick={() => void update(false)}>Decline analytics</button>
        <button type="button" className="button gold" disabled={saving} onClick={() => void update(true)}>Allow analytics</button>
      </div>
    </aside>
  );
}
