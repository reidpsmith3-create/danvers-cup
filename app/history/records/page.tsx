import Link from "next/link";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function formatPoints(points: number) {
  return Number.isInteger(points) ? String(points) : points.toFixed(1);
}

function getSingleRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function buildMatchRecords(matches: any[]) {
  const records = new Map<
    string,
    { playerId: string; name: string; wins: number; losses: number; ties: number }
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
      });
    }

    return records.get(player.id) ?? null;
  }

  matches.forEach((match) => {
    const sideAPlayers = match.team_a_players ?? [];
    const sideBPlayers = match.team_b_players ?? [];

    sideAPlayers.forEach((player: any) => {
      const record = ensurePlayer(player);
      if (!record) return;

      if (match.winning_side === "halved") record.ties += 1;
      else if (match.winning_side === "team_a") record.wins += 1;
      else if (match.winning_side === "team_b") record.losses += 1;
    });

    sideBPlayers.forEach((player: any) => {
      const record = ensurePlayer(player);
      if (!record) return;

      if (match.winning_side === "halved") record.ties += 1;
      else if (match.winning_side === "team_b") record.wins += 1;
      else if (match.winning_side === "team_a") record.losses += 1;
    });
  });

  return Array.from(records.values()).sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (a.losses !== b.losses) return a.losses - b.losses;
    return b.ties - a.ties;
  });
}

function RecordSection({
  title,
  subtitle,
  rows,
  valueLabel,
}: {
  title: string;
  subtitle: string;
  rows: { id: string; name: string; value: string | number; href?: string }[];
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
                <div>
                  <p className="font-black">
                    {index + 1}. {row.name}
                  </p>
                </div>

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
    .select("player_id, points, players(id, full_name)")
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
      "id, team_a_player_ids, team_b_player_ids, winning_side, is_official"
    )
    .eq("is_official", true);

  const playerRows = (players as any[]) ?? [];
  const playerById = new Map(playerRows.map((player) => [player.id, player]));

  const careerPointsMap = new Map<string, number>();

  ((competitionResults as any[]) ?? []).forEach((result) => {
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

  const officialMatchesWithPlayers = ((matches as any[]) ?? []).map((match) => ({
    ...match,
    team_a_players: (match.team_a_player_ids ?? [])
      .map((playerId: string) => playerById.get(playerId))
      .filter(Boolean),
    team_b_players: (match.team_b_player_ids ?? [])
      .map((playerId: string) => playerById.get(playerId))
      .filter(Boolean),
  }));

  const bestMatchRecords = buildMatchRecords(officialMatchesWithPlayers)
    .map((record) => ({
      id: record.playerId,
      name: record.name,
      value: `${record.wins}-${record.losses}-${record.ties}`,
      href: `/players/${record.playerId}`,
    }))
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
        </section>
      </section>
    </main>
  );
}