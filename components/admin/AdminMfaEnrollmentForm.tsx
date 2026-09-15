"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";

import { authClient } from "@/lib/auth/client";

type EnrollmentMaterial = {
  backupCodes: string[];
  secret: string;
};

function secretFromTotpUri(totpURI: string) {
  try {
    return new URL(totpURI).searchParams.get("secret") ?? "";
  } catch {
    return "";
  }
}

export function AdminMfaEnrollmentForm({ callbackUrl }: { callbackUrl: string }) {
  const router = useRouter();
  const [material, setMaterial] = useState<EnrollmentMaterial | null>(null);
  const [confirmedSaved, setConfirmedSaved] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!material || verified) return;

    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [material, verified]);

  const codesForCopy = useMemo(
    () => material?.backupCodes.join("\n") ?? "",
    [material],
  );

  async function beginEnrollment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const password = String(new FormData(event.currentTarget).get("password") ?? "");

    try {
      const result = await authClient.twoFactor.enable({
        method: "totp",
        password,
      });
      if (result.error || !result.data || result.data.method !== "totp") {
        setError("Setup could not be started. Check your password and try again.");
        return;
      }

      const secret = secretFromTotpUri(result.data.totpURI);
      if (!secret || !result.data.backupCodes.length) {
        setError("Setup material was incomplete. Sign in again and retry.");
        return;
      }

      setMaterial({ secret, backupCodes: result.data.backupCodes });
    } catch {
      setError("Setup could not be started. Check your password and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyEnrollment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const code = String(new FormData(event.currentTarget).get("code") ?? "")
      .replace(/\s/g, "");

    try {
      const result = await authClient.twoFactor.verifyTotp({
        code,
        trustDevice: false,
      });
      if (result.error) {
        setError("That authenticator code was not accepted. Wait for a new code and try again.");
        return;
      }

      setVerified(true);
    } catch {
      setError("That authenticator code was not accepted. Wait for a new code and try again.");
    } finally {
      setLoading(false);
    }
  }

  if (verified) {
    return (
      <div className="adminMfaSuccess" role="status">
        <strong>Multi-factor authentication is active.</strong>
        <p>All earlier sessions were revoked. Keep the backup codes offline and use each only once.</p>
        <button
          className="button gold"
          onClick={() => {
            router.replace(callbackUrl);
            router.refresh();
          }}
          type="button"
        >
          Continue to Admin
        </button>
      </div>
    );
  }

  if (!material) {
    return (
      <form className="adminLoginForm" onSubmit={beginEnrollment}>
        <label>
          <span>Confirm your password</span>
          <input autoComplete="current-password" name="password" required type="password" />
        </label>
        {error ? <p className="adminFormError" role="alert">{error}</p> : null}
        <button className="button gold" disabled={loading} type="submit">
          {loading ? "Starting setup…" : "Set up authenticator"}
        </button>
      </form>
    );
  }

  return (
    <form className="adminLoginForm" onSubmit={verifyEnrollment}>
      <section className="adminMfaStep" aria-labelledby="admin-mfa-secret-title">
        <p className="eyebrow">Step 1</p>
        <h2 id="admin-mfa-secret-title">Add the setup key</h2>
        <p className="muted">In your authenticator app, add an account manually and enter this key.</p>
        <code className="adminCode adminMfaSecret">{material.secret}</code>
        <p className="muted">Time based · 6 digits · refreshes every 30 seconds</p>
      </section>

      <section className="adminMfaStep" aria-labelledby="admin-mfa-backup-title">
        <p className="eyebrow">Step 2</p>
        <h2 id="admin-mfa-backup-title">Store your backup codes</h2>
        <p className="muted">These codes are shown once. Save them in an approved password manager or offline secure store.</p>
        <div className="adminMfaCodes" aria-label="Backup codes">
          {material.backupCodes.map((code) => <code key={code}>{code}</code>)}
        </div>
        <button
          className="adminMfaCopy"
          onClick={() => void navigator.clipboard.writeText(codesForCopy)}
          type="button"
        >
          Copy all codes
        </button>
        <label className="adminMfaConfirm">
          <input
            checked={confirmedSaved}
            onChange={(event) => setConfirmedSaved(event.target.checked)}
            type="checkbox"
          />
          <span>I have stored these backup codes securely.</span>
        </label>
      </section>

      <section className="adminMfaStep" aria-labelledby="admin-mfa-verify-title">
        <p className="eyebrow">Step 3</p>
        <h2 id="admin-mfa-verify-title">Verify the authenticator</h2>
        <label>
          <span>6-digit code</span>
          <input
            autoComplete="one-time-code"
            inputMode="numeric"
            name="code"
            pattern="[0-9 ]{6,8}"
            required
            spellCheck={false}
            type="text"
          />
        </label>
      </section>

      {error ? <p className="adminFormError" role="alert">{error}</p> : null}

      <button className="button gold" disabled={loading || !confirmedSaved} type="submit">
        {loading ? "Verifying…" : "Verify and activate MFA"}
      </button>
    </form>
  );
}
