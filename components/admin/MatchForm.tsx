"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Competition = {
  id: string;
  name: string;
  format?: string;
};

type Team = {
  id: string;
  name: string;
};

type Player = {
  id: string;
  full_name: string;
};

type TeamMember = {
  team_id: string;
  player_id: string;
};

export default function MatchForm({
  competitions,
  teams,
  players,
  teamMembers,
}: {
  competitions: Competition[];
  teams: Team[];
  players: Player[];
  teamMembers: TeamMember[];
}) {
  const router = useRouter();

  const [competitionId, setCompetitionId] = useState(competitions[0]?.id ?? "");
  const [teamAId, setTeamAId] = useState(teams[0]?.id ?? "");
  const [teamBId, setTeamBId] = useState(teams[1]?.id ?? teams[0]?.id ?? "");
  const [teamAPlayerIds, setTeamAPlayerIds] = useState<string[]>([]);
  const [teamBPlayerIds, setTeamBPlayerIds] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const teamAName = teams.find((team) => team.id === teamAId)?.name ?? "Team A";
  const teamBName = teams.find((team) => team.id === teamBId)?.name ?? "Team B";

  const selectedCompetition = competitions.find(
    (competition) => competition.id === competitionId
  );

  const playersById = useMemo(() => {
    return new Map(players.map((player) => [player.id, player]));
  }, [players]);

  const teamAPlayers = useMemo(() => {
    return teamMembers
      .filter((member) => member.team_id === teamAId)
      .map((member) => playersById.get(member.player_id))
      .filter(Boolean) as Player[];
  }, [teamAId, teamMembers, playersById]);

  const teamBPlayers = useMemo(() => {
    return teamMembers
      .filter((member) => member.team_id === teamBId)
      .map((member) => playersById.get(member.player_id))
      .filter(Boolean) as Player[];
  }, [teamBId, teamMembers, playersById]);

  useEffect(() => {
    setTeamAPlayerIds((current) =>
      current.filter((playerId) =>
        teamAPlayers.some((player) => player.id === playerId)
      )
    );
  }, [teamAPlayers]);

  useEffect(() => {
    setTeamBPlayerIds((current) =>
      current.filter((playerId) =>
        teamBPlayers.some((player) => player.id === playerId)
      )
    );
  }, [teamBPlayers]);

  const showMatchPlayWarning =
    selectedCompetition?.format === "match" &&
    (teamAPlayerIds.length > 1 || teamBPlayerIds.length > 1);

  function togglePlayer(side: "A" | "B", playerId: string) {
    if (side === "A") {
      setTeamAPlayerIds((current) =>
        current.includes(playerId)
          ? current.filter((id) => id !== playerId)
          : [...current, playerId]
      );
    } else {
      setTeamBPlayerIds((current) =>
        current.includes(playerId)
          ? current.filter((id) => id !== playerId)
          : [...current, playerId]
      );
    }
  }

  async function saveMatch() {
    setIsSaving(true);
    setMessage("");

    if (!competitionId) {
      setMessage("Choose a competition.");
      setIsSaving(false);
      return;
    }

    if (teamAId === teamBId) {
      setMessage("Choose two different teams.");
      setIsSaving(false);
      return;
    }

    if (!teamAPlayerIds.length || !teamBPlayerIds.length) {
      setMessage("Each side needs at least one player.");
      setIsSaving(false);
      return;
    }

    const response = await fetch("/api/admin/matches", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        competitionId,
        teamAId,
        teamBId,
        teamAName,
        teamBName,
        teamAPlayerIds,
        teamBPlayerIds,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error ?? "Something went wrong.");
      setIsSaving(false);
      return;
    }

    setTeamAPlayerIds([]);
    setTeamBPlayerIds([]);
    setMessage("Match saved.");
    setIsSaving(false);
    router.refresh();
  }

  return (
    <section className="mt-8 rounded-[2rem] border border-danvers-border bg-danvers-surface p-6">
      <h2 className="text-2xl font-black">Add Match</h2>

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

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-bold text-danvers-muted">
              Side A Team
            </span>
            <select
              value={teamAId}
              onChange={(event) => setTeamAId(event.target.value)}
              className="rounded-2xl border border-danvers-border bg-black/30 p-4 text-danvers-text"
            >
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-bold text-danvers-muted">
              Side B Team
            </span>
            <select
              value={teamBId}
              onChange={(event) => setTeamBId(event.target.value)}
              className="rounded-2xl border border-danvers-border bg-black/30 p-4 text-danvers-text"
            >
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl border border-danvers-border bg-black/20 p-4">
            <h3 className="font-black">{teamAName}</h3>

            <p className="mt-1 text-sm text-danvers-muted">
              {teamAPlayers.length} rostered players
            </p>

            <div className="mt-4 grid gap-2">
              {teamAPlayers.length ? (
                teamAPlayers.map((player) => {
                  const selected = teamAPlayerIds.includes(player.id);

                  return (
                    <button
                      key={player.id}
                      type="button"
                      onClick={() => togglePlayer("A", player.id)}
                      className={`rounded-xl border px-3 py-2 text-left text-sm font-bold ${
                        selected
                          ? "border-danvers-green bg-danvers-green text-white"
                          : "border-danvers-border bg-black/20 text-danvers-muted"
                      }`}
                    >
                      {player.full_name}
                    </button>
                  );
                })
              ) : (
                <p className="rounded-xl border border-danvers-border bg-black/20 p-3 text-sm text-danvers-muted">
                  No players assigned to this team.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-danvers-border bg-black/20 p-4">
            <h3 className="font-black">{teamBName}</h3>

            <p className="mt-1 text-sm text-danvers-muted">
              {teamBPlayers.length} rostered players
            </p>

            <div className="mt-4 grid gap-2">
              {teamBPlayers.length ? (
                teamBPlayers.map((player) => {
                  const selected = teamBPlayerIds.includes(player.id);

                  return (
                    <button
                      key={player.id}
                      type="button"
                      onClick={() => togglePlayer("B", player.id)}
                      className={`rounded-xl border px-3 py-2 text-left text-sm font-bold ${
                        selected
                          ? "border-danvers-green bg-danvers-green text-white"
                          : "border-danvers-border bg-black/20 text-danvers-muted"
                      }`}
                    >
                      {player.full_name}
                    </button>
                  );
                })
              ) : (
                <p className="rounded-xl border border-danvers-border bg-black/20 p-3 text-sm text-danvers-muted">
                  No players assigned to this team.
                </p>
              )}
            </div>
          </div>
        </div>

        {showMatchPlayWarning ? (
          <div className="rounded-2xl border border-danvers-brass/40 bg-danvers-brass/10 p-4 text-sm leading-6 text-danvers-muted">
            This match play competition has multiple players on at least one
            side. The app will score each hole using the best score from each
            side. For true singles match play, select one player per side.
          </div>
        ) : null}

        <button
          type="button"
          onClick={saveMatch}
          disabled={isSaving || competitions.length === 0 || teams.length < 2}
          className="rounded-2xl bg-danvers-green px-5 py-4 text-sm font-black text-white disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save Match"}
        </button>

        {message ? <p className="text-sm font-bold">{message}</p> : null}
      </div>
    </section>
  );
}