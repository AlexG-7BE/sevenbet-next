"use client";

import { useState } from "react";

import { authClient } from "@/lib/auth/client";

export function AdminLogoutButton() {
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);

    try {
      await authClient.signOut();
      await fetch("/api/admin/logout", {
        method: "POST",
        credentials: "same-origin",
      });
    } finally {
      window.location.assign("/admin/login");
    }
  }

  return (
    <button
      aria-label="Sign out of SevenBet CMS"
      className="adminLogout"
      disabled={loading}
      onClick={logout}
      type="button"
    >
      {loading ? "Signing out..." : "Sign out"}
    </button>
  );
}
