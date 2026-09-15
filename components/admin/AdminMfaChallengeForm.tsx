"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { authClient } from "@/lib/auth/client";

type ChallengeMode = "totp" | "backup";

export function AdminMfaChallengeForm({ callbackUrl }: { callbackUrl: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<ChallengeMode>("totp");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(event.currentTarget);
    const rawCode = String(form.get("code") ?? "").trim();

    try {
      const result = mode === "totp"
        ? await authClient.twoFactor.verifyTotp({
            code: rawCode.replace(/\s/g, ""),
            trustDevice: false,
          })
        : await authClient.twoFactor.verifyBackupCode({
            code: rawCode,
            disableSession: false,
            trustDevice: false,
          });

      if (result.error) {
        setError("The verification code was not accepted. Try again or sign in for a new challenge.");
        return;
      }

      router.replace(callbackUrl);
      router.refresh();
    } catch {
      setError("The verification code was not accepted. Try again or sign in for a new challenge.");
    } finally {
      setLoading(false);
    }
  }

  function selectMode(nextMode: ChallengeMode) {
    setMode(nextMode);
    setError("");
  }

  return (
    <form className="adminLoginForm" onSubmit={handleSubmit}>
      <div className="adminMfaMode" aria-label="Verification method" role="group">
        <button
          aria-pressed={mode === "totp"}
          className={mode === "totp" ? "active" : ""}
          onClick={() => selectMode("totp")}
          type="button"
        >
          Authenticator code
        </button>
        <button
          aria-pressed={mode === "backup"}
          className={mode === "backup" ? "active" : ""}
          onClick={() => selectMode("backup")}
          type="button"
        >
          Backup code
        </button>
      </div>

      <label>
        <span>{mode === "totp" ? "6-digit code" : "Single-use backup code"}</span>
        <input
          autoComplete={mode === "totp" ? "one-time-code" : "off"}
          autoFocus
          inputMode={mode === "totp" ? "numeric" : "text"}
          name="code"
          pattern={mode === "totp" ? "[0-9 ]{6,8}" : undefined}
          required
          spellCheck={false}
          type="text"
        />
      </label>

      {error ? <p className="adminFormError" role="alert">{error}</p> : null}

      <button className="button gold" disabled={loading} type="submit">
        {loading ? "Verifying…" : "Verify and continue"}
      </button>

      <Link className="adminMfaSecondaryLink" href={`/admin/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}>
        Sign in again
      </Link>
    </form>
  );
}
