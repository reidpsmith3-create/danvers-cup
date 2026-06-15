import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getCurrentRound } from "@/lib/rounds/getCurrentRound";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getMatchStatus(holes: any[]) {
  const teamAWins = holes.filter((hole) => hole.winning_side === "team_a").length;
  const teamBWins = holes.filter((hole) => hole.winning_side === "team_b").length;
  const margin = Math.abs(teamAWins - teamBWins);

  if (margin === 0) return "All Square";

  return teamAWins > teamBWins
    ? `Team A ${margin} Up`
    : `Team B ${margin} Up`;
}

export default async function LivePage() {
  const { data: season } = await supabase
    .from("seasons")
    .select("*")
    .eq("year", 2026)
    .single();

  const round = season ? await getCurrentRound(season.id) : null;

  const { data: competitions } = await supabase
    .from("competitions")
    .select("id, name, format, round_id")
    .eq("round_id", round?.id);

  const competitionIds = competitions?.map((competition) => competition.id) ?? [];

  const { data: matches } =
    competitionIds.length > 0
      ? await supabase
          .from("matches")
          .select("*")
          .in("competition_id", competitionIds)
      : { data: [] };

  const matchIds = matches?.map((match) => match.id) ?? [];

  const { data: matchHoles } =
    matchIds.length > 0
      ? await supabase.from("match_holes").select("*").in("match_id", matchIds)
      : { data: [] };

  const { data: seasonPlayers } = await supabase
    .from("season_players")
    .select("player_id, handicap, players(full_name)")
    .eq("season_id", season?.id)
    .order("created_at", { ascending: true });

  const { data: teams } = await supabase
    .from("teams")
    .select("id, name, color")
    .eq("season_id", season?.id);

  const { data: teamMembers } = await supabase
    .from("team_members")
    .select("team_id, player_id");

  const { data: scores } = round
    ? await supabase
        .from("scores")
        .select("player_id, gross_score")
        .eq("round_id", round.id)
    : { data: [] };

  const scoreRows = (scores as any[]) ?? [];
  const playerRows = (seasonPlayers as any[]) ?? [];
  const teamRows = (teams as any[]) ?? [];
  const teamMemberRows = (teamMembers as any[]) ?? [];
  const matchRows = (matches as any[]) ?? [];
  const matchHoleRows = (matchHoles as any[]) ?? [];

  const individualLeaderboard = playerRows
    .map((seasonPlayer) => {
      const playerScores = scoreRows.filter(
        (score) => score.player_id === seasonPlayer.player_id
      );

      return {
        playerId: seasonPlayer.player_id,
        name: seasonPlayer.players?.full_name ?? "Unknown Player",
        holesPlayed: playerScores.length,
        totalGross: playerScores.reduce(
          (sum, score) => sum + score.gross_score,
          0
        ),
      };
    })
    .sort((a, b) => {
      if (a.holesPlayed === 0 && b.holesPlayed > 0) return 1;
      if (a.holesPlayed > 0 && b.holesPlayed === 0) return -1;
      return a.totalGross - b.totalGross;
    });

  const teamLeaderboard = teamRows
    .map((team) => {
      const playerIds = teamMemberRows
        .filter((member) => member.team_id === team.id)
        .map((member) => member.player_id);

      const teamScores = scoreRows.filter((score) =>
        playerIds.includes(score.player_id)
      );

      return {
        teamId: team.id,
        name: team.name,
        players: playerIds.length,
        scoresEntered: teamScores.length,
        totalGross: teamScores.reduce(
          (sum, score) => sum + score.gross_score,
          0
        ),
      };
    })
    .sort((a, b) => {
      if (a.scoresEntered === 0 && b.scoresEntered > 0) return 1;
      if (a.scoresEntered > 0 && b.scoresEntered === 0) return -1;
      return a.totalGross - b.totalGross;
    });

  const currentHole =
    Math.max(1, ...individualLeaderboard.map((player) => player.holesPlayed)) +
    1;

  return (
    <main className="min-h-screen px-5 pb-24 pt-6 text-danvers-text">
      <section className="mx-auto max-w-6xl">
        <div className="rounded-[2rem] border border-danvers-border bg-danvers-surface p-6">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-danvers-brass">
            Game Center
          </p>

          <h1 className="mt-4 text-5xl font-black">Live</h1>

          <p className="mt-3 text-danvers-muted">
            {round?.name ?? "Round 1"} · {round?.courses?.name ?? "Course TBD"}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-danvers-border bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-danvers-muted">
                Current Hole
              </p>
              <p className="mt-2 text-4xl font-black">
                {Math.min(currentHole, 18)}
              </p>
            </div>

            <div className="rounded-2xl border border-danvers-border bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-danvers-muted">
                Scores Entered
              </p>
              <p className="mt-2 text-4xl font-black">{scoreRows.length}</p>
            </div>

            <div className="rounded-2xl border border-danvers-border bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-danvers-muted">
                Active Matches
              </p>
              <p className="mt-2 text-4xl font-black">{matchRows.length}</p>
            </div>
          </div>
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          {teamLeaderboard.map((team, index) => (
            <Link
              key={team.teamId}
              href={`/teams/${team.teamId}`}
              className="rounded-3xl border border-danvers-border bg-danvers-surface p-5 transition hover:border-danvers-green"
            >
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-danvers-brass">
                Team Leaderboard
              </p>

              <div className="mt-4 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-black">{team.name}</h2>
                  <p className="mt-1 text-sm text-danvers-muted">
                    {team.players} players · {team.scoresEntered} scores
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm text-danvers-muted">#{index + 1}</p>
                  <p className="text-3xl font-black">
                    {team.scoresEntered > 0 ? team.totalGross : "—"}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </section>

        <section className="mt-8 rounded-[2rem] border border-danvers-border bg-danvers-surface p-5">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-danvers-brass">
            Matches
          </p>
          <h2 className="mt-2 text-3xl font-black">Current Round</h2>

          <div className="mt-5 grid gap-3">
            {matchRows.length ? (
              matchRows.map((match) => {
                const holes = matchHoleRows.filter(
                  (hole) => hole.match_id === match.id
                );

                return (
                  <div
                    key={match.id}
                    className="rounded-2xl border border-danvers-border bg-black/20 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-black">
                          {match.team_a_name} vs {match.team_b_name}
                        </p>
                        <p className="mt-1 text-sm text-danvers-muted">
                          {holes.length} holes scored
                        </p>
                      </div>

                      <p className="text-right text-sm font-black">
                        {getMatchStatus(holes)}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="rounded-2xl border border-danvers-border bg-black/20 p-4 text-danvers-muted">
                No active matches for this round yet.
              </p>
            )}
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-danvers-border bg-danvers-surface p-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-danvers-brass">
                Individual Leaderboard
              </p>
              <h2 className="mt-2 text-3xl font-black">Current Round</h2>
            </div>

            <Link
              href="/standings?tab=individual"
              className="text-sm font-bold text-danvers-muted"
            >
              Full Standings
            </Link>
          </div>

          <div className="mt-5 grid gap-3">
            {individualLeaderboard.map((player, index) => (
              <Link
                key={player.playerId}
                href={`/players/${player.playerId}`}
                className="rounded-2xl border border-danvers-border bg-black/20 p-4 transition hover:border-danvers-green"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-danvers-green/20 font-black">
                      {index + 1}
                    </div>

                    <div>
                      <p className="font-black">{player.name}</p>
                      <p className="text-xs text-danvers-muted">
                        {player.holesPlayed} holes
                      </p>
                    </div>
                  </div>

                  <p className="text-2xl font-black">
                    {player.holesPlayed > 0 ? player.totalGross : "—"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <Link
          href="/score-entry"
          className="mt-8 block rounded-[2rem] border border-danvers-border bg-danvers-green p-6 text-white transition hover:opacity-90"
        >
          <p className="text-xs font-bold uppercase tracking-[0.3em]">
            Score Entry
          </p>

          <h2 className="mt-3 text-3xl font-black">Open Scorecard</h2>

          <p className="mt-2 text-white/80">
            Enter hole-by-hole gross scores for the current round.
          </p>
        </Link>
      </section>
    </main>
  );
}