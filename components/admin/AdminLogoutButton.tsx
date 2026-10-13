"use client";

import { useState } from "react";

export default function AdminLogoutButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogout() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/admin/logout", {
        method: "POST",
        credentials: "same-origin",
      });

      if (!response.ok) {
        throw new Error("Unable to log out.");
      }

      window.location.replace("/admin/login");
    } catch {
      setError("Logout failed. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleLogout}
        disabled={loading}
        className="shrink-0 rounded-xl border border-danvers-gold/40 bg-black/20 px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-danvers-gold transition hover:border-danvers-gold hover:bg-white/5 disabled:opacity-50"
      >
        {loading ? "Logging Out..." : "Log Out"}
      </button>

      {error && (
        <p role="alert" className="text-xs text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
