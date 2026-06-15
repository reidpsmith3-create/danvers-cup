"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CalculateBestBallButton({
  competitionId,
}: {
  competitionId: string;
}) {
  const router = useRouter();
  const [isCalculating, setIsCalculating] = useState(false);
  const [message, setMessage] = useState("");

  async function calculate() {
    setIsCalculating(true);
    setMessage("");

    const response = await fetch("/api/admin/competitions/calculate-best-ball", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ competitionId }),
    });

    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error ?? "Something went wrong.");
      setIsCalculating(false);
      return;
    }

    setMessage("Best ball holes calculated. Now run Calculate Match Results.");
    setIsCalculating(false);
    router.refresh();
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={calculate}
        disabled={isCalculating}
        className="rounded-xl bg-danvers-green px-3 py-2 text-xs font-black text-white disabled:opacity-50"
      >
        {isCalculating ? "Calculating..." : "Calculate Best Ball"}
      </button>

      {message ? (
        <p className="mt-2 text-xs font-bold text-danvers-muted">{message}</p>
      ) : null}
    </div>
  );
}