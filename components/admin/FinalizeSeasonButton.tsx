"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function FinalizeSeasonButton({
  seasonId,
}: {
  seasonId: string;
}) {
  const router = useRouter();
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [message, setMessage] = useState("");

  async function finalizeSeason() {
    const confirmed = window.confirm(
      "Finalize this season? This will lock in the team champion and individual champion based on current official standings."
    );

    if (!confirmed) return;

    setIsFinalizing(true);
    setMessage("");

    const response = await fetch("/api/admin/seasons/finalize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ seasonId }),
    });

    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error ?? "Something went wrong.");
      setIsFinalizing(false);
      return;
    }

    setMessage("Season finalized.");
    setIsFinalizing(false);
    router.refresh();
  }

  return (
    <div className="rounded-[2rem] border border-danvers-border bg-danvers-surface p-6">
      <h2 className="text-2xl font-black">Finalize Season</h2>

      <p className="mt-3 text-sm leading-6 text-danvers-muted">
        Lock in the team champion and individual champion based on current
        official standings.
      </p>

      <button
        type="button"
        onClick={finalizeSeason}
        disabled={isFinalizing}
        className="mt-5 rounded-2xl border border-red-500/40 px-5 py-3 text-sm font-black text-red-300 disabled:opacity-50"
      >
        {isFinalizing ? "Finalizing..." : "Finalize Season"}
      </button>

      {message ? <p className="mt-3 text-sm font-bold">{message}</p> : null}
    </div>
  );
}