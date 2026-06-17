import Link from "next/link";
import { supabase } from "@/lib/supabase";

type PlayerPageProps = {
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

function getSingleRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function formatPoints(points: number) {
  return Number.isInteger(points) ? String(points) : points.toFixed(1);
}

function getMatchRecord(playerId: string, matches: any[]) {
  let wins = 0;
  let losses = 0;
  let ties = 0;

  matches.forEach((match) => {
    const isSideA = (match.team_a_player_ids ?? []).includes(playerId);
    const isSideB = (match.team_b_player_ids ?? []).includes(playerId);

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

  return { wins, losses, ties, label: `${wins}-${losses}-${ties}` };
}

function getWinPercentage(record: { wins: number; losses: number; ties: number }) {
  const total = record.wins + record.losses + record.ties;
  if (!total) return "—";

  return `${(((record.wins + record.ties * 0.5) / total) * 100).toFixed(1)}%`;
}

function getPlayerMatchHistory(playerId: string, matches: any[], players: any[]) {
  return matches
    .filter((match) => {
      const isSideA = (match.team_a_player_ids ?? []).includes(playerId);
      const isSideB = (match.team_b_player_ids ?? []).includes(playerId);
      return isSideA || isSideB;
    })
    .map((match) => {
      const isSideA = (match.team_a_player_ids ?? []).includes(playerId);
      const opponentIds = isSideA
        ? match.team_b_player_ids ?? []
        : match.team_a_player_ids ?? [];

      const opponentNames = opponentIds
        .map((id: string) => players.find((player) => player.id === id)?.full_name)
        .filter(Boolean)
        .join(" / ");

      let result = "T";

      if (match.winning_side === "halved") result = "T";
      else if (
        (isSideA && match.winning_side === "team_a") ||
        (!isSideA && match.winning_side === "team_b")
      ) {
        result = "W";
      } else {
        result = "L";
      }

      const competition = getSingleRelation(match.competitions);
      const round = getSingleRelation(competition?.rounds);
      const season = getSingleRelation(round?.seasons);

      return {
        id: match.id,
        result,
        opponentIds,
        opponentNames: opponentNames || "Unknown Opponent",
        finalResult: match.final_result ?? "Final",
        matchType: match.match_type ?? "match",
        competitionName: competition?.name ?? "Competition",
        roundName: round?.name ?? "Round",
        year: season?.year ?? null,
        roundDate: round?.round_date ?? null,
      };
    })
    .sort((a, b) => {
      if (b.year !== a.year) return Number(b.year ?? 0) - Number(a.year ?? 0);
      return String(b.roundDate ?? "").localeCompare(String(a.roundDate ?? ""));
    });
}

function buildHeadToHead(playerId: string, matches: any[], players: any[]) {
  const opponentMap = new Map<
    string,
    {
      opponentId: string;
      opponentName: string;
      wins: number;
      losses: number;
      ties: number;
    }
  >();

  matches.forEach((match) => {
    const isSideA = (match.team_a_player_ids ?? []).includes(playerId);
    const isSideB = (match.team_b_player_ids ?? []).includes(playerId);

    if (!isSideA && !isSideB) return;

    const opponentIds = isSideA
      ? match.team_b_player_ids ?? []
      : match.team_a_player_ids ?? [];

    opponentIds.forEach((opponentId: string) => {
      const opponent = players.find((player) => player.id === opponentId);

      if (!opponentMap.has(opponentId)) {
        opponentMap.set(opponentId, {
          opponentId,
          opponentName: opponent?.full_name ?? "Unknown Opponent",
          wins: 0,
          losses: 0,
          ties: 0,
        });
      }

      const record = opponentMap.get(opponentId);
      if (!record) return;

      if (match.winning_side === "halved") {
        record.ties += 1;
      } else if (
        (isSideA && match.winning_side === "team_a") ||
        (isSideB && match.winning_side === "team_b")
      ) {
        record.wins += 1;
      } else {
        record.losses += 1;
      }
    });
  });

  return Array.from(opponentMap.values()).sort((a, b) => {
    const totalB = b.wins + b.losses + b.ties;
    const totalA = a.wins + a.losses + a.ties;

    if (totalB !== totalA) return totalB - totalA;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return a.losses - b.losses;
  });
}

function getLongestUnbeatenStreak(matchHistory: any[]) {
  let current = 0;
  let best = 0;

  [...matchHistory]
    .reverse()
    .forEach((match) => {
      if (match.result === "W" || match.result === "T") {
        current += 1;
        best = Math.max(best, current);
      } else {
        current = 0;
      }
    });

  return best;
}

export default async function PlayerPage({ params }: PlayerPageProps) {
  const { data: player } = await supabase
    .from("players")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!player) {
    return (
      <main className="min-h-screen px-5 pb-24 pt-6 text-danvers-text">
        <section className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-black">Player not found</h1>
          <Link href="/players" className="mt-4 block text-danvers-muted">
            Back to players
          </Link>
        </section>
      </main>
    );
  }

  const { data: seasonPlayers } = await supabase
    .from("season_players")
    .select("handicap, seasons(id, year, name, location, status)")
    .eq("player_id", params.id);

  const { data: teamMemberships } = await supabase
    .from("team_members")
    .select("teams(id, name, color, season_id)")
    .eq("player_id", params.id);

  const { data: competitionResults } = await supabase
    .from("competition_results")
    .select("points, result_label, competitions(season_id, name, is_visible)")
    .eq("player_id", params.id)
    .eq("is_official", true);

  const { data: officialMatches } = await supabase
    .from("matches")
    .select(
      "id, team_a_player_ids, team_b_player_ids, team_a_name, team_b_name, match_type, winning_side, final_result, is_official, competitions(name, is_visible, rounds(name, round_date, seasons(year)))"
    )
    .eq("is_official", true);

  const { data: allPlayers } = await supabase
    .from("players")
    .select("id, full_name");

  const { data: seasonResults } = await supabase
    .from("season_results")
    .select(
      "season_id, individual_champion_player_id, team_champion_id, seasons(year)"
    );

  const seasonRows =
    seasonPlayers?.map((row: any) => ({
      handicap: row.handicap,
      season: getSingleRelation(row.seasons),
    })) ?? [];

  const memberships =
    teamMemberships
      ?.map((membership: any) => getSingleRelation(membership.teams))
      .filter(Boolean) ?? [];

  const results = ((competitionResults as any[]) ?? []).filter((result) => {
    const competition = getSingleRelation(result.competitions);
    return competition?.is_visible !== false;
  });

  const finalSeasonResults = (seasonResults as any[]) ?? [];

  const careerPoints = results.reduce(
    (total, result) => total + Number(result.points ?? 0),
    0
  );

  const seasonsPlayed = seasonRows.filter((row) => row.season).length;

  const individualTitles = finalSeasonResults.filter(
    (result) => result.individual_champion_player_id === player.id
  ).length;

  const teamTitleSeasonIds = new Set(
    finalSeasonResults
      .filter((result) =>
        memberships.some(
          (membership: any) =>
            membership?.season_id === result.season_id &&
            membership?.id === result.team_champion_id
        )
      )
      .map((result) => result.season_id)
  );

  const seasonHistory = seasonRows
    .filter((row) => row.season)
    .map((row) => {
      const season = row.season;
      const membership = memberships.find(
        (item: any) => item?.season_id === season.id
      );

      const seasonPoints = results
        .filter((result) => {
          const competition = getSingleRelation(result.competitions);
          return competition?.season_id === season.id;
        })
        .reduce((total, result) => total + Number(result.points ?? 0), 0);

      const wonIndividual = finalSeasonResults.some(
        (result) =>
          result.season_id === season.id &&
          result.individual_champion_player_id === player.id
      );

      const wonTeam = finalSeasonResults.some(
        (result) =>
          result.season_id === season.id &&
          result.team_champion_id === membership?.id
      );

      return {
        season,
        handicap: row.handicap,
        team: membership,
        points: seasonPoints,
        wonIndividual,
        wonTeam,
      };
    })
    .sort((a: any, b: any) => b.season.year - a.season.year);

  const latestEntry = seasonHistory[0] ?? null;
  const latestMembership = latestEntry?.team ?? null;
  const teamColor = latestMembership?.color || "#1f7a4d";

  const visibleOfficialMatches = ((officialMatches as any[]) ?? []).filter(
    (match) => {
      const competition = getSingleRelation(match.competitions);
      return competition?.is_visible !== false;
    }
  );

  const allPlayerRows = (allPlayers as any[]) ?? [];
  const matchHistory = getPlayerMatchHistory(
    player.id,
    visibleOfficialMatches,
    allPlayerRows
  );

  const singlesMatches = visibleOfficialMatches.filter((match) => {
    const isPlayerInMatch =
      (match.team_a_player_ids ?? []).includes(player.id) ||
      (match.team_b_player_ids ?? []).includes(player.id);

    const isSingles =
      match.match_type === "singles" ||
      ((match.team_a_player_ids?.length ?? 0) === 1 &&
        (match.team_b_player_ids?.length ?? 0) === 1);

    return isPlayerInMatch && isSingles;
  });

  const teamMatches = visibleOfficialMatches.filter((match) => {
    const isPlayerInMatch =
      (match.team_a_player_ids ?? []).includes(player.id) ||
      (match.team_b_player_ids ?? []).includes(player.id);

    const isSingles =
      match.match_type === "singles" ||
      ((match.team_a_player_ids?.length ?? 0) === 1 &&
        (match.team_b_player_ids?.length ?? 0) === 1);

    return isPlayerInMatch && !isSingles;
  });

  const careerRecord = getMatchRecord(player.id, visibleOfficialMatches);
  const singlesRecord = getMatchRecord(player.id, singlesMatches);
  const teamMatchRecord = getMatchRecord(player.id, teamMatches);
  const longestUnbeatenStreak = getLongestUnbeatenStreak(matchHistory);
  const headToHeadRecords = buildHeadToHead(
    player.id,
    visibleOfficialMatches,
    allPlayerRows
  );

  const bestSeason = seasonHistory
    .filter((entry: any) => entry.season.status === "complete")
    .sort((a: any, b: any) => b.points - a.points)[0];

  const bestCompetition = results
    .map((result) => {
      const competition = getSingleRelation(result.competitions);

      return {
        name: competition?.name ?? "Competition",
        points: Number(result.points ?? 0),
      };
    })
    .sort((a, b) => b.points - a.points)[0];

  return (
    <main className="min-h-screen px-5 pb-24 pt-6 text-danvers-text">
      <section className="mx-auto max-w-5xl">
        <Link
          href="/players"
          className="text-xs font-black uppercase tracking-[0.18em] text-danvers-gold"
        >
          ← Back to Field
        </Link>

        <section className="mt-5 overflow-hidden rounded-[2rem] border border-danvers-green/40 bg-gradient-to-br from-danvers-surface via-danvers-background to-black shadow-2xl shadow-black/50">
          <div
            className="h-2"
            style={{
              background: `linear-gradient(90deg, ${teamColor}, #d8b15a, ${teamColor})`,
            }}
          />

          <div className="p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div
                className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-[2rem] border text-4xl font-black text-danvers-gold"
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
                <p className="text-sm font-black uppercase tracking-[0.45em] text-danvers-gold">
                  Player Career
                </p>

                <h1 className="mt-3 text-5xl font-extrabold leading-none tracking-tight">
                  {player.full_name}
                </h1>

                <p className="mt-3 text-sm font-semibold uppercase tracking-[0.22em] text-white/70">
                  {latestMembership?.name ?? "Team TBD"}
                </p>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ["Appearances", String(seasonsPlayed)],
                ["Match Record", careerRecord.label],
                ["Singles Record", singlesRecord.label],
                ["Career Points", formatPoints(careerPoints)],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-white/10 bg-black/30 p-4 text-center"
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-danvers-muted">
                    {label}
                  </p>
                  <p className="mt-2 text-2xl font-black text-danvers-gold">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-[2rem] border border-white/10 bg-danvers-surface/80 p-6">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-danvers-gold">
              Cup Résumé
            </p>

            <div className="mt-5 space-y-3">
              {[
                [
                  "Current Status",
                  latestEntry?.season?.status === "complete"
                    ? "Alumni"
                    : "Active",
                ],
                ["Latest Team", latestMembership?.name ?? "Team TBD"],
                ["Career Match Record", careerRecord.label],
                ["Career Points", formatPoints(careerPoints)],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/25 px-4 py-3"
                >
                  <p className="text-sm font-semibold text-danvers-muted">
                    {label}
                  </p>
                  <p className="text-sm font-black text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-danvers-surface/80 p-6">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-danvers-gold">
              Bio
            </p>

            <p className="mt-4 leading-7 text-danvers-muted">
              {player.bio ??
                "Career history, player notes, photos, and Danvers Cup records coming soon."}
            </p>
          </div>
        </section>
        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-[2rem] border border-white/10 bg-danvers-surface/80 p-6">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-danvers-gold">
              Player Records
            </p>

            <div className="mt-5 space-y-3">
              {[
                ["Win Percentage", getWinPercentage(careerRecord)],
                ["Team Match Record", teamMatchRecord.label],
                ["Longest Unbeaten Streak", String(longestUnbeatenStreak)],
                [
                  "Best Season",
                  bestSeason
                    ? `${formatPoints(bestSeason.points)} pts (${bestSeason.season.year})`
                    : "—",
                ],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/25 px-4 py-3"
                >
                  <p className="text-sm font-semibold text-danvers-muted">
                    {label}
                  </p>
                  <p className="text-right text-sm font-black text-white">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-danvers-surface/80 p-6">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-danvers-gold">
              Head-to-Head
            </p>

            <div className="mt-5 grid gap-3">
              {headToHeadRecords.length ? (
                headToHeadRecords.map((record) => (
                  <Link
                    key={record.opponentId}
                    href={`/players/${record.opponentId}`}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/25 px-4 py-3 transition hover:border-danvers-gold"
                  >
                    <p className="text-sm font-black">
                      vs {record.opponentName}
                    </p>
                    <p className="text-sm font-black text-danvers-gold">
                      {record.wins}-{record.losses}-{record.ties}
                    </p>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-danvers-muted">
                  No head-to-head records yet.
                </p>
              )}
            </div>
          </div>
        </section>
        <section className="mt-6 rounded-[2rem] border border-white/10 bg-danvers-surface/80 p-6">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-danvers-gold">
            Season History
          </p>

          <div className="mt-5 grid gap-3">
            {seasonHistory.length ? (
              seasonHistory.map((entry: any) => (
                <Link
                  key={entry.season.id}
                  href={`/history/${entry.season.year}`}
                  className="rounded-2xl border border-white/10 bg-black/25 p-4 transition hover:border-danvers-gold"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-2xl font-black">
                        {entry.season.year}
                      </p>
                      <p className="mt-1 text-sm text-danvers-muted">
                        {entry.team?.name ?? "Team TBD"} ·{" "}
                        {formatPoints(entry.points)} pts
                      </p>
                    </div>

                    <p className="text-right text-xs font-bold uppercase tracking-[0.18em] text-danvers-gold">
                      {entry.wonIndividual
                        ? "Individual Champion"
                        : entry.wonTeam
                          ? "Team Champion"
                          : entry.season.status === "complete"
                            ? "Participant"
                            : "Active Participant"}
                    </p>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-sm text-danvers-muted">
                No season history yet.
              </p>
            )}
          </div>
        </section>

        <section className="mt-6 rounded-[2rem] border border-white/10 bg-danvers-surface/80 p-6">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-danvers-gold">
            Match History
          </p>

          <div className="mt-5 grid gap-3">
            {matchHistory.length ? (
              matchHistory.map((match) => (
                <div
                  key={match.id}
                  className="rounded-2xl border border-white/10 bg-black/25 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-black">
                        {match.result} vs {match.opponentNames}
                      </p>

                      <p className="mt-1 text-sm text-danvers-muted">
                        {match.year ?? "Season"} · {match.competitionName}
                      </p>

                      <p className="mt-1 text-xs text-danvers-muted">
                        {match.finalResult}
                      </p>
                    </div>

                    <p className="text-xs font-black uppercase tracking-[0.18em] text-danvers-gold">
                      {match.matchType}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-danvers-muted">
                No official match history yet.
              </p>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}