"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Round = {
  id: string;
  round_number: number;
  name: string;
};

export default function CompetitionForm({
  seasonId,
  rounds,
}: {
  seasonId: string;
  rounds: Round[];
}) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [roundId, setRoundId] = useState(rounds[0]?.id ?? "");
  const [format, setFormat] = useState("match");
  const [scoringBasis, setScoringBasis] = useState("gross");
  const [handicapPercent, setHandicapPercent] = useState("100");
  const [countsForTeamPoints, setCountsForTeamPoints] = useState(true);
  const [countsForIndividualPoints, setCountsForIndividualPoints] =
    useState(true);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function saveCompetition() {
    setIsSaving(true);
    setMessage("");

    const response = await fetch("/api/admin/competitions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        seasonId,
        roundId,
        name,
        format,
        scoringBasis,
        handicapPercent,
        countsForTeamPoints,
        countsForIndividualPoints,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error ?? "Something went wrong.");
      setIsSaving(false);
      return;
    }

    setName("");
    setMessage("Competition saved.");
    setIsSaving(false);
    router.refresh();
  }

  return (
    <section className="mt-8 rounded-[2rem] border border-danvers-border bg-danvers-surface p-6">
      <h2 className="text-2xl font-black">Add Competition</h2>

      <div className="mt-6 grid gap-4">
        <label className="grid gap-2">
          <span className="text-sm font-bold text-danvers-muted">Name</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Round 1 Best Ball"
            className="rounded-2xl border border-danvers-border bg-black/30 p-4 text-danvers-text"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-bold text-danvers-muted">Round</span>
          <select
            value={roundId}
            onChange={(event) => setRoundId(event.target.value)}
            className="rounded-2xl border border-danvers-border bg-black/30 p-4 text-danvers-text"
          >
            {rounds.map((round) => (
              <option key={round.id} value={round.id}>
                Round {round.round_number} — {round.name}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-bold text-danvers-muted">Format</span>
          <select
            value={format}
            onChange={(event) => setFormat(event.target.value)}
            className="rounded-2xl border border-danvers-border bg-black/30 p-4 text-danvers-text"
          >
            <option value="match">Match Play</option>
            <option value="stroke">Stroke Play</option>
            <option value="stableford">Stableford</option>
            <option value="best_ball">Best Ball</option>
            <option value="wolf">Wolf</option>
            <option value="skins">Skins</option>
            <option value="custom">Custom</option>
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-bold text-danvers-muted">
            Scoring Basis
          </span>
          <select
            value={scoringBasis}
            onChange={(event) => setScoringBasis(event.target.value)}
            className="rounded-2xl border border-danvers-border bg-black/30 p-4 text-danvers-text"
          >
            <option value="gross">Gross</option>
            <option value="net">Net</option>
            <option value="both">Both</option>
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-bold text-danvers-muted">
            Handicap %
          </span>
          <input
            value={handicapPercent}
            onChange={(event) => setHandicapPercent(event.target.value)}
            inputMode="decimal"
            className="rounded-2xl border border-danvers-border bg-black/30 p-4 text-danvers-text"
          />
        </label>

        <label className="flex items-center gap-3 text-sm font-bold">
          <input
            type="checkbox"
            checked={countsForTeamPoints}
            onChange={(event) => setCountsForTeamPoints(event.target.checked)}
          />
          Counts for team points
        </label>

        <label className="flex items-center gap-3 text-sm font-bold">
          <input
            type="checkbox"
            checked={countsForIndividualPoints}
            onChange={(event) =>
              setCountsForIndividualPoints(event.target.checked)
            }
          />
          Counts for individual points
        </label>

        <button
          type="button"
          onClick={saveCompetition}
          disabled={isSaving}
          className="rounded-2xl bg-danvers-green px-5 py-4 text-sm font-black text-white disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save Competition"}
        </button>

        {message ? <p className="text-sm font-bold">{message}</p> : null}
      </div>
    </section>
  );
}