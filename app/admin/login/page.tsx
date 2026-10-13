"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Unable to log in.");
        return;
      }

      setPassword("");
      router.replace("/admin");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-5 pb-24 text-danvers-text">
      <section className="w-full max-w-md">
        <div className="overflow-hidden rounded-[2rem] border border-danvers-green/40 bg-gradient-to-br from-danvers-surface via-danvers-background to-black shadow-2xl shadow-black/50">
          <div className="h-2 bg-gradient-to-r from-danvers-green via-danvers-gold to-danvers-green" />

          <div className="p-8">
            <p className="text-center text-xs font-black uppercase tracking-[0.4em] text-danvers-gold">
              The Danvers Cup
            </p>

            <h1 className="mt-5 text-center text-4xl font-black">
              Admin Login
            </h1>

            <p className="mt-3 text-center text-sm leading-6 text-danvers-muted">
              Enter the administrator password to access the
              Danvers Cup management dashboard.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label
                  htmlFor="admin-password"
                  className="block text-xs font-black uppercase tracking-[0.2em] text-danvers-gold"
                >
                  Admin Password
                </label>

                <input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                  className="mt-3 w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-4 text-white outline-none transition focus:border-danvers-gold"
                  placeholder="Enter password"
                />
              </div>

              {error && (
                <p
                  role="alert"
                  className="rounded-xl border border-red-400/30 bg-red-950/30 px-4 py-3 text-sm text-red-200"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-danvers-green px-5 py-4 text-sm font-black uppercase tracking-[0.2em] text-white transition hover:bg-danvers-green/80 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Signing In..." : "Sign In"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
