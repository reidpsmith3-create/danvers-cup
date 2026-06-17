import Link from "next/link";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RecordRow = {
  id: string;
  name: string;
  value: string | number;
  href?: string;
};

function formatPoints(points: number) {
  return Number.isInteger(points) ? String(points) : points.toFixed(1);
}

function getSingleRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function getWinPercentage(record: {
  wins: number;
  losses: number;
  ties: number;
}) {
  const total = record.wins + record.losses + record.ties;
  if (!total) return 0;

  return ((record.wins + record.ties * 0.5) / total) * 100;
}

function buildMatchRecords(matches: any[]) {
  const records = new Map<
    string,
    {
      playerId: string;
      name: string;
      wins: number;
      losses: number;
      ties: number;
      singlesWins: number;
      unbeatenStreak: number;
    }
  >();

  function ensurePlayer(player: any) {
    if (!player?.id) return null;

    if (!records.has(player.id)) {
      records.set(player.id, {
        playerId: player.id,
        name: player.full_name ?? "Unknown Player",
        wins: 0,
        losses: 0,
        ties: 0,
        singlesWins: 0,
        unbeatenStreak: 0,
      });
    }

    return records.get(player.id) ?? null;
  }

  const matchesByPlayer = new Map<string, string[]>();

  matches.forEach((match) => {
    const sideAPlayers = match.team_a_players ?? [];
    const sideBPlayers = match.team_b_players ?? [];

    const isSingles =
      match.match_type === "singles" ||
      (sideAPlayers.length === 1 && sideBPlayers.length === 1);

    sideAPlayers.forEach((player: any) => {
      const record = ensurePlayer(player);
      if (!record) return;

      let result = "L";

      if (match.winning_side === "halved") {
        record.ties += 1;
        result = "T";
      } else if (match.winning_side === "team_a") {
        record.wins += 1;
        result = "W";
        if (isSingles) record.singlesWins += 1;
      } else if (match.winning_side === "team_b") {
        record.losses += 1;
        result = "L";
      }

      if (!matchesByPlayer.has(player.id)) matchesByPlayer.set(player.id, []);
      matchesByPlayer.get(player.id)?.push(result);
    });

    sideBPlayers.forEach((player: any) => {
      const record = ensurePlayer(player);
      if (!record) return;

      let result = "L";

      if (match.winning_side === "halved") {
        record.ties += 1;
        result = "T";
      } else if (match.winning_side === "team_b") {
        record.wins += 1;
        result = "W";
        if (isSingles) record.singlesWins += 1;
      } else if (match.winning_side === "team_a") {
        record.losses += 1;
        result = "L";
      }

      if (!matchesByPlayer.has(player.id)) matchesByPlayer.set(player.id, []);
      matchesByPlayer.get(player.id)?.push(result);
    });
  });

  records.forEach((record) => {
    const results = matchesByPlayer.get(record.playerId) ?? [];
    let current = 0;
    let best = 0;

    results.forEach((result) => {
      if (result === "W" || result === "T") {
        current += 1;
        best = Math.max(best, current);
      } else {
        current = 0;
      }
    });

    record.unbeatenStreak = best;
  });

  return Array.from(records.values());
}

function RecordSection({
  title,
  subtitle,
  rows,
  valueLabel,
}: {
  title: string;
  subtitle: string;
  rows: RecordRow[];
  valueLabel?: string;
}) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-danvers-surface p-6">
      <p className="text-xs font-bold uppercase tracking-[0.3em] text-danvers-gold">
        {subtitle}
      </p>

      <h2 className="mt-2 text-3xl font-black">{title}</h2>

      <div className="mt-5 grid gap-3">
        {rows.length ? (
          rows.map((row, index) => {
            const content = (
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/25 p-4">
                <p className="font-black">
                  {index + 1}. {row.name}
                </p>

                <p className="text-right font-black text-danvers-gold">
                  {row.value}
                  {valueLabel ? (
                    <span className="ml-1 text-xs uppercase tracking-[0.15em] text-danvers-muted">
                      {valueLabel}
                    </span>
                  ) : null}
                </p>
              </div>
            );

            return row.href ? (
              <Link
                key={row.id}
                href={row.href}
                className="block transition hover:opacity-80"
              >
                {content}
              </Link>
            ) : (
              <div key={row.id}>{content}</div>
            );
          })
        ) : (
          <p className="text-danvers-muted">No records available yet.</p>
        )}
      </div>
    </section>
  );
}

