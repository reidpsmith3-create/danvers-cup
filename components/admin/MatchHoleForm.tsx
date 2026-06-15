"use client";

import { useState } from "react";

type MatchHole = {
  hole_number: number;
  winning_side: string;
  team_a_score: number | null;
  team_b_score: number | null;
};

export default function MatchHoleForm({
  matchId,
  existingHoles,
}: {
  matchId: string;
  existingHoles: MatchHole[];
}) {
  const [holeNumber, setHoleNumber] = useState(1);
  const [winningSide, setWinningSide] = useState("halved");
  const [teamAScore, setTeamAScore] = useState("");
  const [teamBScore, setTeamBScore] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function saveHole() {
    setIsSaving(true);
    setMessage("");

    const response = await fetch("/api/admin/match-holes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        matchId,
        holeNumber,
        winningSide,
        teamAScore,
        teamBScore,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error ?? "Something went wrong.");
      setIsSaving(false);
      return;
    }

    setMessage(`Hole ${holeNumber} saved.`);
    setHoleNumber((current) => Math.min(18, current + 1));
    setWinningSide("halved");
    setTeamAScore("");
    setTeamBScore("");
    setIsSaving(false);
  }

  return (
    <section className="mt-8 rounded-[2rem] border border-danvers-border bg-danvers-surface p-6">
      <h2 className="text-2xl font-black">Score Match Hole</h2>

      <div className="mt-6 grid gap-4">
        <label className="grid gap-2">
          <span className="text-sm font-bold text-danvers-muted">Hole</span>
          <select
            value={holeNumber}
            onChange={(event) => setHoleNumber(Number(event.target.value))}
            className="rounded-2xl border border-danvers-border bg-black/30 p-4 text-danvers-text"
          >
            {Array.from({ length: 18 }).map((_, index) => (
              <option key={index + 1} value={index + 1}>
                Hole {index + 1}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-bold text-danvers-muted">
            Winning Side
          </span>
          <select
            value={winningSide}
            onChange={(event) => setWinningSide(event.target.value)}
            className="rounded-2xl border border-danvers-border bg-black/30 p-4 text-danvers-text"
          >
            <option value="team_a">Team A won hole</option>
            <option value="team_b">Team B won hole</option>
            <option value="halved">Halved</option>
          </select>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-bold text-danvers-muted">
              Team A Score
            </span>
            <input
              value={teamAScore}
              onChange={(event) => setTeamAScore(event.target.value)}
              inputMode="numeric"
              className="rounded-2xl border border-danvers-border bg-black/30 p-4 text-danvers-text"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-bold text-danvers-muted">
              Team B Score
            </span>
            <input
              value={teamBScore}
              onChange={(event) => setTeamBScore(event.target.value)}
              inputMode="numeric"
              className="rounded-2xl border border-danvers-border bg-black/30 p-4 text-danvers-text"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={saveHole}
          disabled={isSaving}
          className="rounded-2xl bg-danvers-green px-5 py-4 text-sm font-black text-white disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save Hole Result"}
        </button>

        {message ? <p className="text-sm font-bold">{message}</p> : null}
      </div>

      <div className="mt-8 grid gap-2">
        <h3 className="font-black">Saved Holes</h3>

        {existingHoles.length ? (
          existingHoles.map((hole) => (
            <div
              key={hole.hole_number}
              className="rounded-xl border border-danvers-border bg-black/20 p-3 text-sm"
            >
              Hole {hole.hole_number}: {hole.winning_side}
              {hole.team_a_score !== null || hole.team_b_score !== null
                ? ` (${hole.team_a_score ?? "-"} - ${hole.team_b_score ?? "-"})`
                : ""}
            </div>
          ))
        ) : (
          <p className="text-sm text-danvers-muted">No holes saved yet.</p>
        )}
      </div>
    </section>
  );
}