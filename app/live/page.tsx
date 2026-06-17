import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getCurrentRound } from "@/lib/rounds/getCurrentRound";
import { getCurrentSeason } from "@/lib/currentSeason";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function formatToPar(value: number) {
  if (value === 0) return "E";
  if (value > 0) return `+${value}`;
  return `${value}`;
}
function getScoreLabel(score: number, par: number | null | undefined) {
  if (!par) return `shot ${score}`;

  const diff = score - par;

  if (diff <= -3) return "made albatross";
  if (diff === -2) return "made eagle";
  if (diff === -1) return "birdied";
  if (diff === 0) return "parred";
  if (diff === 1) return "bogeyed";
  if (diff === 2) return "made double";
  if (diff === 3) return "made triple";
  if (diff === 4) return "made quadruple";

  return `${diff > 0 ? "+" : ""}${diff}`;
}
function formatMatchType(format: string | null | undefined) {
  if (!format) return "Match Play";

  return format
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => word.slice(0, 1).toUpperCase() + word.slice(1))
    .join(" ");
}
function getScoreActivityStyle(score: number, par: number | null | undefined) {
  if (!par) {
    return {
      icon: "⚪",
      className:
        "border-l-4 border-l-danvers-muted border-danvers-border bg-black/20",
    };
  }

  const diff = score - par;

if (diff < 0) {
  return {
    icon: "🟢",
    className:
      "border-l-4 border-l-danvers-green border-danvers-border bg-danvers-green/10",
  };
}

if (diff === 0) {
  return {
    icon: "⚪",
    className:
      "border-l-4 border-l-danvers-muted border-danvers-border bg-black/20",
  };
}

if (diff === 1) {
  return {
    icon: "🟠",
    className:
      "border-l-4 border-l-amber-500 border-danvers-border bg-amber-950/20",
  };
}

return {
  icon: "🔴",
  className:
    "border-l-4 border-l-red-500 border-danvers-border bg-red-950/20",
};
}
function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
function playerNames(ids: string[], players: any[]) {
  const names = ids
    .map((id) => {
      const row = players.find((player) => player.player_id === id);
      return row?.players?.full_name;
    })
    .filter(Boolean);

  return names.length ? names.join(" / ") : null;
}

function getHandicapStrokesForHole(
  handicap: number,
  holeHandicap: number | null,
  handicapPercent: number
) {
  if (!holeHandicap) return 0;

  const adjustedHandicap = Math.max(
    0,
    Math.round(handicap * (handicapPercent / 100))
  );

  const base = Math.floor(adjustedHandicap / 18);
  const remainder = adjustedHandicap % 18;

  return base + (holeHandicap <= remainder ? 1 : 0);
}

