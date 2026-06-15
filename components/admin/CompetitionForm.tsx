"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  COMPETITION_SCORING_RULES,
  getCompetitionScoringRule,
} from "@/lib/scoring/competitionScoring";

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

  const [pointsForFirst, setPointsForFirst] = useState("5");
  const [pointsForSecond, setPointsForSecond] = useState("3");
  const [pointsForThird, setPointsForThird] = useState("2");
  const [pointsForFourth, setPointsForFourth] = useState("1");

  const [winPoints, setWinPoints] = useState("2");
  const [tiePoints, setTiePoints] = useState("1");

  const [teamScoringMethod, setTeamScoringMethod] = useState("best_2_total");

  const [countsForTeamPoints, setCountsForTeamPoints] = useState(true);
  const [countsForIndividualPoints, setCountsForIndividualPoints] =
    useState(true);

  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const scoringRule = getCompetitionScoringRule(format);

  async function saveCompetition() {
    setIsSaving(true);
    setMessage("");

    if (countsForTeamPoints && !scoringRule.supportsTeamPoints) {
      setMessage("This format does not support team points.");
      setIsSaving(false);
      return;
    }

    if (countsForIndividualPoints && !scoringRule.supportsIndividualPoints) {
      setMessage("This format does not support individual points.");
      setIsSaving(false);
      return;
    }

    if (!name.trim()) {
      setMessage("Competition name is required.");
      setIsSaving(false);
      return;
    }

    const response = await fetch("/api/admin/competitions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        seasonId,
        roundId,
        name: name.trim(),
        format,
        scoringBasis,
        handicapPercent,
        countsForTeamPoints,
        countsForIndividualPoints,
        settings: {
          pointsForFirst: Number(pointsForFirst),
          pointsForSecond: Number(pointsForSecond),
          pointsForThird: Number(pointsForThird),
          pointsForFourth: Number(pointsForFourth),
          winPoints: Number(winPoints),
          tiePoints: Number(tiePoints),
          teamScoringMethod,
        },
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
            {COMPETITION_SCORING_RULES.map((rule) => (
  <option key={rule.format} value={rule.format}>
    {rule.label}
  </option>
))}
          </select>
        </label>

        <div className="rounded-2xl border border-danvers-border bg-black/20 p-4">
          <p className="text-sm font-black">{scoringRule.label}</p>
          <p className="mt-2 text-sm leading-6 text-danvers-muted">
            {scoringRule.description}
          </p>

          <div className="mt-3 grid gap-2 text-xs font-bold text-danvers-muted sm:grid-cols-2">
            <p>Uses matches: {scoringRule.usesMatches ? "Yes" : "No"}</p>
            <p>Uses scores: {scoringRule.usesRawScores ? "Yes" : "No"}</p>
            <p>Team points: {scoringRule.supportsTeamPoints ? "Yes" : "No"}</p>
<p>
  Individual points:{" "}
  {scoringRule.supportsIndividualPoints ? "Yes" : "No"}
</p>
<p>Calculator: {scoringRule.hasCalculator ? "Yes" : "Manual"}</p>
          </div>
        </div>

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

        <div className="grid gap-4 sm:grid-cols-4">
          <label className="grid gap-2">
            <span className="text-sm font-bold text-danvers-muted">
              1st Place
            </span>
            <input
              value={pointsForFirst}
              onChange={(event) => setPointsForFirst(event.target.value)}
              className="rounded-2xl border border-danvers-border bg-black/30 p-4 text-danvers-text"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-bold text-danvers-muted">
              2nd Place
            </span>
            <input
              value={pointsForSecond}
              onChange={(event) => setPointsForSecond(event.target.value)}
              className="rounded-2xl border border-danvers-border bg-black/30 p-4 text-danvers-text"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-bold text-danvers-muted">
              3rd Place
            </span>
            <input
              value={pointsForThird}
              onChange={(event) => setPointsForThird(event.target.value)}
              className="rounded-2xl border border-danvers-border bg-black/30 p-4 text-danvers-text"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-bold text-danvers-muted">
              4th Place
            </span>
            <input
              value={pointsForFourth}
              onChange={(event) => setPointsForFourth(event.target.value)}
              className="rounded-2xl border border-danvers-border bg-black/30 p-4 text-danvers-text"
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-bold text-danvers-muted">
              Match Win Points
            </span>
            <input
              value={winPoints}
              onChange={(event) => setWinPoints(event.target.value)}
              className="rounded-2xl border border-danvers-border bg-black/30 p-4 text-danvers-text"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-bold text-danvers-muted">
              Match Tie Points
            </span>
            <input
              value={tiePoints}
              onChange={(event) => setTiePoints(event.target.value)}
              className="rounded-2xl border border-danvers-border bg-black/30 p-4 text-danvers-text"
            />
          </label>
        </div>

        <label className="grid gap-2">
          <span className="text-sm font-bold text-danvers-muted">
            Team Scoring Method
          </span>
          <select
            value={teamScoringMethod}
            onChange={(event) => setTeamScoringMethod(event.target.value)}
            className="rounded-2xl border border-danvers-border bg-black/30 p-4 text-danvers-text"
          >
            <option value="best_1_total">Best 1 player total</option>
            <option value="best_2_total">Best 2 player totals</option>
            <option value="best_3_total">Best 3 player totals</option>
            <option value="all_players_total">All player totals</option>
          </select>
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