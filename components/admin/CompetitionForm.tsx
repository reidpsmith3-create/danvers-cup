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

type Competition = {
  id: string;
  season_id: string;
  round_id: string | null;
  name: string;
  format: string;
  scoring_basis: string;
  handicap_percent: number | null;
  counts_for_individual_points: boolean | null;
  counts_for_team_points: boolean | null;
  is_active: boolean | null;
  is_visible: boolean | null;
  settings: {
    pointsForFirst?: number;
    pointsForSecond?: number;
    pointsForThird?: number;
    pointsForFourth?: number;
    winPoints?: number;
    tiePoints?: number;
    teamScoringMethod?: string;
holeCount?: number;
nineType?: string | null;
  } | null;
};

export default function CompetitionForm({
  seasonId,
  rounds,
  competition,
}: {
  seasonId: string;
  rounds: Round[];
  competition?: Competition;
}) {
  const router = useRouter();

  const settings = competition?.settings ?? {};

  const [name, setName] = useState(competition?.name ?? "");
  const [roundId, setRoundId] = useState(
    competition?.round_id ?? rounds[0]?.id ?? ""
  );
  const [format, setFormat] = useState(competition?.format ?? "match");
  const [scoringBasis, setScoringBasis] = useState(
    competition?.scoring_basis ?? "gross"
  );
  const [handicapPercent, setHandicapPercent] = useState(
    String(competition?.handicap_percent ?? "100")
  );

  const [pointsForFirst, setPointsForFirst] = useState(
    String(settings.pointsForFirst ?? "5")
  );
  const [pointsForSecond, setPointsForSecond] = useState(
    String(settings.pointsForSecond ?? "3")
  );
  const [pointsForThird, setPointsForThird] = useState(
    String(settings.pointsForThird ?? "2")
  );
  const [pointsForFourth, setPointsForFourth] = useState(
    String(settings.pointsForFourth ?? "1")
  );

  const [winPoints, setWinPoints] = useState(
    String(settings.winPoints ?? "2")
  );
  const [tiePoints, setTiePoints] = useState(
    String(settings.tiePoints ?? "1")
  );

  const [teamScoringMethod, setTeamScoringMethod] = useState(
    settings.teamScoringMethod ?? "best_2_total"
  );
const [holeCount, setHoleCount] = useState(
  String(settings.holeCount ?? "18")
);

const [nineType, setNineType] = useState(
  settings.nineType ?? "front"
);
  const [countsForTeamPoints, setCountsForTeamPoints] = useState(
    competition?.counts_for_team_points ?? true
  );
  const [countsForIndividualPoints, setCountsForIndividualPoints] = useState(
    competition?.counts_for_individual_points ?? true
  );
  const [isActive, setIsActive] = useState(competition?.is_active ?? true);
  const [isVisible, setIsVisible] = useState(competition?.is_visible ?? true);

  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const scoringRule = getCompetitionScoringRule(format);
  const isEditing = Boolean(competition?.id);

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

    const response = await fetch("/api/admin/competitions/save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        competitionId: competition?.id ?? null,
        seasonId,
        roundId,
        name: name.trim(),
        format,
        scoringBasis,
        handicapPercent,
        countsForTeamPoints,
        countsForIndividualPoints,
        isActive,
        isVisible,
        settings: {
          pointsForFirst: Number(pointsForFirst),
          pointsForSecond: Number(pointsForSecond),
          pointsForThird: Number(pointsForThird),
          pointsForFourth: Number(pointsForFourth),
          winPoints: Number(winPoints),
          tiePoints: Number(tiePoints),
          teamScoringMethod,
holeCount: Number(holeCount),
nineType: holeCount === "9" ? nineType : null,
        },
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error ?? "Something went wrong.");
      setIsSaving(false);
      return;
    }

    setMessage("Competition saved.");
    setIsSaving(false);

    if (!isEditing) {
      setName("");
    }

    router.refresh();
  }

  return (
    <section className="mt-8 rounded-[2rem] border border-danvers-border bg-danvers-surface p-6">
      <h2 className="text-2xl font-black">
        {isEditing ? "Edit Competition" : "Add Competition"}
      </h2>

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
<div className="grid gap-4 sm:grid-cols-2">
  <label className="grid gap-2">
    <span className="text-sm font-bold text-danvers-muted">
      Holes
    </span>
    <select
      value={holeCount}
      onChange={(event) => setHoleCount(event.target.value)}
      className="rounded-2xl border border-danvers-border bg-black/30 p-4 text-danvers-text"
    >
      <option value="18">18 holes</option>
      <option value="9">9 holes</option>
    </select>
  </label>

  {holeCount === "9" ? (
    <label className="grid gap-2">
      <span className="text-sm font-bold text-danvers-muted">
        Nine
      </span>
      <select
        value={nineType}
        onChange={(event) => setNineType(event.target.value)}
        className="rounded-2xl border border-danvers-border bg-black/30 p-4 text-danvers-text"
      >
        <option value="front">Front 9</option>
        <option value="back">Back 9</option>
      </select>
    </label>
  ) : null}
</div>
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

        <label className="flex items-center gap-3 text-sm font-bold">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(event) => setIsActive(event.target.checked)}
          />
          Active
        </label>

        <label className="flex items-center gap-3 text-sm font-bold">
          <input
            type="checkbox"
            checked={isVisible}
            onChange={(event) => setIsVisible(event.target.checked)}
          />
          Visible
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