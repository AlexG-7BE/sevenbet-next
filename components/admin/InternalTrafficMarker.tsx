"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const INTERNAL_TRAFFIC_ENDPOINT = "/api/admin/analytics/internal-traffic";

function markThisBrowserInternal() {
  return fetch(INTERNAL_TRAFFIC_ENDPOINT, { method: "POST", credentials: "same-origin" })
    .then((response) => response.ok)
    .catch(() => false);
}

/**
 * Rendered by the protected Admin layout only while the request carried no staff
 * marker: the first signed-in Admin page a browser opens marks it as internal, so
 * the Founder's own phone and laptop stop counting as visitors.
 */
export function AdminInternalTrafficMarker() {
  useEffect(() => {
    void markThisBrowserInternal();
  }, []);
  return null;
}

/** Visible status and a manual fallback for the Analytics page. */
export function InternalDeviceControl({ marked }: { marked: boolean }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "saving" | "failed">("idle");
  if (marked) {
    return <p className="muted" data-internal-device="marked"><strong>This device is internal.</strong> Its visits, clicks and sign-ups are left out of these numbers.</p>;
  }
  return <div data-internal-device="unmarked">
    <p className="muted">This device still counts as a visitor. Mark it so your own test visits, clicks and sign-ups stay out of these numbers.</p>
    <button
      className="button"
      disabled={state === "saving"}
      onClick={() => {
        setState("saving");
        void markThisBrowserInternal().then((ok) => {
          setState(ok ? "idle" : "failed");
          if (ok) router.refresh();
        });
      }}
      type="button"
    >{state === "saving" ? "Marking…" : "Mark this device as internal"}</button>
    {state === "failed" ? <p className="muted" role="status">That did not work. Reload the page and try again.</p> : null}
  </div>;
}