export default async function LivePage() {
  const season = await getCurrentSeason();
  const round = season ? await getCurrentRound(season.id) : null;

  if (!round) {
    return (
      <main className="min-h-screen px-4 pb-24 pt-5 text-danvers-text">
        <section className="mx-auto max-w-5xl">
          <div className="rounded-[2rem] border border-danvers-border bg-danvers-surface p-6">
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-danvers-brass">
              Live Game Center
            </p>

            <h1 className="mt-4 text-5xl font-black">Live</h1>

            <p className="mt-3 text-danvers-muted">
              No live or scheduled round found.
            </p>

            <Link
              href="/admin/rounds"
              className="mt-5 inline-flex rounded-full bg-danvers-gold px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-black"
            >
              Manage Rounds
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const { data: course } = round.course_id
    ? await supabase
        .from("courses")
        .select("name, city, state, hero_image_url")
        .eq("id", round.course_id)
        .single()
    : { data: null };

  const { data: competitions } = await supabase
    .from("competitions")
    .select("id, name, format, scoring_basis, handicap_percent, round_id, settings")
    .eq("round_id", round.id)
    .eq("is_active", true)
    .eq("is_visible", true);

  const { data: seasonCompetitions } = await supabase
    .from("competitions")
    .select("id, name")
    .eq("season_id", season?.id);

  const seasonCompetitionIds =
    seasonCompetitions?.map((competition) => competition.id) ?? [];

  const { data: officialResults } =
    seasonCompetitionIds.length > 0
      ? await supabase
          .from("competition_results")
          .select("team_id, points, competition_id, is_official")
          .in("competition_id", seasonCompetitionIds)
          .eq("is_official", true)
      : { data: [] };

  const activeCompetition = competitions?.[0];
  const handicapPercent = Number(activeCompetition?.handicap_percent ?? 100);
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
    .select("player_id, handicap, players(full_name, photo_url)")
    .eq("season_id", season?.id)
    .order("created_at", { ascending: true });

  const { data: teams } = await supabase
    .from("teams")
    .select("id, name, color, logo_url")
    .eq("season_id", season?.id);

  const teamIds = teams?.map((team) => team.id) ?? [];

  const { data: teamMembers } =
    teamIds.length > 0
      ? await supabase
          .from("team_members")
          .select("team_id, player_id")
          .in("team_id", teamIds)
      : { data: [] };

  const { data: scores } = await supabase
    .from("scores")
    .select("player_id, hole_number, gross_score, updated_at")
    .eq("round_id", round.id);

  const { data: courseHoles } = round.course_id
    ? await supabase
        .from("course_holes")
        .select("hole_number, par, yardage, handicap_number")
        .eq("course_id", round.course_id)
        .order("hole_number", { ascending: true })
    : { data: [] };

  const scoreRows = (scores as any[]) ?? [];
  const playerRows = (seasonPlayers as any[]) ?? [];
  const teamRows = (teams as any[]) ?? [];
  const teamMemberRows = (teamMembers as any[]) ?? [];
  const matchRows = (matches as any[]) ?? [];
  const matchHoleRows = (matchHoles as any[]) ?? [];
  const courseHoleRows = (courseHoles as any[]) ?? [];

  const parByHole = new Map(
    courseHoleRows.map((hole) => [hole.hole_number, Number(hole.par)])
  );

  const handicapByHole = new Map(
    courseHoleRows.map((hole) => [
      hole.hole_number,
      hole.handicap_number ? Number(hole.handicap_number) : null,
    ])
  );

  const coursePar = courseHoleRows.reduce(
    (sum, hole) => sum + Number(hole.par ?? 0),
    0
  );

  const courseYardage = courseHoleRows.reduce(
    (sum, hole) => sum + Number(hole.yardage ?? 0),
    0
  );

  const individualLeaderboard = playerRows
    .map((seasonPlayer) => {
      const playerScores = scoreRows.filter(
        (score) => score.player_id === seasonPlayer.player_id
      );

      const handicap = Number(seasonPlayer.handicap ?? 0);

      const totalGross = playerScores.reduce(
        (sum, score) => sum + Number(score.gross_score),
        0
      );

      const totalPar = playerScores.reduce(
        (sum, score) => sum + Number(parByHole.get(score.hole_number) ?? 0),
        0
      );

      const netStrokes = playerScores.reduce((sum, score) => {
        return (
          sum +
          getHandicapStrokesForHole(
            handicap,
            handicapByHole.get(score.hole_number) ?? null,
            handicapPercent
          )
        );
      }, 0);

      return {
        playerId: seasonPlayer.player_id,
        name: seasonPlayer.players?.full_name ?? "Unknown Player",
        photoUrl: seasonPlayer.players?.photo_url ?? null,
        handicap,
        holesPlayed: playerScores.length,
        totalGross,
        grossToPar: totalGross - totalPar,
        netToPar: totalGross - netStrokes - totalPar,
      };
    })
    .sort((a, b) => {
      if (a.holesPlayed === 0 && b.holesPlayed > 0) return 1;
      if (a.holesPlayed > 0 && b.holesPlayed === 0) return -1;
      return a.netToPar - b.netToPar;
    });

  const teamLeaderboard = teamRows
    .map((team) => {
      const playerIds = teamMemberRows
        .filter((member) => member.team_id === team.id)
        .map((member) => member.player_id);

      const players = individualLeaderboard.filter((player) =>
        playerIds.includes(player.playerId)
      );

      return {
        teamId: team.id,
        name: team.name,
        color: team.color,
        logoUrl: team.logo_url,
        playerCount: playerIds.length,
        scoresEntered: players.reduce(
          (sum, player) => sum + player.holesPlayed,
          0
        ),
        grossToPar: players.reduce((sum, player) => sum + player.grossToPar, 0),
        netToPar: players.reduce((sum, player) => sum + player.netToPar, 0),
      };
    })
    .sort((a, b) => {
      if (a.scoresEntered === 0 && b.scoresEntered > 0) return 1;
      if (a.scoresEntered > 0 && b.scoresEntered === 0) return -1;
      return a.netToPar - b.netToPar;
    });

  const officialTeamPointMap = new Map<string, number>();

  ((officialResults as any[]) ?? [])
    .filter((result) => result.team_id)
    .forEach((result) => {
      officialTeamPointMap.set(
        result.team_id,
        (officialTeamPointMap.get(result.team_id) ?? 0) +
          Number(result.points ?? 0)
      );
    });

  const projectedTeamRace = teamLeaderboard
    .map((team, index) => {
      const officialPoints = officialTeamPointMap.get(team.teamId) ?? 0;

      const projectedCurrentRoundPoints =
  team.scoresEntered > 0 && index === 0
    ? Number(activeCompetition?.settings?.teamWinnerPoints ?? 1)
    : 0;

      return {
        ...team,
        officialPoints,
        projectedCurrentRoundPoints,
        projectedPoints: officialPoints + projectedCurrentRoundPoints,
      };
    })
    .sort((a, b) => {
      if (b.projectedPoints !== a.projectedPoints) {
        return b.projectedPoints - a.projectedPoints;
      }

      return a.netToPar - b.netToPar;
    });

  const projectedTeamLeader = projectedTeamRace[0];

  const recentScores = [...scoreRows]
    .filter((score) => score.updated_at)
    .sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )
    .slice(0, 5);

  const expectedScores = playerRows.length * 18;
  const progressPercent =
    expectedScores > 0
      ? Math.round((scoreRows.length / expectedScores) * 100)
      : 0;

  const maxHolesPlayed = Math.max(
    0,
    ...individualLeaderboard.map((player) => player.holesPlayed)
  );

  const currentHole =
    scoreRows.length === 0 ? 1 : Math.min(18, maxHolesPlayed + 1);

  const courseName = course?.name ?? round.courses?.name ?? "Course TBD";
  const heroImageUrl = course?.hero_image_url ?? null;

  return (
    <main className="min-h-screen px-4 pb-24 pt-5 text-danvers-text">
      <section className="mx-auto max-w-5xl">
        <section className="overflow-hidden rounded-[2rem] border border-danvers-border bg-danvers-surface shadow-2xl shadow-black/40">
          <div className="flex items-center justify-between bg-danvers-green/30 px-5 py-4">
  <div>
    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-danvers-muted">
      Danvers Cup
    </p>
    <p className="text-lg font-black uppercase tracking-[0.18em]">
      Live Game Center
    </p>
  </div>

  <div className="rounded-full border border-danvers-brass bg-black/20 px-3 py-1 text-xs font-black uppercase tracking-[0.15em] text-danvers-brass">
    {round.status}
  </div>
</div>

          <div
            className="relative min-h-[210px] bg-cover bg-center"
            style={{
              backgroundImage: heroImageUrl
                ? `linear-gradient(to bottom, rgba(0,0,0,0.35), rgba(0,0,0,0.82)), url(${heroImageUrl})`
                : "linear-gradient(to bottom, rgba(20,83,45,0.6), rgba(0,0,0,0.9))",
            }}
          >
            <div className="absolute inset-x-0 bottom-0 p-5">
              <h1 className="text-2xl font-black">{courseName}</h1>

              <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-white/80">
                Round {round.round_number} · {round.round_date ?? "Date TBD"}
              </p>
            </div>
          </div>

<div className="grid grid-cols-3 border-y border-danvers-border bg-black/30">
{[
  ["Hole", currentHole],
  ["Progress", `${progressPercent}%`],
  ["Matches", matchRows.length],
].map(([label, value]) => (
    <div
      key={String(label)}
      className="border-r border-danvers-border px-3 py-4 last:border-r-0"
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-danvers-muted">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  ))}
</div>

          <div className="bg-black/30 px-5 py-4">
            <div className="h-3 overflow-hidden rounded-full bg-black/50">
              <div
                className="h-full rounded-full bg-danvers-green"
                style={{ width: `${Math.min(progressPercent, 100)}%` }}
              />
            </div>
          </div>
        </section>

<section className="mt-5 rounded-[2rem] border border-danvers-border bg-danvers-surface p-5">
  <div className="flex items-center justify-between">
    <p className="text-xs font-black uppercase tracking-[0.25em] text-danvers-brass">
      Match Play
    </p>

    <Link href="/competitions" className="text-xs font-bold text-danvers-green">
      View All
    </Link>
  </div>

  <div className="mt-4 grid gap-3">
    {matchRows.length ? (
      matchRows.map((match) => {
        const holes = matchHoleRows.filter(
          (hole) => hole.match_id === match.id
        );

        const competition = competitions?.find(
          (item) => item.id === match.competition_id
        );

        const teamAWins = holes.filter(
          (hole) => hole.winning_side === "team_a"
        ).length;

        const teamBWins = holes.filter(
          (hole) => hole.winning_side === "team_b"
        ).length;

        const margin = Math.abs(teamAWins - teamBWins);

        const status =
          holes.length === 0 || margin === 0 ? "AS" : `${margin} UP`;

        const sideAIsLeading = teamAWins > teamBWins;
        const sideBIsLeading = teamBWins > teamAWins;

        const sideAPlayers =
          playerNames(match.team_a_player_ids ?? [], playerRows) ??
          match.team_a_name ??
          "Team A";

        const sideBPlayers =
          playerNames(match.team_b_player_ids ?? [], playerRows) ??
          match.team_b_name ??
          "Team B";

        const leaderName = sideAIsLeading
          ? sideAPlayers
          : sideBIsLeading
            ? sideBPlayers
            : null;

        return (
          <Link
            key={match.id}
            href={`/matches/${match.id}`}
            className="block overflow-hidden rounded-3xl border border-danvers-border bg-black/20 transition hover:border-danvers-green"
          >
            <div className="border-b border-danvers-border bg-black/20 px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-danvers-muted">
                {formatMatchType(competition?.format)}
              </p>
            </div>

            <div className="grid grid-cols-[1fr_96px_1fr] items-center gap-3 p-4">
              <div
                className={`rounded-2xl border p-3 ${
                  sideAIsLeading
                    ? "border-danvers-gold bg-danvers-gold/10"
                    : sideBIsLeading
                      ? "border-danvers-border bg-black/10 opacity-55"
                      : "border-danvers-border bg-black/20"
                }`}
                style={{
                  borderLeftWidth: "6px",
                  borderLeftColor:
                    teamRows.find((team) => team.name === match.team_a_name)
                      ?.color ?? "#1f7a4d",
                }}
              >
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-danvers-brass">
                  {match.team_a_name ?? "Team A"}
                </p>

                <p className="mt-1 text-sm font-black leading-tight">
                  {sideAPlayers}
                </p>
              </div>

              <div className="text-center">
                {leaderName && (
                  <p className="mb-1 truncate text-[10px] font-black uppercase tracking-[0.12em] text-danvers-gold">
                    {leaderName}
                  </p>
                )}

                <p className="text-5xl font-black leading-none text-danvers-green">
                  {status}
                </p>

                <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.18em] text-danvers-muted">
                  Thru {holes.length}
                </p>
              </div>

              <div
                className={`rounded-2xl border p-3 text-right ${
                  sideBIsLeading
                    ? "border-danvers-gold bg-danvers-gold/10"
                    : sideAIsLeading
                      ? "border-danvers-border bg-black/10 opacity-55"
                      : "border-danvers-border bg-black/20"
                }`}
                style={{
                  borderRightWidth: "6px",
                  borderRightColor:
                    teamRows.find((team) => team.name === match.team_b_name)
                      ?.color ?? "#1f7a4d",
                }}
              >
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-danvers-brass">
                  {match.team_b_name ?? "Team B"}
                </p>

                <p className="mt-1 text-sm font-black leading-tight">
                  {sideBPlayers}
                </p>
              </div>
            </div>
          </Link>
        );
      })
    ) : (
      <p className="rounded-2xl border border-danvers-border bg-black/20 p-4 text-danvers-muted">
        No active matches for this round yet.
      </p>
    )}
  </div>
</section>

<section className="mt-5 rounded-[2rem] border border-danvers-border bg-danvers-surface p-5">
  <p className="text-xs font-black uppercase tracking-[0.25em] text-danvers-brass">
    Team Race
  </p>

  <div className="mt-4 rounded-3xl border border-danvers-border bg-gradient-to-br from-danvers-green/20 to-black/20 p-5">
    <p className="text-xs font-bold uppercase tracking-[0.2em] text-danvers-muted">
      If Scores Hold
    </p>

    <h2 className="mt-2 text-4xl font-black">
      {projectedTeamLeader?.name ?? "Pending"}
    </h2>

    {projectedTeamRace.length > 1 && (
      <p className="mt-2 text-lg text-danvers-muted">
        {projectedTeamRace[0].projectedPoints ===
        projectedTeamRace[1].projectedPoints
          ? `Tied with ${projectedTeamRace[1].name}`
          : `+${
              projectedTeamRace[0].projectedPoints -
              projectedTeamRace[1].projectedPoints
            } ahead of ${projectedTeamRace[1].name}`}
      </p>
    )}

    <div className="mt-5 grid gap-3">
      {projectedTeamRace.map((team, index) => {
        const maxProjectedPoints = Math.max(
          1,
          ...projectedTeamRace.map((row) => Number(row.projectedPoints ?? 0))
        );

        const barPercent = Math.max(
          6,
          Math.round((Number(team.projectedPoints ?? 0) / maxProjectedPoints) * 100)
        );

        return (
          <Link
            key={team.teamId}
            href={`/teams/${team.teamId}`}
            className="rounded-2xl border border-danvers-border bg-black/20 p-4 transition hover:border-danvers-green"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-lg font-black">{team.name}</p>
                <p className="text-xs text-danvers-muted">
                  Official {team.officialPoints} pts
                  {team.projectedCurrentRoundPoints > 0
                    ? ` · Live +${team.projectedCurrentRoundPoints}`
                    : ""}
                </p>
              </div>

              <div className="text-right">
                <p className="text-3xl font-black">{team.projectedPoints}</p>
                <p className="text-xs uppercase text-danvers-muted">
                  projected pts
                </p>
              </div>
            </div>

            <div className="mt-4 h-3 overflow-hidden rounded-full bg-black/50">
              <div
                className="h-full rounded-full bg-danvers-green"
                style={{
                  width: `${barPercent}%`,
                  backgroundColor: team.color ?? undefined,
                }}
              />
            </div>
          </Link>
        );
      })}
    </div>
  </div>
</section>

<section className="mt-5 rounded-[2rem] border border-danvers-border bg-danvers-surface p-5">
  <div className="flex items-center justify-between">
    <p className="text-xs font-black uppercase tracking-[0.25em] text-danvers-brass">
      Live Individual Scores
    </p>

    <Link
      href="/standings?tab=individual"
      className="text-xs font-bold text-danvers-green"
    >
      Official Standings
    </Link>
  </div>

  {individualLeaderboard[0]?.holesPlayed > 0 && (
    <div className="mt-4 rounded-3xl border border-danvers-border bg-gradient-to-br from-danvers-green/20 to-black/20 p-5">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-danvers-muted">
        Live Individual Leader
      </p>

      <div className="mt-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black">
            {individualLeaderboard[0].name}
          </h2>

          <p className="mt-2 text-sm text-danvers-muted">
            Through {individualLeaderboard[0].holesPlayed}
            {individualLeaderboard.length > 1 &&
              individualLeaderboard[1].holesPlayed > 0 &&
              ` · ${
                individualLeaderboard[0].netToPar ===
                individualLeaderboard[1].netToPar
                  ? `Tied with ${individualLeaderboard[1].name}`
                  : `${
                      Math.abs(
                        individualLeaderboard[0].netToPar -
                          individualLeaderboard[1].netToPar
                      )
                    } ahead of ${individualLeaderboard[1].name}`
              }`}
          </p>
        </div>

        <div className="text-right">
          <p className="text-5xl font-black text-danvers-green">
            {formatToPar(individualLeaderboard[0].netToPar)}
          </p>
          <p className="text-xs uppercase text-danvers-muted">
            Net
          </p>
        </div>
      </div>
    </div>
  )}

  <div className="mt-4 grid gap-3">
    {individualLeaderboard.slice(0, 5).map((player, index) => (
      <Link
        key={player.playerId}
        href={`/players/${player.playerId}`}
        className="flex items-center justify-between gap-4 rounded-2xl border border-danvers-border bg-black/20 p-4 transition hover:border-danvers-green"
      >
        <div className="flex items-center gap-3">
          <p className="w-5 text-center text-sm font-black text-danvers-brass">
            {index + 1}
          </p>

          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-danvers-green/20 text-sm font-black">
            {player.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={player.photoUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              getInitials(player.name)
            )}
          </div>

          <div>
            <p className="font-black">{player.name}</p>
            <p className="text-xs uppercase text-danvers-muted">
              {player.holesPlayed} holes · HCP {player.handicap}
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-2xl font-black">
            {player.holesPlayed > 0 ? formatToPar(player.netToPar) : "—"}
          </p>
          <p className="text-xs uppercase text-danvers-muted">
            Net · Gross{" "}
            {player.holesPlayed > 0 ? formatToPar(player.grossToPar) : "—"}
          </p>
        </div>
      </Link>
    ))}
  </div>
</section>

<section className="mt-5 rounded-[2rem] border border-danvers-border bg-danvers-surface p-5">
  <p className="text-xs font-black uppercase tracking-[0.25em] text-danvers-brass">
    Recent Activity
  </p>

  <div className="mt-4 grid gap-3">
    {recentScores.length ? (
      recentScores.map((score: any, index) => {
        const player = playerRows.find(
          (row) => row.player_id === score.player_id
        );

        const par = parByHole.get(score.hole_number);
        const label = getScoreLabel(Number(score.gross_score), par);
      const activityStyle = getScoreActivityStyle(Number(score.gross_score), par);

        return (
          <div
            key={`${score.player_id}-${score.hole_number}-${index}`}
            className={`rounded-2xl border p-4 ${activityStyle.className}`}
          >
            <p className="font-black">
              {activityStyle.icon} {player?.players?.full_name ?? "Unknown Player"} {label} Hole{" "}
{score.hole_number}
            </p>

            <p className="mt-1 text-sm text-danvers-muted">
              Score {score.gross_score}
              {par ? ` · Par ${par}` : ""}
            </p>
          </div>
        );
      })
    ) : (
      <p className="rounded-2xl border border-danvers-border bg-black/20 p-4 text-danvers-muted">
        No recent score activity.
      </p>
    )}
  </div>
</section>

<Link
  href="/score-entry"
  className="fixed bottom-28 right-4 z-40 rounded-full bg-danvers-gold px-5 py-4 text-sm font-black uppercase tracking-[0.16em] text-black shadow-2xl shadow-black/50 transition hover:opacity-90"
>
  ✏️ Enter Scores
</Link>
      </section>
    </main>
  );
}