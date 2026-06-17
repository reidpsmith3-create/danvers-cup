"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function FinalizeCompetitionResultsButton({
  competitionId,
}: {
  competitionId: string;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isFinalizing, setIsFinalizing] = useState(false);

  async function finalizeResults() {
    setIsFinalizing(true);
    setMessage("");

    const response = await fetch("/api/admin/results/finalize-matches", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ competitionId }),
    });

    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error ?? "Something went wrong.");
      setIsFinalizing(false);
      return;
    }

    setMessage("Match results finalized.");
    setIsFinalizing(false);
    router.refresh();
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={finalizeResults}
        disabled={isFinalizing}
        className="rounded-xl bg-danvers-green px-4 py-3 text-xs font-black text-white disabled:opacity-50"
      >
        {isFinalizing ? "Finalizing..." : "Finalize Match Results"}
      </button>

      {message ? (
        <p className="mt-2 text-xs font-bold text-danvers-muted">{message}</p>
      ) : null}
    </div>
  );
}