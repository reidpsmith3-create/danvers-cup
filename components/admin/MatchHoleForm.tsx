"use client";

import { useMemo, useState } from "react";

type MatchHole = {
  hole_number: number;
  winning_side: string;
  team_a_score: number | null;
  team_b_score: number | null;
};

function formatWinningSide(value: string) {
  if (value === "team_a") return "Team A";
  if (value === "team_b") return "Team B";
  return "Halved";
}

export default function MatchHoleForm({
  matchId,
  existingHoles,
  holeNumbers,
}: {
  matchId: string;
  existingHoles: MatchHole[];
  holeNumbers: number[];
}) {
  const [holeNumber, setHoleNumber] = useState(holeNumbers[0] ?? 1);
  const [winningSide, setWinningSide] = useState("halved");
  const [teamAScore, setTeamAScore] = useState("");
  const [teamBScore, setTeamBScore] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const existingHoleByNumber = useMemo(() => {
    return new Map(existingHoles.map((hole) => [hole.hole_number, hole]));
  }, [existingHoles]);

  function chooseHole(nextHole: number) {
    const existingHole = existingHoleByNumber.get(nextHole);

    setHoleNumber(nextHole);
    setWinningSide(existingHole?.winning_side ?? "halved");
    setTeamAScore(
      existingHole?.team_a_score === null || existingHole?.team_a_score === undefined
        ? ""
        : String(existingHole.team_a_score)
    );
    setTeamBScore(
      existingHole?.team_b_score === null || existingHole?.team_b_score === undefined
        ? ""
        : String(existingHole.team_b_score)
    );
  }

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

    const currentIndex = holeNumbers.indexOf(holeNumber);
const nextHole = holeNumbers[Math.min(currentIndex + 1, holeNumbers.length - 1)];
chooseHole(nextHole);

    setIsSaving(false);
  }

  const savedCount = existingHoles.length;

  return (
    <section className="mt-8 rounded-[2rem] border border-danvers-border bg-danvers-surface p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-danvers-brass">
            Hole Entry
          </p>
          <h2 className="mt-2 text-3xl font-black">Score Match Hole</h2>
          <p className="mt-2 text-sm text-danvers-muted">
            {savedCount} of {holeNumbers.length} holes saved.
          </p>
        </div>

        <button
          type="button"
          onClick={saveHole}
          disabled={isSaving}
          className="rounded-2xl bg-danvers-green px-5 py-4 text-sm font-black text-white disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
      </div>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
        {holeNumbers.map((hole) => {
          const isActive = hole === holeNumber;
          const isSaved = existingHoleByNumber.has(hole);

          return (
            <button
              key={hole}
              type="button"
              onClick={() => chooseHole(hole)}
              className={`flex h-11 min-w-11 items-center justify-center rounded-xl text-sm font-black ${
                isActive
                  ? "bg-danvers-green text-white"
                  : isSaved
                    ? "border border-danvers-gold bg-danvers-gold/10 text-danvers-gold"
                    : "border border-danvers-border bg-black/20 text-danvers-muted"
              }`}
            >
              {hole}
            </button>
          );
        })}
      </div>

      <div className="mt-6 grid gap-4">
        <div className="grid grid-cols-3 gap-2">
          {[
            ["team_a", "Team A"],
            ["halved", "Halved"],
            ["team_b", "Team B"],
          ].map(([value, label]) => {
            const selected = winningSide === value;

            return (
              <button
                key={value}
                type="button"
                onClick={() => setWinningSide(value)}
                className={`rounded-2xl border px-3 py-4 text-sm font-black ${
                  selected
                    ? "border-danvers-green bg-danvers-green text-white"
                    : "border-danvers-border bg-black/20 text-danvers-muted"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-bold text-danvers-muted">
              Team A Score
            </span>
            <input
              value={teamAScore}
              onChange={(event) => setTeamAScore(event.target.value)}
              inputMode="numeric"
              placeholder="Optional"
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
              placeholder="Optional"
              className="rounded-2xl border border-danvers-border bg-black/30 p-4 text-danvers-text"
            />
          </label>
        </div>

        {message ? <p className="text-sm font-bold">{message}</p> : null}
      </div>

      <div className="mt-8 grid gap-2">
        <h3 className="font-black">Saved Holes</h3>

        {existingHoles.length ? (
          existingHoles.map((hole) => (
            <button
              key={hole.hole_number}
              type="button"
              onClick={() => chooseHole(hole.hole_number)}
              className="rounded-xl border border-danvers-border bg-black/20 p-3 text-left text-sm transition hover:border-danvers-green"
            >
              <span className="font-black">Hole {hole.hole_number}</span>:{" "}
              {formatWinningSide(hole.winning_side)}
              {hole.team_a_score !== null || hole.team_b_score !== null
                ? ` (${hole.team_a_score ?? "-"} - ${hole.team_b_score ?? "-"})`
                : ""}
            </button>
          ))
        ) : (
          <p className="text-sm text-danvers-muted">No holes saved yet.</p>
        )}
      </div>
    </section>
  );
}