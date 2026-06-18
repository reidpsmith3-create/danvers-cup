import Link from "next/link";
import { supabase } from "@/lib/supabase";

type TeamPageProps = {
  params: {
    id: string;
  };
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part: string) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatPoints(points: number) {
  return Number.isInteger(points) ? String(points) : points.toFixed(1);
}

function getSingleRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function getMatchRecord(teamId: string, matches: any[]) {
  let wins = 0;
  let losses = 0;
  let ties = 0;

  matches.forEach((match) => {
    const isSideA = match.team_a_id === teamId;
    const isSideB = match.team_b_id === teamId;

    if (!isSideA && !isSideB) return;

    if (match.winning_side === "halved") {
      ties += 1;
      return;
    }

    if (
      (isSideA && match.winning_side === "team_a") ||
      (isSideB && match.winning_side === "team_b")
    ) {
      wins += 1;
      return;
    }

    losses += 1;
  });

  return `${wins}-${losses}-${ties}`;
}

export default async function TeamPage({ params }: TeamPageProps) {
  const { data: team } = await supabase
    .from("teams")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!team) {
    return (
      <main className="min-h-screen px-5 pb-24 pt-6 text-danvers-text">
        <section className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-black">Team not found</h1>
          <Link href="/teams" className="mt-4 block text-danvers-muted">
            Back to teams
          </Link>
        </section>
      </main>
    );
  }

  const { data: members } = await supabase
    .from("team_members")
    .select("player_id")
    .eq("team_id", params.id);

  const playerIds = members?.map((member) => member.player_id) ?? [];

  const { data: players } =
    playerIds.length > 0
      ? await supabase
          .from("players")
          .select("id, full_name, photo_url, bio")
          .in("id", playerIds)
      : { data: [] };

  const { data: seasonPlayers } =
    playerIds.length > 0
      ? await supabase
          .from("season_players")
          .select("player_id, handicap")
          .eq("season_id", team.season_id)
          .in("player_id", playerIds)
      : { data: [] };

  const { data: competitionResults } = await supabase
    .from("competition_results")
    .select("id, team_id, player_id, points, result_label, competitions(season_id, is_visible)")
    .eq("is_official", true);

  const { data: matches } = await supabase
    .from("matches")
    .select(
  "id, team_a_id, team_b_id, team_a_name, team_b_name, team_a_player_ids, team_b_player_ids, winning_side, final_result, is_official, competitions(season_id, is_visible)"
)
    .eq("is_official", true);

  const { data: otherTeams } = await supabase
    .from("teams")
    .select("id, name, color, logo_url")
    .eq("season_id", team.season_id)
    .neq("id", team.id)
    .order("name", { ascending: true });

  const handicapByPlayerId = new Map(
    seasonPlayers?.map((row) => [row.player_id, row.handicap]) ?? []
  );

  const playerRows = (players as any[]) ?? [];
  const visibleSeasonResults = ((competitionResults as any[]) ?? []).filter(
    (result) => {
      const competition = getSingleRelation(result.competitions);
      return (
        competition?.season_id === team.season_id &&
        competition?.is_visible !== false
      );
    }
  );

  const visibleSeasonMatches = ((matches as any[]) ?? []).filter((match) => {
    const competition = getSingleRelation(match.competitions);
    return (
      competition?.season_id === team.season_id &&
      competition?.is_visible !== false
    );
  });

  const teamPoints = visibleSeasonResults
    .filter((result) => result.team_id === team.id)
    .reduce((total, result) => total + Number(result.points ?? 0), 0);

  const playerPointRows = playerRows
    .map((player) => {
      const points = visibleSeasonResults
        .filter((result) => result.player_id === player.id)
        .reduce((total, result) => total + Number(result.points ?? 0), 0);

    const matchWins = visibleSeasonMatches.filter((match) => {
  const isPlayerSideA = (match.team_a_player_ids ?? []).includes(player.id);
  const isPlayerSideB = (match.team_b_player_ids ?? []).includes(player.id);

  if (!isPlayerSideA && !isPlayerSideB) return false;

  return (
    (isPlayerSideA && match.winning_side === "team_a") ||
    (isPlayerSideB && match.winning_side === "team_b")
  );
}).length;

      return {
        ...player,
        points,
        matchWins,
      };
    })
    .sort((a, b) => b.points - a.points);

  const topPointPlayer = playerPointRows[0] ?? null;
  const topMatchPlayer = [...playerPointRows].sort(
    (a, b) => b.matchWins - a.matchWins
  )[0];

const teamRecord = getMatchRecord(team.id, visibleSeasonMatches);

const totalHandicap = playerRows.reduce((total, player) => {
  const handicap = handicapByPlayerId.get(player.id);
  return total + Number(handicap ?? 0);
}, 0);

