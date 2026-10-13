"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ScorekeeperLogin() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/scorekeeper/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error ?? "Unable to verify PIN.");
        return;
      }

      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto mt-8 max-w-md rounded-[2rem] border border-danvers-border bg-danvers-surface p-6 sm:p-8">
      <div className="text-center">
        <div className="text-4xl">🔒</div>
        <h2 className="mt-4 text-2xl font-black text-danvers-text">
          Scorekeeper Access
        </h2>
        <p className="mt-3 text-sm text-danvers-muted">
          Enter the shared Danvers Cup PIN to record and update scores.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label
            htmlFor="scorekeeper-pin"
            className="block text-xs font-bold uppercase tracking-widest text-danvers-muted"
          >
            Trip PIN
          </label>

          <input
            id="scorekeeper-pin"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            pattern="[0-9]*"
            value={pin}
            onChange={(event) => setPin(event.target.value)}
            placeholder="Enter PIN"
            required
            minLength={6}
            className="mt-2 w-full rounded-xl border border-danvers-border bg-black/20 px-4 py-4 text-center text-xl font-bold tracking-[0.3em] text-danvers-text outline-none focus:border-danvers-gold"
          />
        </div>

        {error && (
          <p role="alert" className="text-center text-sm text-red-400">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-danvers-gold px-5 py-4 text-sm font-black uppercase tracking-widest text-black disabled:opacity-50"
        >
          {loading ? "Verifying..." : "Unlock Score Entry"}
        </button>
      </form>
    </div>
  );
}