export default async function RecordsPage() {
  const { data: players } = await supabase
    .from("players")
    .select("id, full_name")
    .order("full_name", { ascending: true });

  const { data: seasonPlayers } = await supabase
    .from("season_players")
    .select("player_id, seasons(id, year)");

  const { data: competitionResults } = await supabase
    .from("competition_results")
    .select(
      "player_id, points, players(id, full_name), competitions(name, is_visible, seasons(year))"
    )
    .not("player_id", "is", null)
    .eq("is_official", true);

  const { data: seasonResults } = await supabase
    .from("season_results")
    .select("season_id, team_champion_id, individual_champion_player_id")
    .eq("is_final", true);

  const { data: teamMembers } = await supabase
    .from("team_members")
    .select("player_id, teams(id, season_id)");

  const { data: matches } = await supabase
    .from("matches")
    .select(
      "id, team_a_player_ids, team_b_player_ids, winning_side, match_type, is_official, competitions(is_visible, rounds(round_date))"
    )
    .eq("is_official", true);

  const playerRows = (players as any[]) ?? [];
  const playerById = new Map(playerRows.map((player) => [player.id, player]));

  const visibleCompetitionResults = ((competitionResults as any[]) ?? []).filter(
    (result) => {
      const competition = getSingleRelation(result.competitions);
      return competition?.is_visible !== false;
    }
  );

  const visibleMatches = ((matches as any[]) ?? [])
    .filter((match) => {
      const competition = getSingleRelation(match.competitions);
      return competition?.is_visible !== false;
    })
    .sort((a, b) => {
      const competitionA = getSingleRelation(a.competitions);
      const competitionB = getSingleRelation(b.competitions);
      const roundA = getSingleRelation(competitionA?.rounds);
      const roundB = getSingleRelation(competitionB?.rounds);

      return String(roundA?.round_date ?? "").localeCompare(
        String(roundB?.round_date ?? "")
      );
    });

  const careerPointsMap = new Map<string, number>();

  visibleCompetitionResults.forEach((result) => {
    if (!result.player_id) return;

    careerPointsMap.set(
      result.player_id,
      (careerPointsMap.get(result.player_id) ?? 0) + Number(result.points ?? 0)
    );
  });

  const mostCareerPoints = Array.from(careerPointsMap.entries())
    .map(([playerId, points]) => ({
      id: playerId,
      name: playerById.get(playerId)?.full_name ?? "Unknown Player",
      value: formatPoints(points),
      href: `/players/${playerId}`,
    }))
    .sort((a, b) => Number(b.value) - Number(a.value))
    .slice(0, 10);

  const appearancesMap = new Map<string, number>();

  ((seasonPlayers as any[]) ?? []).forEach((row) => {
    appearancesMap.set(
      row.player_id,
      (appearancesMap.get(row.player_id) ?? 0) + 1
    );
  });

  const mostAppearances = Array.from(appearancesMap.entries())
    .map(([playerId, appearances]) => ({
      id: playerId,
      name: playerById.get(playerId)?.full_name ?? "Unknown Player",
      value: appearances,
      href: `/players/${playerId}`,
    }))
    .sort((a, b) => Number(b.value) - Number(a.value))
    .slice(0, 10);

  const individualTitleMap = new Map<string, number>();

  ((seasonResults as any[]) ?? []).forEach((result) => {
    if (!result.individual_champion_player_id) return;

    individualTitleMap.set(
      result.individual_champion_player_id,
      (individualTitleMap.get(result.individual_champion_player_id) ?? 0) + 1
    );
  });

  const mostIndividualTitles = Array.from(individualTitleMap.entries())
    .map(([playerId, titles]) => ({
      id: playerId,
      name: playerById.get(playerId)?.full_name ?? "Unknown Player",
      value: titles,
      href: `/players/${playerId}`,
    }))
    .sort((a, b) => Number(b.value) - Number(a.value))
    .slice(0, 10);

  const teamTitleMap = new Map<string, number>();

  ((seasonResults as any[]) ?? []).forEach((result) => {
    if (!result.team_champion_id) return;

    ((teamMembers as any[]) ?? [])
      .filter((membership) => {
        const team = getSingleRelation(membership.teams);
        return (
          team?.id === result.team_champion_id &&
          team?.season_id === result.season_id
        );
      })
      .forEach((membership) => {
        teamTitleMap.set(
          membership.player_id,
          (teamTitleMap.get(membership.player_id) ?? 0) + 1
        );
      });
  });

  const mostTeamTitles = Array.from(teamTitleMap.entries())
    .map(([playerId, titles]) => ({
      id: playerId,
      name: playerById.get(playerId)?.full_name ?? "Unknown Player",
      value: titles,
      href: `/players/${playerId}`,
    }))
    .sort((a, b) => Number(b.value) - Number(a.value))
    .slice(0, 10);

  const officialMatchesWithPlayers = visibleMatches.map((match) => ({
    ...match,
    team_a_players: (match.team_a_player_ids ?? [])
      .map((playerId: string) => playerById.get(playerId))
      .filter(Boolean),
    team_b_players: (match.team_b_player_ids ?? [])
      .map((playerId: string) => playerById.get(playerId))
      .filter(Boolean),
  }));

  const matchRecords = buildMatchRecords(officialMatchesWithPlayers);

  const bestMatchRecords = [...matchRecords]
    .sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (a.losses !== b.losses) return a.losses - b.losses;
      return b.ties - a.ties;
    })
    .map((record) => ({
      id: record.playerId,
      name: record.name,
      value: `${record.wins}-${record.losses}-${record.ties}`,
      href: `/players/${record.playerId}`,
    }))
    .slice(0, 10);

  const bestWinPercentage = [...matchRecords]
    .filter((record) => record.wins + record.losses + record.ties >= 2)
    .sort((a, b) => getWinPercentage(b) - getWinPercentage(a))
    .map((record) => ({
      id: record.playerId,
      name: record.name,
      value: `${getWinPercentage(record).toFixed(1)}%`,
      href: `/players/${record.playerId}`,
    }))
    .slice(0, 10);

  const mostMatchWins = [...matchRecords]
    .sort((a, b) => b.wins - a.wins)
    .map((record) => ({
      id: record.playerId,
      name: record.name,
      value: record.wins,
      href: `/players/${record.playerId}`,
    }))
    .slice(0, 10);

  const mostSinglesWins = [...matchRecords]
    .sort((a, b) => b.singlesWins - a.singlesWins)
    .map((record) => ({
      id: record.playerId,
      name: record.name,
      value: record.singlesWins,
      href: `/players/${record.playerId}`,
    }))
    .slice(0, 10);

  const longestUnbeatenStreaks = [...matchRecords]
    .sort((a, b) => b.unbeatenStreak - a.unbeatenStreak)
    .map((record) => ({
      id: record.playerId,
      name: record.name,
      value: record.unbeatenStreak,
      href: `/players/${record.playerId}`,
    }))
    .slice(0, 10);

  const seasonPointMap = new Map<
    string,
    { playerId: string; name: string; year: number | null; points: number }
  >();

  visibleCompetitionResults.forEach((result) => {
    if (!result.player_id) return;

    const competition = getSingleRelation(result.competitions);
    const season = getSingleRelation(competition?.seasons);
    const key = `${result.player_id}-${season?.year ?? "unknown"}`;

    const current = seasonPointMap.get(key) ?? {
      playerId: result.player_id,
      name: playerById.get(result.player_id)?.full_name ?? "Unknown Player",
      year: season?.year ?? null,
      points: 0,
    };

    current.points += Number(result.points ?? 0);
    seasonPointMap.set(key, current);
  });

  const bestSingleSeasons = Array.from(seasonPointMap.values())
    .sort((a, b) => b.points - a.points)
    .map((row) => ({
      id: `${row.playerId}-${row.year}`,
      name: `${row.name}${row.year ? ` (${row.year})` : ""}`,
      value: formatPoints(row.points),
      href: `/players/${row.playerId}`,
    }))
    .slice(0, 10);

  const bestSingleCompetitions = visibleCompetitionResults
    .map((result) => {
      const competition = getSingleRelation(result.competitions);

      return {
        id: `${result.player_id}-${competition?.name ?? "competition"}`,
        name: `${playerById.get(result.player_id)?.full_name ?? "Unknown Player"} · ${
          competition?.name ?? "Competition"
        }`,
        value: formatPoints(Number(result.points ?? 0)),
        href: `/players/${result.player_id}`,
      };
    })
    .sort((a, b) => Number(b.value) - Number(a.value))
    .slice(0, 10);

  return (
    <main className="min-h-screen px-5 pb-24 pt-6 text-danvers-text">
      <section className="mx-auto max-w-5xl">
        <Link
          href="/history"
          className="text-xs font-black uppercase tracking-[0.18em] text-danvers-gold"
        >
          ← Back to History
        </Link>

        <section className="mt-5 rounded-[2rem] border border-danvers-green/40 bg-gradient-to-br from-danvers-surface via-danvers-background to-black p-6">
          <p className="text-sm font-black uppercase tracking-[0.45em] text-danvers-gold">
            Danvers Cup
          </p>

          <h1 className="mt-4 text-5xl font-black">Record Book</h1>

          <p className="mt-4 max-w-2xl text-sm leading-6 text-danvers-muted">
            Career points, appearances, titles, match records, and the growing
            statistical history of the Danvers Cup.
          </p>
        </section>

        <section className="mt-8 grid gap-4">
          <RecordSection
            title="Most Career Points"
            subtitle="Career"
            rows={mostCareerPoints}
            valueLabel="pts"
          />

          <RecordSection
            title="Best Single Season"
            subtitle="Season Records"
            rows={bestSingleSeasons}
            valueLabel="pts"
          />

          <RecordSection
            title="Best Single Competition"
            subtitle="Competition Records"
            rows={bestSingleCompetitions}
            valueLabel="pts"
          />

          <RecordSection
            title="Most Appearances"
            subtitle="Longevity"
            rows={mostAppearances}
          />

          <RecordSection
            title="Most Team Titles"
            subtitle="Championships"
            rows={mostTeamTitles}
          />

          <RecordSection
            title="Most Individual Titles"
            subtitle="Championships"
            rows={mostIndividualTitles}
          />

          <RecordSection
            title="Best Match Records"
            subtitle="Match Play"
            rows={bestMatchRecords}
          />

          <RecordSection
            title="Best Match Win %"
            subtitle="Match Play"
            rows={bestWinPercentage}
          />

          <RecordSection
            title="Most Match Wins"
            subtitle="Match Play"
            rows={mostMatchWins}
          />

          <RecordSection
            title="Most Singles Wins"
            subtitle="Match Play"
            rows={mostSinglesWins}
          />

          <RecordSection
            title="Longest Unbeaten Streak"
            subtitle="Match Play"
            rows={longestUnbeatenStreaks}
          />
        </section>
      </section>
    </main>
  );
}