const teamColor = team.color || "#1f7a4d";
  const opponent = ((otherTeams as any[]) ?? [])[0];

  const headToHeadMatches = opponent
    ? visibleSeasonMatches.filter((match) => {
        const hasTeam =
          match.team_a_id === team.id || match.team_b_id === team.id;
        const hasOpponent =
          match.team_a_id === opponent.id || match.team_b_id === opponent.id;

        return hasTeam && hasOpponent;
      })
    : [];

  const headToHeadRecord = opponent
    ? getMatchRecord(team.id, headToHeadMatches)
    : "—";

  return (
    <main className="min-h-screen px-5 pb-24 pt-6 text-danvers-text">
      <section className="mx-auto max-w-5xl">
        <Link
          href="/teams"
          className="text-xs font-black uppercase tracking-[0.18em] text-danvers-gold"
        >
          ← Back to Teams
        </Link>

        <section className="mt-5 overflow-hidden rounded-[2rem] border border-danvers-green/40 bg-gradient-to-br from-danvers-surface via-danvers-background to-black shadow-2xl shadow-black/50">
          <div
            className="h-2"
            style={{
              background: `linear-gradient(90deg, ${teamColor}, #d8b15a, ${teamColor})`,
            }}
          />

          <div className="relative p-6">
            <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-danvers-green/20 blur-3xl" />
            <div className="absolute -bottom-24 left-6 h-64 w-64 rounded-full bg-danvers-gold/10 blur-3xl" />

            <div className="relative">
              <div className="flex items-center justify-between gap-5">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.45em] text-danvers-gold">
                    Season Team
                  </p>

                  <h1 className="mt-3 text-5xl font-extrabold leading-none tracking-tight">
                    {team.name}
                  </h1>

                  <p className="mt-3 text-sm font-semibold uppercase tracking-[0.22em] text-white/70">
                    Myrtle Beach Roster
                  </p>
                </div>

                <div
                  className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[2rem] border text-3xl font-black text-danvers-gold shadow-xl shadow-black/30"
                  style={{
                    borderColor: teamColor,
                    backgroundColor: `${teamColor}33`,
                  }}
                >
                  {team.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={team.logo_url}
                      alt={team.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    team.name.slice(0, 2).toUpperCase()
                  )}
                </div>
              </div>

              <div className="mt-8 grid grid-cols-4 gap-3">
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-danvers-muted">
                    Players
                  </p>
                  <p className="mt-2 text-2xl font-black text-danvers-gold">
                    {playerRows.length}
                  </p>
                </div>
<div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-center">
  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-danvers-muted">
    HCP
  </p>
  <p className="mt-2 text-2xl font-black text-danvers-gold">
    {totalHandicap.toFixed(1)}
  </p>
</div>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-danvers-muted">
                    Points
                  </p>
                  <p className="mt-2 text-2xl font-black text-danvers-gold">
                    {formatPoints(teamPoints)}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-danvers-muted">
                    Record
                  </p>
                  <p className="mt-2 text-2xl font-black text-danvers-gold">
                    {teamRecord}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          <section className="rounded-[2rem] border border-white/10 bg-danvers-surface p-6">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-danvers-gold">
              Team Leaders
            </p>

            <h2 className="mt-2 text-3xl font-black">This Season</h2>

            <div className="mt-5 grid gap-3">
              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-danvers-muted">
                  Points Leader
                </p>
                <p className="mt-2 text-xl font-black">
                  {topPointPlayer?.full_name ?? "TBD"}
                </p>
                <p className="mt-1 text-sm text-danvers-gold">
                  {formatPoints(topPointPlayer?.points ?? 0)} pts
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-danvers-muted">
                  Match Wins Leader
                </p>
                <p className="mt-2 text-xl font-black">
                  {topMatchPlayer?.full_name ?? "TBD"}
                </p>
                <p className="mt-1 text-sm text-danvers-gold">
                  {topMatchPlayer?.matchWins ?? 0} win(s)
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-danvers-surface p-6">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-danvers-gold">
              Head-to-Head
            </p>

            <h2 className="mt-2 text-3xl font-black">
              {opponent ? `${team.name} vs ${opponent.name}` : "Matchup"}
            </h2>

            <div className="mt-5 rounded-2xl border border-white/10 bg-black/25 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-danvers-muted">
                Season Record
              </p>
              <p className="mt-2 text-3xl font-black text-danvers-gold">
                {headToHeadRecord}
              </p>
              <p className="mt-2 text-sm text-danvers-muted">
                Based on official visible matches for this season only.
              </p>
            </div>
          </section>
        </section>

        <section className="mt-8">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-danvers-gold">
                Roster
              </p>
              <h2 className="mt-2 text-3xl font-black">Team Members</h2>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {playerPointRows.map((player) => (
              <Link
                key={player.id}
                href={`/players/${player.id}`}
                className="group rounded-[2rem] border border-white/10 bg-gradient-to-br from-danvers-surface to-black/50 p-5 shadow-xl shadow-black/20 transition hover:border-danvers-gold/60"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-3xl border text-2xl font-black text-danvers-gold"
                    style={{
                      borderColor: teamColor,
                      backgroundColor: `${teamColor}33`,
                    }}
                  >
                    {player.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={player.photo_url}
                        alt={player.full_name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      getInitials(player.full_name)
                    )}
                  </div>

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-danvers-gold">
                      Player
                    </p>
                    <h3 className="mt-2 text-2xl font-black">
                      {player.full_name}
                    </h3>
                    <p className="mt-1 text-sm text-danvers-muted">
                      Handicap: {handicapByPlayerId.get(player.id) ?? "TBD"}
                    </p>
                    <p className="mt-1 text-sm text-danvers-muted">
                      {formatPoints(player.points)} pts · {player.matchWins} match win(s)
                    </p>
                  </div>
                </div>

                <p className="mt-5 line-clamp-2 text-sm leading-6 text-danvers-muted">
                  {player.bio ??
                    "Player profile, Danvers Cup history, and career stats coming soon."}
                </p>

                <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-danvers-gold">
                  View Profile →
                </p>
              </Link>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}