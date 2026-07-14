"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { authClient } from "@/lib/auth/client";
import { getAdminLoginErrorMessage } from "@/lib/auth/policy";

export function AdminLoginForm({ callbackUrl }: { callbackUrl: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const password = String(form.get("password") ?? "");

    try {
      const result = await authClient.signIn.email({
        email,
        password,
      });

      if (result.error) {
        setError(getAdminLoginErrorMessage());
        return;
      }

      router.replace(callbackUrl);
      router.refresh();
    } catch {
      setError(getAdminLoginErrorMessage());
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="adminLoginForm" onSubmit={handleSubmit}>
      <label>
        <span>Email</span>
        <input
          autoComplete="email"
          inputMode="email"
          name="email"
          required
          type="email"
        />
      </label>

      <label>
        <span>Password</span>
        <input
          autoComplete="current-password"
          name="password"
          required
          type="password"
        />
      </label>

      {error ? (
        <p className="adminFormError" role="alert">
          {error}
        </p>
      ) : null}

      <button className="button gold" disabled={loading} type="submit">
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
