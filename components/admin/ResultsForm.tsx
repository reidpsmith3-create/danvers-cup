"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Competition = {
  id: string;
  name: string;
  counts_for_team_points?: boolean | null;
  counts_for_individual_points?: boolean | null;
};

type Team = {
  id: string;
  name: string;
};

type Player = {
  id: string;
  full_name: string;
};

export default function ResultsForm({
  competitions,
  teams,
  players,
}: {
  competitions: Competition[];
  teams: Team[];
  players: Player[];
}) {
  const router = useRouter();

  const [competitionId, setCompetitionId] = useState(competitions[0]?.id ?? "");
  const [resultType, setResultType] = useState<"team" | "player">("team");
  const [teamId, setTeamId] = useState(teams[0]?.id ?? "");
  const [playerId, setPlayerId] = useState(players[0]?.id ?? "");
  const [points, setPoints] = useState("1");
  const [resultLabel, setResultLabel] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const selectedCompetition = competitions.find(
    (competition) => competition.id === competitionId
  );

  const canSaveTeamResult = Boolean(selectedCompetition?.counts_for_team_points);
  const canSavePlayerResult = Boolean(
    selectedCompetition?.counts_for_individual_points
  );

  async function saveResult() {
    setIsSaving(true);
    setMessage("");

    if (!competitionId) {
      setMessage("Choose a competition.");
      setIsSaving(false);
      return;
    }

    if (resultType === "team" && !teamId) {
      setMessage("Choose a team.");
      setIsSaving(false);
      return;
    }

    if (resultType === "player" && !playerId) {
      setMessage("Choose a player.");
      setIsSaving(false);
      return;
    }

    if (resultType === "team" && !canSaveTeamResult) {
      setMessage("This competition does not count for team points.");
      setIsSaving(false);
      return;
    }

    if (resultType === "player" && !canSavePlayerResult) {
      setMessage("This competition does not count for individual points.");
      setIsSaving(false);
      return;
    }

    if (!Number.isFinite(Number(points))) {
      setMessage("Points must be a valid number.");
      setIsSaving(false);
      return;
    }

    const response = await fetch("/api/admin/results", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        competitionId,
        teamId: resultType === "team" ? teamId : null,
        playerId: resultType === "player" ? playerId : null,
        points,
        resultLabel,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error ?? "Something went wrong.");
      setIsSaving(false);
      return;
    }

    setMessage(`Official result saved: ${points} point(s).`);
    setPoints("1");
    setResultLabel("");
    setIsSaving(false);
    router.refresh();
  }

  return (
    <section className="mt-8 rounded-[2rem] border border-danvers-border bg-danvers-surface p-6">
      <h2 className="text-2xl font-black">Add Official Result</h2>

      <div className="mt-6 grid gap-4">
        <label className="grid gap-2">
          <span className="text-sm font-bold text-danvers-muted">
            Competition
          </span>
          <select
            value={competitionId}
            onChange={(event) => setCompetitionId(event.target.value)}
            className="rounded-2xl border border-danvers-border bg-black/30 p-4 text-danvers-text"
          >
            {competitions.map((competition) => (
              <option key={competition.id} value={competition.id}>
                {competition.name}
              </option>
            ))}
          </select>
        </label>

        {selectedCompetition ? (
          <div className="rounded-2xl border border-danvers-border bg-black/20 p-4 text-sm leading-6 text-danvers-muted">
            <p>
              Team points:{" "}
              {selectedCompetition.counts_for_team_points ? "Yes" : "No"}
            </p>
            <p>
              Individual points:{" "}
              {selectedCompetition.counts_for_individual_points ? "Yes" : "No"}
            </p>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-2 rounded-2xl border border-danvers-border bg-black/20 p-1">
          <button
            type="button"
            onClick={() => setResultType("team")}
            disabled={!canSaveTeamResult}
            className={`rounded-xl px-4 py-3 text-sm font-black disabled:opacity-40 ${
              resultType === "team"
                ? "bg-danvers-green text-white"
                : "text-danvers-muted"
            }`}
          >
            Team Result
          </button>

          <button
            type="button"
            onClick={() => setResultType("player")}
            disabled={!canSavePlayerResult}
            className={`rounded-xl px-4 py-3 text-sm font-black disabled:opacity-40 ${
              resultType === "player"
                ? "bg-danvers-green text-white"
                : "text-danvers-muted"
            }`}
          >
            Player Result
          </button>
        </div>

        {resultType === "team" ? (
          <label className="grid gap-2">
            <span className="text-sm font-bold text-danvers-muted">Team</span>
            <select
              value={teamId}
              onChange={(event) => setTeamId(event.target.value)}
              className="rounded-2xl border border-danvers-border bg-black/30 p-4 text-danvers-text"
            >
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label className="grid gap-2">
            <span className="text-sm font-bold text-danvers-muted">Player</span>
            <select
              value={playerId}
              onChange={(event) => setPlayerId(event.target.value)}
              className="rounded-2xl border border-danvers-border bg-black/30 p-4 text-danvers-text"
            >
              {players.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.full_name}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="grid gap-2">
          <span className="text-sm font-bold text-danvers-muted">Points</span>
          <input
            value={points}
            onChange={(event) => setPoints(event.target.value)}
            inputMode="decimal"
            className="rounded-2xl border border-danvers-border bg-black/30 p-4 text-danvers-text"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-bold text-danvers-muted">
            Result Label
          </span>
          <input
            value={resultLabel}
            onChange={(event) => setResultLabel(event.target.value)}
            placeholder="Example: Won Round 1 Match"
            className="rounded-2xl border border-danvers-border bg-black/30 p-4 text-danvers-text"
          />
        </label>

        <button
          type="button"
          onClick={saveResult}
          disabled={isSaving || competitions.length === 0}
          className="rounded-2xl bg-danvers-green px-5 py-4 text-sm font-black text-white disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save Official Result"}
        </button>

        {message ? <p className="text-sm font-bold">{message}</p> : null}
      </div>
    </section>
  );
}