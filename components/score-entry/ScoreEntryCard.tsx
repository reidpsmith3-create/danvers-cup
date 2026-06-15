"use client";

import { useState } from "react";

type ScoreEntryCardProps = {
  playerId: string;
  playerName: string;
};

export default function ScoreEntryCard({
  playerName,
}: ScoreEntryCardProps) {
  const [score, setScore] = useState(4);

  return (
    <div className="rounded-3xl border border-danvers-border bg-danvers-surface p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black">{playerName}</h2>
          <p className="mt-1 text-sm text-danvers-muted">Gross score</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setScore((current) => Math.max(1, current - 1))}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-danvers-border text-xl font-black"
          >
            −
          </button>

          <div className="flex h-12 w-14 items-center justify-center rounded-2xl bg-black/30 text-2xl font-black">
            {score}
          </div>

          <button
            type="button"
            onClick={() => setScore((current) => current + 1)}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-danvers-border text-xl font-black"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}